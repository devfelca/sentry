from unittest.mock import Mock, patch

from sentry.models.projectkey import ProjectKey, UseCase
from sentry.tempest.models import MessageType
from sentry.tempest.tasks import (
    TempestAPIError,
    TempestError,
    fetch_latest_item_id,
    poll_tempest,
    poll_tempest_crashes,
)
from sentry.tempest.test_utils import create_mock_response
from sentry.testutils.cases import TestCase


class TempestTasksTest(TestCase):
    def setUp(self):
        super().setUp()
        self.project = self.create_project()
        self.credentials = self.create_tempest_credentials(self.project)

    @patch("sentry.tempest.tasks.fetch_latest_id_from_tempest")
    def test_fetch_latest_item_id_task(self, mock_fetch):
        mock_fetch.return_value = Mock()
        mock_fetch.return_value.json.return_value = {"latest_id": 20001}

        fetch_latest_item_id(self.credentials.id)

        self.credentials.refresh_from_db()
        assert (
            self.credentials.latest_fetched_item_id == "20001"
        )  # Since the ID is stored as a string
        mock_fetch.assert_called_once()

    @patch("sentry.tempest.tasks.fetch_latest_id_from_tempest")
    def test_fetch_latest_item_id_error(self, mock_fetch):
        mock_fetch.return_value = Mock()
        mock_fetch.return_value.json.return_value = {
            "error": {"type": "invalid_credentials", "message": "..."}
        }

        fetch_latest_item_id(self.credentials.id)

        self.credentials.refresh_from_db()
        assert self.credentials.message == "Seems like the provided credentials are invalid"
        assert self.credentials.message_type == MessageType.ERROR
        assert self.credentials.latest_fetched_item_id is None

    @patch("sentry.tempest.tasks.fetch_latest_id_from_tempest")
    def test_fetch_latest_item_id_ip_not_allowlisted(self, mock_fetch):
        mock_fetch.return_value = Mock()
        mock_fetch.return_value.json.return_value = {
            "error": {
                "type": "ip_not_allowlisted",
                "message": "...",
            }
        }

        fetch_latest_item_id(self.credentials.id)

        self.credentials.refresh_from_db()
        assert self.credentials.message == "Seems like our IP is not allow-listed"
        assert self.credentials.message_type == MessageType.ERROR
        assert self.credentials.latest_fetched_item_id is None

    @patch("sentry.tempest.tasks.fetch_latest_id_from_tempest")
    def test_fetch_latest_item_id_unexpected_response(self, mock_fetch):
        mock_fetch.return_value = Mock()
        mock_fetch.return_value.json.return_value = {
            "error": {
                "type": "internal_error",
                "message": "...",
            }
        }

        fetch_latest_item_id(self.credentials.id)

        self.credentials.refresh_from_db()
        assert self.credentials.latest_fetched_item_id is None
        assert self.credentials.message == ""  # No specific message set for unexpected responses
        mock_fetch.assert_called_once()

    @patch("sentry.tempest.tasks.fetch_latest_id_from_tempest")
    def test_fetch_latest_item_id_connection_error(self, mock_fetch):
        mock_fetch.side_effect = Exception("Connection error")

        with self.assertLogs("sentry.tempest.tasks", level="INFO") as cm:
            fetch_latest_item_id(self.credentials.id)

        self.credentials.refresh_from_db()
        assert self.credentials.latest_fetched_item_id is None
        assert self.credentials.message == ""
        mock_fetch.assert_called_once()
        assert "Fetching the latest item id failed." in cm.output[0]

    @patch("sentry.tempest.tasks.fetch_items_from_tempest")
    def test_poll_tempest_crashes_task(self, mock_fetch):
        mock_fetch.return_value = Mock()
        mock_fetch.return_value.json.return_value = {"latest_id": 20002}

        # Set this value since the test assumes that there is already an ID in the DB
        self.credentials.latest_fetched_item_id = "42"
        self.credentials.save()

        poll_tempest_crashes(self.credentials.id)

        self.credentials.refresh_from_db()
        assert self.credentials.latest_fetched_item_id == "20002"
        mock_fetch.assert_called_once()

    @patch("sentry.tempest.tasks.fetch_items_from_tempest")
    def test_poll_tempest_crashes_invalid_json(self, mock_fetch):
        mock_fetch.return_value = Mock()
        mock_fetch.return_value.json.return_value = {"error": "Some internal server error"}

        # Set this value since the test assumes that there is already an ID in the DB
        self.credentials.latest_fetched_item_id = "42"
        self.credentials.save()

        with self.assertLogs("sentry.tempest.tasks", level="INFO") as cm:
            poll_tempest_crashes(self.credentials.id)

        self.credentials.refresh_from_db()
        # ID should remain unchanged when JSON parsing fails
        assert self.credentials.latest_fetched_item_id == "42"
        mock_fetch.assert_called_once()
        assert "Fetching the crashes failed." in cm.output[0]

    @patch("sentry.tempest.tasks.fetch_items_from_tempest")
    def test_poll_tempest_crashes_error(self, mock_fetch):
        mock_fetch.side_effect = Exception("Connection error")

        # Set this value since the test assumes that there is already an ID in the DB
        self.credentials.latest_fetched_item_id = "42"
        self.credentials.save()

        with self.assertLogs("sentry.tempest.tasks", level="INFO") as cm:
            poll_tempest_crashes(self.credentials.id)

        # Should log error but not crash
        mock_fetch.assert_called_once()
        assert "Fetching the crashes failed." in cm.output[0]

    @patch("sentry.tempest.tasks.fetch_latest_item_id")
    @patch("sentry.tempest.tasks.poll_tempest_crashes")
    def test_poll_tempest_no_latest_id(self, mock_poll_crashes, mock_fetch_latest):
        # Ensure latest_fetched_item_id is None
        self.credentials.latest_fetched_item_id = None
        self.credentials.save()

        poll_tempest()

        # Should call fetch_latest_item_id and not poll_tempest_crashes
        mock_fetch_latest.apply_async.assert_called_once_with(
            kwargs={"credentials_id": self.credentials.id},
            headers={"sentry-propagate-traces": False},
        )
        mock_poll_crashes.apply_async.assert_not_called()

    @patch("sentry.tempest.tasks.fetch_latest_item_id")
    @patch("sentry.tempest.tasks.poll_tempest_crashes")
    def test_poll_tempest_with_latest_id(self, mock_poll_crashes, mock_fetch_latest):
        # Set an existing ID
        self.credentials.latest_fetched_item_id = "42"
        self.credentials.save()

        poll_tempest()

        # Should call poll_tempest_crashes and not fetch_latest_item_id
        mock_poll_crashes.apply_async.assert_called_once_with(
            kwargs={"credentials_id": self.credentials.id},
            headers={"sentry-propagate-traces": False},
        )
        mock_fetch_latest.apply_async.assert_not_called()

    def test_tempest_project_key(self):
        project = self.create_project()
        project_key_1, created = ProjectKey.objects.get_or_create(
            use_case=UseCase.TEMPEST, project=project
        )

        project_key_2, created_2 = ProjectKey.objects.get_or_create(
            use_case=UseCase.TEMPEST, project=project
        )

        assert created
        assert not created_2
        assert project_key_2.use_case == "UseCase.TEMPEST"
        assert project_key_1.id == project_key_2.id

    def test_tempest_screenshot_option(self):
        # Default should be False
        assert self.project.get_option("sentry:tempest_fetch_screenshots") is False

        self.project.update_option("sentry:tempest_fetch_screenshots", True)
        assert self.project.get_option("sentry:tempest_fetch_screenshots") is True

        self.project.update_option("sentry:tempest_fetch_screenshots", False)
        assert self.project.get_option("sentry:tempest_fetch_screenshots") is False

    @patch("sentry.tempest.tasks.schedule_invalidate_project_config")
    @patch("sentry.tempest.tasks.fetch_items_from_tempest")
    def test_poll_tempest_crashes_invalidates_config(self, mock_fetch, mock_invalidate):
        """Test that project config is invalidated only when a new ProjectKey is created"""
        mock_fetch.return_value.json.return_value = {"latest_id": "123"}

        self.credentials.latest_fetched_item_id = "42"
        self.credentials.save()

        # First call -> should create new ProjectKey and thus invalidate config
        poll_tempest_crashes(self.credentials.id)
        mock_invalidate.assert_called_once_with(
            project_id=self.project.id, trigger="tempest:poll_tempest_crashes"
        )
        mock_invalidate.reset_mock()

        # Second call -> should reuse existing ProjectKey and thus not invalidate config
        poll_tempest_crashes(self.credentials.id)
        mock_invalidate.assert_not_called()

    @patch("sentry.tempest.tasks.fetch_items_from_tempest")
    def test_poll_tempest_crashes_http_500_retry(self, mock_fetch):
        """Test that 500 errors trigger a retry with backoff"""
        # Setup initial state
        self.credentials.latest_fetched_item_id = "42"
        self.credentials.save()

        # Simulate a 500 error response
        mock_fetch.return_value = create_mock_response(500, {"error": "Internal Server Error"})

        # Should raise TempestAPIError to trigger retry
        with self.assertRaises(TempestAPIError) as cm:
            poll_tempest_crashes(self.credentials.id)

        self.assertEqual(cm.exception.status_code, 500)

        # Verify credentials were updated with error message
        self.credentials.refresh_from_db()
        assert self.credentials.message.startswith("Error fetching crashes")
        assert self.credentials.message_type == MessageType.ERROR
        assert self.credentials.latest_fetched_item_id == "42"  # Should not change

    @patch("sentry.tempest.tasks.fetch_items_from_tempest")
    def test_poll_tempest_crashes_invalid_json(self, mock_fetch):
        """Test handling of invalid JSON responses"""
        self.credentials.latest_fetched_item_id = "42"
        self.credentials.save()

        # Return invalid JSON response
        mock_fetch.return_value = create_mock_response(200, "Invalid JSON", is_json=False)

        with self.assertRaises(TempestAPIError) as cm:
            poll_tempest_crashes(self.credentials.id)

        assert "Invalid JSON response" in str(cm.exception)

        # Verify state preserved
        self.credentials.refresh_from_db()
        assert self.credentials.latest_fetched_item_id == "42"
        assert "Error fetching crashes" in self.credentials.message
        assert self.credentials.message_type == MessageType.ERROR

    @patch("sentry.tempest.tasks.fetch_items_from_tempest")
    def test_poll_tempest_crashes_missing_fields(self, mock_fetch):
        """Test handling of responses missing required fields"""
        self.credentials.latest_fetched_item_id = "42"
        self.credentials.save()

        # Return response missing latest_id
        mock_fetch.return_value = create_mock_response(200, {"data": "some data but no latest_id"})

        with self.assertRaises(TempestAPIError) as cm:
            poll_tempest_crashes(self.credentials.id)

        assert "Missing required fields" in str(cm.exception)
        assert "latest_id" in str(cm.exception)

        # Verify state preserved
        self.credentials.refresh_from_db()
        assert self.credentials.latest_fetched_item_id == "42"
        assert "Error fetching crashes" in self.credentials.message
        assert self.credentials.message_type == MessageType.ERROR

    @patch("sentry.tempest.tasks.fetch_items_from_tempest")
    def test_poll_tempest_crashes_race_condition(self, mock_fetch):
        """Test handling of concurrent updates to latest_fetched_item_id"""
        self.credentials.latest_fetched_item_id = "42"
        self.credentials.save()

        def side_effect(*args, **kwargs):
            # Simulate another process updating the ID while we're processing
            self.credentials.latest_fetched_item_id = "43"
            self.credentials.save()
            return create_mock_response(200, {"latest_id": "44"})

        mock_fetch.side_effect = side_effect

        poll_tempest_crashes(self.credentials.id)

        # Verify the update was atomic and preserved the latest value
        self.credentials.refresh_from_db()
        assert self.credentials.latest_fetched_item_id == "44"
        assert self.credentials.message == ""
        assert self.credentials.message_type == MessageType.INFO
