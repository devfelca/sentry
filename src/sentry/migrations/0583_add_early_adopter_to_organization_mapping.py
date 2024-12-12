# Generated by Django 3.2.20 on 2023-10-25 21:36

from django.db import migrations, models

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
        ("sentry", "0582_add_status_indexes_checkins"),
    ]

    new_flags = [
        "early_adopter",
        "allow_joinleave",
        "enhanced_privacy",
        "disable_shared_issues",
        "disable_new_visibility_features",
        "require_email_verification",
        "codecov_access",
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    f"""
                    ALTER TABLE "sentry_organizationmapping" ADD COLUMN "{column}" BOOLEAN NOT NULL DEFAULT false;
                    """,
                    reverse_sql=f"""
                ALTER TABLE "sentry_organizationmapping" DROP COLUMN "{column}";
                """,
                    hints={"tables": ["sentry_organizationmapping"]},
                )
                for column in new_flags
            ],
            state_operations=[
                migrations.AddField(
                    model_name="organizationmapping",
                    name=column,
                    field=models.BooleanField(default=False),
                )
                for column in new_flags
            ],
        )
    ]
