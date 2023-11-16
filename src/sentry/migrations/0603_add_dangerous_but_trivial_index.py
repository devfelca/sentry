# Generated by Django 3.2.23 on 2023-11-15 23:26

from django.db import migrations, models

from sentry.models.broadcast import Broadcast
from sentry.new_migrations.migrations import CheckedMigration


class Migration(CheckedMigration):
    # not dangerous, just testing the post-deploy-migrations pipeline
    is_dangerous = True

    dependencies = [
        ("sentry", "0602_import_chunk_unique_together"),
    ]

    assert Broadcast._meta.model_name
    operations = [
        migrations.AddIndex(
            model_name=Broadcast._meta.model_name,
            index=models.Index(
                fields=[Broadcast.date_added.field.name],
                name="dangerous_but_trivial_idx",
            ),
        ),
    ]
