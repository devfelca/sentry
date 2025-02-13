# Generated by Django 5.1.4 on 2024-12-18 22:26

import django.db.models.deletion
from django.db import migrations, models

import sentry.db.models.fields.foreignkey
from sentry.new_migrations.migrations import CheckedMigration
from sentry.new_migrations.monkey.fields import SafeRemoveField
from sentry.new_migrations.monkey.models import SafeDeleteModel
from sentry.new_migrations.monkey.state import DeletionAction


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

    is_post_deployment = False

    dependencies = [
        ("uptime", "0019_uptime_region"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.RemoveField(
                    model_name="uptimesubscription",
                    name="regions",
                ),
            ]
        ),
        migrations.AlterField(
            model_name="uptimesubscriptionregion",
            name="uptime_subscription",
            field=sentry.db.models.fields.foreignkey.FlexibleForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="regions",
                to="uptime.uptimesubscription",
            ),
        ),
        migrations.RemoveConstraint(
            model_name="uptimesubscriptionregion",
            name="uptime_uptimesubscription_region_unique",
        ),
        migrations.AddField(
            model_name="uptimesubscriptionregion",
            name="region_slug",
            field=models.CharField(db_index=True, default="", db_default="", max_length=255),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name="uptimesubscriptionregion",
            name="region",
            field=sentry.db.models.fields.foreignkey.FlexibleForeignKey(
                null=True,
                db_constraint=False,
                on_delete=django.db.models.deletion.CASCADE,
                to="uptime.region",
            ),
        ),
        migrations.AddConstraint(
            model_name="uptimesubscriptionregion",
            constraint=models.UniqueConstraint(
                models.F("uptime_subscription"),
                models.F("region_slug"),
                name="uptime_uptimesubscription_region_slug_unique",
            ),
        ),
        SafeRemoveField(
            model_name="uptimesubscriptionregion",
            name="region",
            deletion_action=DeletionAction.MOVE_TO_PENDING,
        ),
        SafeDeleteModel(name="Region", deletion_action=DeletionAction.MOVE_TO_PENDING),
    ]
