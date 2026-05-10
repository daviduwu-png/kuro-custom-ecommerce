from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0008_order_skydropx_shipment_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='category',
            field=models.CharField(
                choices=[
                    ('playeras', 'Playeras'),
                    ('sudaderas', 'Sudaderas'),
                    ('gorras', 'Gorras'),
                    ('tazas', 'Tazas'),
                    ('shorts_box', 'Shorts para box'),
                ],
                max_length=50,
            ),
        ),
    ]
