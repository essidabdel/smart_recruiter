# Generated migration to remove camembert_score field

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('applications', '0002_applicationscore_recommendation'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='applicationscore',
            name='camembert_score',
        ),
    ]
