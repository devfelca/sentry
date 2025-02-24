# Generated by Django 5.1.5 on 2025-02-10 19:33

import dataclasses
import logging
from enum import Enum, IntEnum, StrEnum
from typing import Any

from django.apps.registry import Apps
from django.db import migrations, router, transaction
from django.db.backends.base.schema import BaseDatabaseSchemaEditor

from sentry.new_migrations.migrations import CheckedMigration
from sentry.utils.query import RangeQuerySetWrapperWithProgressBarApprox

logger = logging.getLogger(__name__)


class PriorityLevel(IntEnum):
    LOW = 25
    MEDIUM = 50
    HIGH = 75


class DetectorPriorityLevel(IntEnum):
    OK = 0
    LOW = PriorityLevel.LOW
    MEDIUM = PriorityLevel.MEDIUM
    HIGH = PriorityLevel.HIGH


class IncidentStatus(Enum):
    OPEN = 1
    CLOSED = 2
    WARNING = 10
    CRITICAL = 20


class IncidentType(Enum):
    DETECTED = 0
    ALERT_TRIGGERED = 2


class AlertRuleStatus(Enum):
    PENDING = 0
    SNAPSHOT = 4
    DISABLED = 5
    NOT_ENOUGH_DATA = 6


class AlertRuleThresholdType(Enum):
    ABOVE = 0
    BELOW = 1
    ABOVE_AND_BELOW = 2


class Condition(StrEnum):
    EQUAL = "eq"
    GREATER_OR_EQUAL = "gte"
    GREATER = "gt"
    LESS_OR_EQUAL = "lte"
    LESS = "lt"
    ISSUE_PRIORITY_EQUALS = "issue_priority_equals"


class AlertRuleActivityType(Enum):
    CREATED = 1
    DELETED = 2
    UPDATED = 3
    ENABLED = 4
    DISABLED = 5
    SNAPSHOT = 6
    ACTIVATED = 7
    DEACTIVATED = 8


class ActionType(StrEnum):
    SLACK = "slack"
    MSTEAMS = "msteams"
    DISCORD = "discord"

    PAGERDUTY = "pagerduty"
    OPSGENIE = "opsgenie"

    GITHUB = "github"
    GITHUB_ENTERPRISE = "github_enterprise"
    JIRA = "jira"
    JIRA_SERVER = "jira_server"
    AZURE_DEVOPS = "azure_devops"

    EMAIL = "email"
    SENTRY_APP = "sentry_app"

    PLUGIN = "plugin"
    WEBHOOK = "webhook"


FIELDS_TO_DETECTOR_FIELDS = {
    "name": "name",
    "description": "description",
    "user_id": "owner_user_id",
    "team_id": "owner_team_id",
}

TYPE_TO_PROVIDER = {
    0: "email",
    1: "pagerduty",
    2: "slack",
    3: "msteams",
    4: "sentry_app",
    6: "opsgenie",
    7: "discord",
}

PRIORITY_MAP = {
    "warning": DetectorPriorityLevel.MEDIUM,
    "critical": DetectorPriorityLevel.HIGH,
}

OPSGENIE_DEFAULT_PRIORITY = "P3"
PAGERDUTY_DEFAULT_SEVERITY = "default"


@dataclasses.dataclass
class SentryAppFormConfigDataBlob:
    """
    SentryAppFormConfigDataBlob represents a single form config field for a Sentry App.
    name is the name of the form field, and value is the value of the form field.
    """

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "SentryAppFormConfigDataBlob":
        if not isinstance(data.get("name"), str) or not isinstance(data.get("value"), str):
            raise ValueError("Sentry app config must contain name and value keys")
        return cls(name=data["name"], value=data["value"])

    name: str = ""
    value: str = ""


@dataclasses.dataclass
class SentryAppDataBlob:
    """
    Represents a Sentry App notification action.
    """

    settings: list[SentryAppFormConfigDataBlob] = dataclasses.field(default_factory=list)

    @classmethod
    def from_list(cls, data: list[dict[str, Any]] | None) -> "SentryAppDataBlob":
        if data is None:
            return cls()
        return cls(settings=[SentryAppFormConfigDataBlob.from_dict(setting) for setting in data])


@dataclasses.dataclass
class OnCallDataBlob:
    """
    OnCallDataBlob is a specific type that represents the data blob for a PagerDuty or Opsgenie notification action.
    """

    priority: str = ""


