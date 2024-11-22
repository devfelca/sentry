# Generated by Django 3.2.23 on 2023-11-06 23:34

from django.db import migrations

import sentry.db.models.fields.jsonfield
from sentry.new_migrations.migrations import CheckedMigration


class Migration(CheckedMigration):
    # This flag is used to mark that a migration shouldn't be automatically run in production. For
    # the most part, this should only be used for operations where it's safe to run the migration
    # after your code has deployed. So this should not be used for most operations that alter the
    # schema of a table.
    # Here are some things that make sense to mark as post deployment:
    # - Large data migrations. Typically we want these to be run manually by ops so that they can
    #   be monitored and not block the deploy for a long period of time while they run.
    # - Adding indexes to large tables. Since this can take a long time, we'd generally prefer to
    #   have ops run this and not block the deploy. Note that while adding an index is a schema
    #   change, it's completely safe to run the operation after the code has deployed.
    is_post_deployment = False

    allow_run_sql = True

    dependencies = [
        ("sentry", "0589_add_commit_date_added_indices"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AddField(
                    model_name="sentryapp",
                    name="metadata",
                    field=sentry.db.models.fields.jsonfield.JSONField(default=dict),
                ),
            ],
            database_operations=[
                migrations.RunSQL(
                    """
                    ALTER TABLE "sentry_sentryapp" ADD COLUMN "metadata" json NOT NULL DEFAULT '{}';
                    """,
                    reverse_sql="""
                        ALTER TABLE "sentry_sentryapp" DROP COLUMN "metadata";
                    """,
                    hints={"tables": ["sentry_sentryapp"]},
                )
            ],
        )
    ]
