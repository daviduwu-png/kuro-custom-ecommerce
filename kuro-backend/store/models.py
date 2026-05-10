from django.db import models
from django.contrib.auth.models import User
from cloudinary.models import CloudinaryField 

# 1. PRODUCTOS (Info General)
class Product(models.Model):
    CATEGORIES = (
        ('playeras', 'Playeras'),
        ('sudaderas', 'Sudaderas'),
        ('gorras', 'Gorras'),
        ('tazas', 'Tazas'),
        ('shorts_box', 'Shorts para box'),
    )

    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=50, choices=CATEGORIES)
    image = CloudinaryField('image', folder='products', blank=True, null=True)
    is_customizable = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# 2. VARIANTES (Tallas y Stock)
class ProductVariant(models.Model):
    SIZES = (
        ('XS', 'Extra Chica'),
        ('S', 'Chica'),
        ('M', 'Mediana'),
        ('L', 'Grande'),
        ('XL', 'Extra Grande'),
        ('UNI', 'Unitalla'), 
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    size = models.CharField(max_length=5, choices=SIZES)
    stock = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.product.name} - {self.size}"

# 2.5 CUPONES
class Coupon(models.Model):
    DISCOUNT_TYPES = (
        ('percent', 'Porcentaje'),
        ('fixed', 'Monto fijo'),
    )
    code = models.CharField(max_length=50, unique=True, db_index=True)
    discount_type = models.CharField(max_length=10, choices=DISCOUNT_TYPES)
    value = models.DecimalField(max_digits=10, decimal_places=2, help_text="Porcentaje (0-100) o monto en MXN")
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    max_uses = models.PositiveIntegerField(null=True, blank=True, help_text="Máximo de usos total; vacío = ilimitado")
    times_used = models.PositiveIntegerField(default=0)
    min_purchase = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Compra mínima en MXN")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} ({self.get_discount_type_display()}: {self.value})"


# 3. ÓRDENES
class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pendiente'),
        ('paid', 'Pagado'),
        ('failed', 'Fallido'),
        ('shipped', 'Enviado'),
        ('cancelled', 'Cancelado'),
    )

    SHIPPING_STATUS_CHOICES = (
        ('pending', 'Sin envío'),
        ('label_created', 'Guía generada'),
        ('in_transit', 'En tránsito'),
        ('delivered', 'Entregado'),
    )

    PAYMENT_METHOD_CHOICES = (
        ('stripe', 'Stripe'),
        ('mercadopago', 'Mercado Pago'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    shipping_status = models.CharField(
        max_length=20, choices=SHIPPING_STATUS_CHOICES, default='pending',
        help_text="Estado del envío (Skydropx / paquetería)"
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0,
                                         help_text="Descuento aplicado por cupón")
    shipping_address = models.TextField()
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    tracking_url = models.URLField(max_length=500, blank=True, null=True, help_text="URL de rastreo del paquete (Skydropx)")
    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    # Stripe
    stripe_payment_id = models.CharField(max_length=200, blank=True, null=True, db_index=True)
    # Mercado Pago
    mp_preference_id = models.CharField(max_length=200, blank=True, null=True, db_index=True)
    mp_payment_id = models.CharField(max_length=200, blank=True, null=True, db_index=True)
    # Skydropx
    skydropx_shipment_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    # Método de pago usado
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, blank=True, null=True)
    # Información de la tarjeta (solo para Stripe)
    card_brand = models.CharField(max_length=20, blank=True, null=True,
                                  help_text="Ej: visa, mastercard, amex")
    card_last4 = models.CharField(max_length=4, blank=True, null=True,
                                  help_text="Últimos 4 dígitos de la tarjeta")
    # Razón del fallo (Stripe o MP)
    failure_reason = models.TextField(blank=True, null=True,
                                      help_text="Mensaje de error cuando el pago falla")
    # Fecha/hora en que el pago fue confirmado
    paid_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Orden #{self.id} - {self.user.username}"

# 4. ITEMS DE LA ORDEN
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True)
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2) 
    customization_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    final_unit_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True)

    def save(self, *args, **kwargs):
        if self.unit_price is None:
            self.unit_price = self.product.price
            
        self.final_unit_price = float(self.unit_price) + float(self.customization_fee)
        
        super().save(*args, **kwargs)

    @property
    def subtotal(self):
        return self.quantity * self.final_unit_price

    def __str__(self):
        tipo = "Custom" if self.customization_fee > 0 else "Base"
        return f"{self.quantity}x {self.product.name} ({tipo})"

# 5. PERSONALIZACIONES
class Customization(models.Model):
    order_item = models.OneToOneField(OrderItem, on_delete=models.CASCADE, related_name='customization')
    uploaded_image = CloudinaryField('image', folder='custom_uploads')
    
    base_color_hex = models.CharField(max_length=10, default="#ffffff")
    design_position_x = models.FloatField()
    design_position_y = models.FloatField()
    design_scale = models.FloatField(default=1.0)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Diseño para {self.order_item}"

# 6. DIRECCIONES DEL USUARIO
class UserAddress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    alias = models.CharField(max_length=50, blank=True, null=True, help_text="Ej: 'Mi casa', 'Oficina'")
    street = models.CharField(max_length=255, default='Desconocida')
    exterior_number = models.CharField(max_length=50, default='S/N')
    interior_number = models.CharField(max_length=50, blank=True, null=True)
    neighborhood = models.CharField(max_length=255, default='Desconocida')
    reference = models.TextField(blank=True, null=True, help_text="Ej. Casa blanca con portón azul")
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default='México')
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.is_default:
            # Desmarcar las otras direcciones por defecto del usuario
            UserAddress.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.alias or 'Dirección'} - {self.user.username}"