def migrate_metric_alerts(apps: Apps, schema_editor: BaseDatabaseSchemaEditor) -> None:
    AlertRule = apps.get_model("sentry", "AlertRule")
    AlertRuleTrigger = apps.get_model("sentry", "AlertRuleTrigger")
    AlertRuleTriggerAction = apps.get_model("sentry", "AlertRuleTriggerAction")
    AlertRuleActivity = apps.get_model("sentry", "AlertRuleActivity")
    RuleSnooze = apps.get_model("sentry", "RuleSnooze")
    QuerySubscription = apps.get_model("sentry", "QuerySubscription")
    Incident = apps.get_model("sentry", "Incident")

    Action = apps.get_model("workflow_engine", "Action")
    ActionAlertRuleTriggerAction = apps.get_model("workflow_engine", "ActionAlertRuleTriggerAction")
    AlertRuleDetector = apps.get_model("workflow_engine", "AlertRuleDetector")
    AlertRuleWorkflow = apps.get_model("workflow_engine", "AlertRuleWorkflow")
    DataCondition = apps.get_model("workflow_engine", "DataCondition")
    DataConditionGroup = apps.get_model("workflow_engine", "DataConditionGroup")
    DataConditionGroupAction = apps.get_model("workflow_engine", "DataConditionGroupAction")
    DataSource = apps.get_model("workflow_engine", "DataSource")
    Detector = apps.get_model("workflow_engine", "Detector")
    DetectorState = apps.get_model("workflow_engine", "DetectorState")
    DetectorWorkflow = apps.get_model("workflow_engine", "DetectorWorkflow")
    Workflow = apps.get_model("workflow_engine", "Workflow")
    WorkflowDataConditionGroup = apps.get_model("workflow_engine", "WorkflowDataConditionGroup")

    for alert_rule in RangeQuerySetWrapperWithProgressBarApprox(
        AlertRule.objects_with_snapshots.all()
    ):
        if alert_rule.status in [AlertRuleStatus.DISABLED, AlertRuleStatus.SNAPSHOT]:
            continue
        if alert_rule.detection_type == "dynamic":
            logger.info(
                "anomaly detection alert rule, skipping", extra={"alert_rule_id": alert_rule.id}
            )
            continue

        if AlertRuleDetector.objects.filter(alert_rule_id=alert_rule.id).exists():
            # in case we need to restart the migration for some reason, skip rules
            # that have already been migrated
            continue

        organization_id = alert_rule.organization_id
        if organization_id != 1:
            # we'll first test the migration on just the Sentry org
            continue

        try:
            with transaction.atomic(router.db_for_write(AlertRule)):
                project = alert_rule.projects.get()
                snoozed = None
                try:
                    snoozed = RuleSnooze.objects.get(alert_rule_id=alert_rule.id, user_id=None)
                except RuleSnooze.DoesNotExist:
                    pass
                enabled = True if snoozed is None else False

                create_activity = AlertRuleActivity.objects.get(
                    alert_rule_id=alert_rule.id, type=AlertRuleActivityType.CREATED.value
                )

                # create data source
                snuba_query = alert_rule.snuba_query
                if not snuba_query:
                    logger.info(
                        "alert rule missing snuba query", extra={"alert_rule_id": alert_rule.id}
                    )
                    raise Exception("Alert rule missing snuba query")
                try:
                    query_subscription = QuerySubscription.objects.get(snuba_query=snuba_query.id)
                except QuerySubscription.DoesNotExist:
                    logger.info(
                        "query subscription does not exist",
                        extra={"snuba_query_id": snuba_query.id},
                    )
                    raise Exception("Query subscription does not exist")
                data_source = DataSource.objects.create(
                    organization_id=organization_id,
                    source_id=str(query_subscription.id),
                    type="snuba_query_subscription",
                )

                # create detector DCG
                data_condition_group = DataConditionGroup.objects.create(
                    organization_id=organization_id,
                )
                # create detector
                detector = Detector.objects.create(
                    project_id=project.id,
                    enabled=enabled,
                    created_by_id=create_activity.user_id,
                    name=alert_rule.name,
                    workflow_condition_group=data_condition_group,
                    type="metric_alert_fire",
                    description=alert_rule.description,
                    owner_user_id=alert_rule.user_id,
                    owner_team=alert_rule.team,
                    config={
                        "threshold_period": alert_rule.threshold_period,
                        "sensitivity": alert_rule.sensitivity,
                        "seasonality": alert_rule.seasonality,
                        "comparison_delta": alert_rule.comparison_delta,
                        "detection_type": alert_rule.detection_type,
                    },
                )
                # create workflow
                workflow = Workflow.objects.create(
                    name=alert_rule.name,
                    organization_id=organization_id,
                    when_condition_group=None,
                    enabled=True,
                    created_by_id=create_activity.user_id,
                    config={},
                )

                try:
                    incident_query = Incident.objects.filter(
                        type=IncidentType.ALERT_TRIGGERED.value,
                        alert_rule=alert_rule,
                        projects=project,
                    )
                    open_incident = incident_query.exclude(
                        status=IncidentStatus.CLOSED.value
                    ).order_by("-date_added")[0]
                except IndexError:
                    open_incident = None
                if open_incident:
                    state = (
                        DetectorPriorityLevel.MEDIUM
                        if open_incident.status == IncidentStatus.WARNING.value
                        else DetectorPriorityLevel.HIGH
                    )
                else:
                    state = DetectorPriorityLevel.OK

                data_source.detectors.set([detector])
                # create detector state
                DetectorState.objects.create(
                    detector=detector,
                    active=True if open_incident else False,
                    state=state,
                )
                # create lookup tables
                AlertRuleDetector.objects.create(alert_rule=alert_rule, detector=detector)
                alert_rule_workflow = AlertRuleWorkflow.objects.create(
                    alert_rule=alert_rule, workflow=workflow
                )
                DetectorWorkflow.objects.create(detector=detector, workflow=workflow)

                # migrate triggers
                triggers = AlertRuleTrigger.objects.filter(alert_rule_id=alert_rule.id)
                for trigger in triggers:
                    threshold_type = (
                        Condition.GREATER
                        if alert_rule.threshold_type == AlertRuleThresholdType.ABOVE.value
                        else Condition.LESS
                    )
                    condition_result = PRIORITY_MAP.get(trigger.label, DetectorPriorityLevel.HIGH)
                    # create detector trigger
                    DataCondition.objects.create(
                        comparison=trigger.alert_threshold,
                        condition_result=condition_result,
                        type=threshold_type,
                        condition_group=detector.workflow_condition_group,
                    )
                    # create action filter
                    data_condition_group = DataConditionGroup.objects.create(
                        organization_id=alert_rule.organization_id
                    )
                    WorkflowDataConditionGroup.objects.create(
                        condition_group=data_condition_group,
                        workflow=alert_rule_workflow.workflow,
                    )
                    action_filter = DataCondition.objects.create(
                        comparison=PRIORITY_MAP.get(trigger.label, DetectorPriorityLevel.HIGH),
                        condition_result=True,
                        type=Condition.ISSUE_PRIORITY_EQUALS,
                        condition_group=data_condition_group,
                    )

                    trigger_actions = AlertRuleTriggerAction.objects.filter(
                        alert_rule_trigger=trigger
                    )
                    for trigger_action in trigger_actions:
                        if trigger_action.sentry_app_id:
                            action_type = ActionType.SENTRY_APP

                        elif trigger_action.integration_id:
                            try:
                                action_type = ActionType(TYPE_TO_PROVIDER[trigger_action.type])
                            except Exception:
                                logger.info(
                                    "could not find a matching action type for the trigger action",
                                    extra={"trigger_action_id": trigger_action.id},
                                )
                                raise
                        else:
                            action_type = ActionType.EMAIL

                        # build data blob
                        if action_type == ActionType.SENTRY_APP:
                            if not trigger_action.sentry_app_config:
                                data = {}
                            settings = (
                                [trigger_action.sentry_app_config]
                                if isinstance(trigger_action.sentry_app_config, dict)
                                else trigger_action.sentry_app_config
                            )
                            data = dataclasses.asdict(SentryAppDataBlob.from_list(settings))
                        elif action_type in (ActionType.OPSGENIE, ActionType.PAGERDUTY):
                            default_priority = (
                                OPSGENIE_DEFAULT_PRIORITY
                                if action_type == ActionType.OPSGENIE
                                else PAGERDUTY_DEFAULT_SEVERITY
                            )

                            if not trigger_action.sentry_app_config:
                                data = {"priority": default_priority}

                            # Ensure sentry_app_config is a dict before accessing
                            config = trigger_action.sentry_app_config
                            if not isinstance(config, dict):
                                data = {"priority": default_priority}
                            else:
                                priority = config.get("priority", default_priority)
                                data = dataclasses.asdict(OnCallDataBlob(priority=priority))
                        else:
                            data = {
                                "type": trigger_action.type,
                                "sentry_app_id": trigger_action.sentry_app_id,
                                "sentry_app_config": trigger_action.sentry_app_config,
                            }

                        # get target identifier
                        if action_type == ActionType.SENTRY_APP:
                            if not trigger_action.sentry_app_id:
                                logger.info(
                                    "trigger action missing sentry app ID",
                                    extra={"trigger_action_id": trigger_action.id},
                                )
                                raise Exception("Trigger action missing Sentry app ID")
                            target_identifier = str(trigger_action.sentry_app_id)
                        else:
                            target_identifier = trigger_action.target_identifier

                        # create the models
                        action = Action.objects.create(
                            type=action_type,
                            data=data,
                            integration_id=trigger_action.integration_id,
                            target_display=trigger_action.target_display,
                            target_identifier=target_identifier,
                            target_type=trigger_action.target_type,
                        )
                        DataConditionGroupAction.objects.create(
                            condition_group_id=action_filter.condition_group.id,
                            action_id=action.id,
                        )
                        ActionAlertRuleTriggerAction.objects.create(
                            action_id=action.id,
                            alert_rule_trigger_action_id=trigger_action.id,
                        )

                # migrate resolve threshold
                resolve_threshold_type = (
                    Condition.LESS_OR_EQUAL
                    if alert_rule.threshold_type == AlertRuleThresholdType.ABOVE.value
                    else Condition.GREATER_OR_EQUAL
                )
                if alert_rule.resolve_threshold is not None:
                    resolve_threshold = alert_rule.resolve_threshold
                else:
                    detector_triggers = DataCondition.objects.filter(
                        condition_group=detector.workflow_condition_group
                    )
                    warning_data_condition = detector_triggers.filter(
                        condition_result=DetectorPriorityLevel.MEDIUM
                    ).first()
                    if warning_data_condition is not None:
                        resolve_threshold = warning_data_condition.comparison
                    else:
                        critical_data_condition = detector_triggers.filter(
                            condition_result=DetectorPriorityLevel.HIGH
                        ).first()
                        if critical_data_condition is None:
                            logger.info(
                                "no critical or warning data conditions exist for detector data condition group",
                                extra={"detector_data_condition_group": detector_triggers},
                            )
                            raise Exception(
                                "No critical or warning data conditions exist for detector data condition group"
                            )
                        else:
                            resolve_threshold = critical_data_condition.comparison
                    DataCondition.objects.create(
                        comparison=resolve_threshold,
                        condition_result=DetectorPriorityLevel.OK,
                        type=resolve_threshold_type,
                        condition_group=detector.workflow_condition_group,
                    )

                    data_condition_group = DataConditionGroup.objects.create(
                        organization_id=alert_rule.organization_id
                    )
                    AlertRuleWorkflow.objects.get(alert_rule=alert_rule)
                    WorkflowDataConditionGroup.objects.create(
                        condition_group=data_condition_group,
                        workflow=alert_rule_workflow.workflow,
                    )

                    DataCondition.objects.create(
                        comparison=DetectorPriorityLevel.OK,
                        condition_result=True,
                        type=Condition.ISSUE_PRIORITY_EQUALS,
                        condition_group=data_condition_group,
                    )
        except Exception as e:
            logger.info(
                "error when migrating alert rule",
                extra={"error": str(e), "alert_rule_id": alert_rule.id},
            )
            continue


class Migration(CheckedMigration):
    # This flag is used to mark that a migration shouldn't be automatically run in production.
    # This should only be used for operations where it's safe to run the migration after your
    # code has deployed. So this should not be used for most operations that alter the schema
    # of a table.
    # Here are some things that make sense to mark as post deployment:
    # - Large data migrations. Typically we want these to be run manually so that they can be
    #   monitored and not block the deploy for a long period of time while they run.
    # - Adding indexes to large tables. Since this can take a long time, we'd generally prefer to
    #   run this outside deployments so that we don't block them. Note that while adding an index
    #   is a schema change, it's completely safe to run the operation after the code has deployed.
    # Once deployed, run these manually via: https://develop.sentry.dev/database-migrations/#migration-deployment

    is_post_deployment = True

    dependencies = [
        ("workflow_engine", "0032_remove_data_source_query_id"),
    ]

    operations = [
        migrations.RunPython(
            migrate_metric_alerts,
            migrations.RunPython.noop,
            hints={"tables": ["sentry_alertrule"]},
        ),
    ]
