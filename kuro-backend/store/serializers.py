from rest_framework import serializers
from django.utils import timezone
from .models import Product, Order, OrderItem, Customization, ProductVariant, UserAddress, Coupon
from django.contrib.auth.models import User
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db import transaction
from django.db.models import F


# PRODUCTOS    
class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'size', 'stock']


class ProductSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    variants = ProductVariantSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'description', 'price', 'category',
                  'image', 'is_customizable', 'variants']

    def get_image(self, obj):
        if obj.image:
            return obj.image.url
        return None

# PERSONALIZACIÓN
class CustomizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customization
        fields = ['id', 'order_item', 'uploaded_image', 'base_color_hex',
                  'design_position_x', 'design_position_y', 'design_scale',
                  'created_at']
        read_only_fields = ['id', 'created_at']

# ÓRDENES
class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'variant', 'quantity',
                  'unit_price', 'customization_fee', 'final_unit_price', 'subtotal']
        read_only_fields = ['id', 'final_unit_price', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    shipping_address_parsed = serializers.SerializerMethodField()
    coupon_code = serializers.SerializerMethodField()

    def get_coupon_code(self, obj):
        return (obj.coupon.code if obj.coupon else None)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'username', 'status', 'shipping_status', 'total_amount', 'discount_amount',
            'shipping_address', 'shipping_address_parsed',
            'tracking_number', 'tracking_url',
            'coupon', 'coupon_code',
            'payment_method',
            'stripe_payment_id',
            'mp_preference_id', 'mp_payment_id',
            'card_brand', 'card_last4',
            'failure_reason', 'paid_at',
            'created_at', 'items',
        ]
        read_only_fields = ['id', 'user', 'created_at']

    def get_shipping_address_parsed(self, obj):
        """
        Convierte el shipping_address (texto plano o JSON) a un
        diccionario estructurado para que el frontend pueda renderizarlo.
        """
        import json
        raw = obj.shipping_address or ''
        
        try:
            data = json.loads(raw)
            return {
                'full_name': data.get('name', ''),
                'street': data.get('street', ''),
                'neighborhood': data.get('neighborhood', ''),
                'city': data.get('city', ''),
                'state': data.get('state', ''),
                'postal_code': data.get('zip', ''),
                'phone': data.get('phone', '')
            }
        except json.JSONDecodeError:
            pass

        lines = [l.strip() for l in raw.strip().splitlines() if l.strip()]
        parsed = {}

        if len(lines) > 0:
            parsed['full_name'] = lines[0]
        if len(lines) > 1:
            street_line = lines[1]
            if ', Col. ' in street_line:
                parts = street_line.split(', Col. ', 1)
                parsed['street'] = parts[0].strip()
                parsed['neighborhood'] = parts[1].strip()
            else:
                parsed['street'] = street_line
        if len(lines) > 2:
            city_line = lines[2]
            if ',' in city_line:
                city_part, rest = city_line.split(',', 1)
                parsed['city'] = city_part.strip()
                rest = rest.strip()
                rest_parts = rest.split()
                if rest_parts and rest_parts[-1].isdigit():
                    parsed['postal_code'] = rest_parts[-1]
                    parsed['state'] = ' '.join(rest_parts[:-1]).strip()
                else:
                    parsed['state'] = rest
            else:
                parsed['city'] = city_line
        if len(lines) > 3:
            tel_line = lines[3]
            parsed['phone'] = tel_line.replace('Tel:', '').strip()

        return parsed


#  Serializer interno para items dentro de CreateOrderSerializer 
class CreateOrderItemSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    variant = serializers.PrimaryKeyRelatedField(queryset=ProductVariant.objects.all(),
                                                  required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1)
    is_customized = serializers.BooleanField(default=False)


