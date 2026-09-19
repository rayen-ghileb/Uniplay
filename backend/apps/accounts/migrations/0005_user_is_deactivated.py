from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0004_reclamation"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="is_deactivated",
            field=models.BooleanField(default=False),
        ),
    ]