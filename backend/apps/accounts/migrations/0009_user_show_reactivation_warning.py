from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0008_warning"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="show_reactivation_warning",
            field=models.BooleanField(default=False),
        ),
    ]