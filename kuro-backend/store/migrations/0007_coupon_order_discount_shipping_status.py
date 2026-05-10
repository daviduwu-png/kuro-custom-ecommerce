from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('store', '0006_order_tracking_url'),
    ]

    operations = [
        migrations.CreateModel(
            name='Coupon',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(db_index=True, max_length=50, unique=True)),
                ('discount_type', models.CharField(choices=[('percent', 'Porcentaje'), ('fixed', 'Monto fijo')], max_length=10)),
                ('value', models.DecimalField(decimal_places=2, help_text='Porcentaje (0-100) o monto en MXN', max_digits=10)),
                ('valid_from', models.DateTimeField(blank=True, null=True)),
                ('valid_until', models.DateTimeField(blank=True, null=True)),
                ('max_uses', models.PositiveIntegerField(blank=True, help_text='Máximo de usos total; vacío = ilimitado', null=True)),
                ('times_used', models.PositiveIntegerField(default=0)),
                ('min_purchase', models.DecimalField(blank=True, decimal_places=2, help_text='Compra mínima en MXN', max_digits=10, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.AddField(
            model_name='order',
            name='shipping_status',
            field=models.CharField(
                choices=[('pending', 'Sin envío'), ('label_created', 'Guía generada'), ('in_transit', 'En tránsito'), ('delivered', 'Entregado')],
                default='pending',
                help_text='Estado del envío (Skydropx / paquetería)',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='order',
            name='discount_amount',
            field=models.DecimalField(decimal_places=2, default=0, help_text='Descuento aplicado por cupón', max_digits=10),
        ),
        migrations.AddField(
            model_name='order',
            name='coupon',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='orders', to='store.coupon'),
        ),
    ]
