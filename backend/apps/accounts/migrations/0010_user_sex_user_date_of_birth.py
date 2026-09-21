from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0009_user_show_reactivation_warning"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="sex",
            field=models.CharField(
                blank=True,
                choices=[("F", "Femme"), ("M", "Homme"), ("O", "Autre")],
                max_length=1,
                verbose_name="sexe",
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="date_of_birth",
            field=models.DateField(blank=True, null=True, verbose_name="date de naissance"),
        ),
    ]
