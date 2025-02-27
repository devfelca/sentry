from collections.abc import Mapping
from dataclasses import dataclass
from enum import StrEnum
from typing import Any

from slack_sdk.errors import SlackApiError, SlackRequestError

from sentry.integrations.base import IntegrationDomain
from sentry.integrations.messaging.spec import MessagingIntegrationSpec
from sentry.integrations.slack.utils.errors import (
    SLACK_SDK_HALT_ERROR_CATEGORIES,
    SlackSdkErrorCategory,
    unpack_slack_api_error,
)
from sentry.integrations.types import ExternalProviderEnum
from sentry.integrations.utils.metrics import (
    EventLifecycle,
    IntegrationEventLifecycleMetric,
    IntegrationEventOutcomeHandler,
)
from sentry.integrations.utils.registry import integration_outcome_handler_registry
from sentry.models.organization import Organization
from sentry.organizations.services.organization import RpcOrganization
from sentry.users.models import User
from sentry.users.services.user import RpcUser


@integration_outcome_handler_registry.register(ExternalProviderEnum.SLACK.value)
class SlackMessagingInteractionUtility(IntegrationEventOutcomeHandler):
    @property
    def HALT_ERROR_CATEGORIES(self) -> set[SlackSdkErrorCategory]:
        return set(SLACK_SDK_HALT_ERROR_CATEGORIES)

    @staticmethod
    def record_lifecycle_termination_level(lifecycle: EventLifecycle, error: Exception) -> None:
        if not isinstance(error, (SlackApiError, SlackRequestError)):
            lifecycle.record_failure(error)
            return

        if (
            (reason := unpack_slack_api_error(error))
            and reason is not None
            and reason in SLACK_SDK_HALT_ERROR_CATEGORIES
        ):
            lifecycle.record_halt(reason.message)
        else:
            lifecycle.record_failure(error)


class MessagingInteractionType(StrEnum):
    """A way in which a user can interact with Sentry through a messaging app."""

    # Direct interactions with the user
    HELP = "HELP"
    LINK_IDENTITY = "LINK_IDENTITY"
    UNLINK_IDENTITY = "UNLINK_IDENTITY"
    LINK_TEAM = "LINK_TEAM"
    UNLINK_TEAM = "UNLINK_TEAM"

    # Interactions on Issues
    STATUS = "STATUS"
    ARCHIVE_DIALOG = "ARCHIVE_DIALOG"
    ARCHIVE = "ARCHIVE"
    ASSIGN_DIALOG = "ASSIGN_DIALOG"
    ASSIGN = "ASSIGN"
    UNASSIGN = "ASSIGN"
    RESOLVE_DIALOG = "RESOLVE_DIALOG"
    RESOLVE = "RESOLVE"
    UNRESOLVE = "UNRESOLVE"
    IGNORE = "IGNORE"
    MARK_ONGOING = "MARK_ONGOING"
    VIEW_SUBMISSION = "VIEW_SUBMISSION"

    # Automatic behaviors
    UNFURL_ISSUES = "UNFURL_ISSUES"
    UNFURL_METRIC_ALERTS = "UNFURL_METRIC_ALERTS"
    UNFURL_DISCOVER = "UNFURL_DISCOVER"

    GET_PARENT_NOTIFICATION = "GET_PARENT_NOTIFICATION"

    SEND_INCIDENT_ALERT_NOTIFICATION = "SEND_INCIDENT_ALERT_NOTIFICATION"
    SEND_ISSUE_ALERT_NOTIFICATION = "SEND_ISSUE_ALERT_NOTIFICATION"

    SEND_ACTIVITY_NOTIFICATION = "SEND_ACTIVITY_NOTIFICATION"
    SEND_GENERIC_NOTIFICATION = "SEND_GENERIC_NOTIFICATION"


@dataclass
class MessagingInteractionEvent(IntegrationEventLifecycleMetric):
    """An instance to be recorded of a user interacting through a messaging app."""

    interaction_type: MessagingInteractionType
    spec: MessagingIntegrationSpec

    # Optional attributes to populate extras
    user: User | RpcUser | None = None
    organization: Organization | RpcOrganization | None = None

    def record_lifecycle_termination_level(
        self, lifecycle: EventLifecycle, error: Exception
    ) -> None:
        return integration_outcome_handler_registry.get(
            self.spec.provider_slug
        ).record_lifecycle_termination_level(lifecycle, error)

    def get_integration_domain(self) -> IntegrationDomain:
        return IntegrationDomain.MESSAGING

    def get_integration_name(self) -> str:
        return self.spec.provider_slug

    def get_interaction_type(self) -> str:
        return str(self.interaction_type)

    def get_extras(self) -> Mapping[str, Any]:
        return {
            "user_id": (self.user.id if self.user else None),
            "organization_id": (self.organization.id if self.organization else None),
        }


class MessageCommandHaltReason(StrEnum):
    """Common reasons why a messaging command may halt without success/failure."""

    # Identity Linking
    ALREADY_LINKED = "already_linked"
    NOT_LINKED = "not_linked"

    # Team Linking
    LINK_FROM_CHANNEL = "link_from_channel"
    LINK_USER_FIRST = "link_user_first"
    TEAM_NOT_LINKED = "team_not_linked"
    INSUFFICIENT_ROLE = "insufficient_role"


class MessageCommandFailureReason(StrEnum):
    """Common reasons why a messaging command may fail."""

    MISSING_DATA = "missing_data"
    INVALID_STATE = "invalid_state"


class MessageInteractionFailureReason(StrEnum):
    """Common reasons why a messaging interaction may fail."""

    MISSING_ACTION = "missing_action"
