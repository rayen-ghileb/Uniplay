from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0011_user_is_employee"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="is_superadmin",
            field=models.BooleanField(default=False),
        ),
    ]