class CreateOrderSerializer(serializers.Serializer):
    """Serializer para crear una orden completa con items anidados."""
    shipping_address = serializers.CharField()
    items = CreateOrderItemSerializer(many=True)
    coupon_code = serializers.CharField(required=False, allow_blank=True)

    def validate_coupon_code(self, value):
        if not value or not value.strip():
            return None
        code = value.strip().upper()
        try:
            coupon = Coupon.objects.get(code__iexact=code, is_active=True)
        except Coupon.DoesNotExist:
            raise serializers.ValidationError("Cupón no válido o inactivo.")
        now = timezone.now()
        if coupon.valid_from and now < coupon.valid_from:
            raise serializers.ValidationError("El cupón aún no está vigente.")
        if coupon.valid_until and now > coupon.valid_until:
            raise serializers.ValidationError("El cupón ha expirado.")
        if coupon.max_uses is not None and coupon.times_used >= coupon.max_uses:
            raise serializers.ValidationError("El cupón ya no tiene usos disponibles.")
        return coupon

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("La orden debe tener al menos un item.")

        variant_ids = [item['variant'].id for item in value if item.get('variant')]
        stock_map = {
            v.id: v.stock
            for v in ProductVariant.objects.filter(id__in=variant_ids)
        }

        for item_data in value:
            variant = item_data.get('variant')
            if variant:
                stock_actual = stock_map.get(variant.id, 0)
                if stock_actual < item_data['quantity']:
                    raise serializers.ValidationError(
                        f"Stock insuficiente para {variant}. "
                        f"Disponible: {stock_actual}, solicitado: {item_data['quantity']}"
                    )
        return value

    @transaction.atomic
    def create(self, validated_data):
        user = self.context['request'].user
        items_data = validated_data.pop('items')

        # Calcular total de los productos
        subtotal = 0
        
        # Tarifa fija de personalización dictada centralmente por el backend
        FIXED_CUSTOMIZATION_FEE = 150.00 
        
        for item_data in items_data:
            product = item_data['product']
            unit_price = product.price
            
            is_customized = item_data.get('is_customized', False)
            customization_fee = FIXED_CUSTOMIZATION_FEE if (is_customized and product.is_customizable) else 0.00
            
            item_data['calculated_customization_fee'] = customization_fee
            
            final_unit = float(unit_price) + float(customization_fee)
            subtotal += final_unit * item_data['quantity']

        # Aplicar cupón si existe
        coupon = validated_data.get('coupon_code')  
        discount_amount = 0
        subtotal_after_discount = subtotal
        if coupon:
            if coupon.min_purchase is not None and subtotal < float(coupon.min_purchase):
                raise serializers.ValidationError(
                    {"coupon_code": f"Compra mínima para este cupón: ${coupon.min_purchase} MXN."}
                )
            if coupon.discount_type == 'percent':
                discount_amount = round(subtotal * float(coupon.value) / 100, 2)
            else:
                discount_amount = min(float(coupon.value), subtotal)
            subtotal_after_discount = max(0, subtotal - discount_amount)

        # Añadir costo de envío (Regla: Gratis desde $999 MXN, en caso contrario $150)
        subtotal_for_shipping = subtotal_after_discount
        shipping_cost = 0 if subtotal_for_shipping >= 999 else 150
        total = subtotal_after_discount + shipping_cost

        order = Order.objects.create(
            user=user,
            shipping_address=validated_data['shipping_address'],
            total_amount=total,
            discount_amount=discount_amount,
            coupon=coupon,
        )
        if coupon:
            Coupon.objects.filter(pk=coupon.pk).update(times_used=F('times_used') + 1)

        for item_data in items_data:
            variant = item_data.get('variant')
            OrderItem.objects.create(
                order=order,
                product=item_data['product'],
                variant=variant,
                quantity=item_data['quantity'],
                unit_price=item_data['product'].price,
                customization_fee=item_data.get('calculated_customization_fee', 0),
            )
            # Descontar stock de forma atómica con F() — evita race conditions
            if variant:
                updated = ProductVariant.objects.filter(
                    pk=variant.pk,
                    stock__gte=item_data['quantity'],
                ).update(stock=F('stock') - item_data['quantity'])
                if not updated:
                    # Fallo atómico: el stock se agotó entre la validación y el create
                    raise serializers.ValidationError(
                        f"Stock de '{item_data['product'].name}' se agotó mientras se procesaba la orden."
                    )

        return order

# AUTENTICACIÓN Y USUARIO
class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(),
                                    message="Este correo ya está registrado.")]
    )
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )
        return user


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = User.objects.filter(email=username).first()
            if user:
                attrs['username'] = user.username

        data = super().validate(attrs)
        data['user_name'] = self.user.first_name
        data['user_email'] = self.user.email
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
        read_only_fields = ('id', 'username')

class UserAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAddress
        fields = [
            'id', 'user', 'alias', 'street', 'exterior_number', 
            'interior_number', 'neighborhood', 'reference', 'phone', 
            'city', 'state', 'postal_code', 'country', 'is_default', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']


# CUPONES (admin y validación pública)
class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'discount_type', 'value', 'valid_from', 'valid_until',
            'max_uses', 'times_used', 'min_purchase', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'times_used', 'created_at']


class CouponValidateSerializer(serializers.Serializer):
    """Respuesta al validar un cupón (solo lectura)."""
    code = serializers.CharField()
    discount_type = serializers.CharField()
    value = serializers.DecimalField(max_digits=10, decimal_places=2)
    min_purchase = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)