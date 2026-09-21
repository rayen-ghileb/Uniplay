from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0010_user_sex_user_date_of_birth"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="is_employee",
            field=models.BooleanField(default=False, verbose_name="employé(e)"),
        ),
    ]