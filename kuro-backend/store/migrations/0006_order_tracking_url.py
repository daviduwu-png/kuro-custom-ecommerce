from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0005_payment_info_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='tracking_url',
            field=models.URLField(
                blank=True,
                null=True,
                max_length=500,
                help_text='URL de rastreo del paquete (Skydropx)',
            ),
        ),
    ]
