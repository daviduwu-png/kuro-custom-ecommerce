from django.contrib import admin
from django.utils.html import format_html
from .models import Product, ProductVariant, Order, OrderItem, Customization, Coupon, UserAddress


admin.site.site_header = 'Kuro — Panel de Administración'
admin.site.site_title = 'Kuro Admin'
admin.site.index_title = 'Gestión de la tienda'


# ── Productos ──────────────────────────────────────────────────────────────────

class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'is_customizable', 'created_at')
    list_filter = ('category', 'is_customizable')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductVariantInline]
    ordering = ('-created_at',)


# ── Órdenes ────────────────────────────────────────────────────────────────────

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'variant', 'quantity', 'unit_price', 'customization_fee', 'final_unit_price')
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'user', 'status_badge', 'shipping_badge', 'payment_method',
        'card_display', 'total_amount', 'tracking_link', 'paid_at', 'created_at',
    )
    list_filter = ('status', 'shipping_status', 'payment_method')
    search_fields = ('user__username', 'user__email', 'stripe_payment_id', 'mp_payment_id', 'tracking_number', 'skydropx_shipment_id')
    readonly_fields = (
        'stripe_payment_id', 'mp_preference_id', 'mp_payment_id',
        'skydropx_shipment_id', 'card_brand', 'card_last4',
        'failure_reason', 'paid_at', 'created_at',
    )
    inlines = [OrderItemInline]
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    actions = ['mark_shipped', 'mark_delivered', 'trigger_skydropx']

    fieldsets = (
        ('Información General', {
            'fields': ('user', 'status', 'shipping_status', 'total_amount', 'discount_amount', 'coupon', 'shipping_address'),
        }),
        ('Envío', {
            'fields': ('tracking_number', 'tracking_url', 'skydropx_shipment_id'),
        }),
        ('Pago', {
            'fields': (
                'payment_method',
                'stripe_payment_id',
                'mp_preference_id', 'mp_payment_id',
                'card_brand', 'card_last4',
                'paid_at',
            ),
        }),
        ('Error / Fallo', {
            'fields': ('failure_reason',),
            'classes': ('collapse',),
        }),
        ('Fechas', {
            'fields': ('created_at',),
        }),
    )

    # ── Badges de color ──────────────────────────────────────────────────────
    _STATUS_COLORS = {
        'pending':   ('#f59e0b', '#fff'),
        'paid':      ('#16a34a', '#fff'),
        'shipped':   ('#2563eb', '#fff'),
        'cancelled': ('#6b7280', '#fff'),
        'failed':    ('#dc2626', '#fff'),
    }
    _SHIPPING_COLORS = {
        'pending':      ('#9ca3af', '#fff'),
        'label_created': ('#3b82f6', '#fff'),
        'in_transit':   ('#f97316', '#fff'),
        'delivered':    ('#16a34a', '#fff'),
    }

    @admin.display(description='Estado', ordering='status')
    def status_badge(self, obj):
        bg, fg = self._STATUS_COLORS.get(obj.status, ('#e5e7eb', '#111'))
        label = obj.get_status_display()
        return format_html(
            '<span style="background:{};color:{};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">{}</span>',
            bg, fg, label,
        )

    @admin.display(description='Envío', ordering='shipping_status')
    def shipping_badge(self, obj):
        bg, fg = self._SHIPPING_COLORS.get(obj.shipping_status, ('#e5e7eb', '#111'))
        label = obj.get_shipping_status_display()
        return format_html(
            '<span style="background:{};color:{};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">{}</span>',
            bg, fg, label,
        )

    @admin.display(description='Tarjeta')
    def card_display(self, obj):
        if obj.card_brand and obj.card_last4:
            return f'{obj.card_brand.capitalize()} •••• {obj.card_last4}'
        return '—'

    @admin.display(description='Rastreo')
    def tracking_link(self, obj):
        if obj.tracking_url:
            return format_html('<a href="{}" target="_blank">{}</a>', obj.tracking_url, obj.tracking_number or 'Ver')
        return obj.tracking_number or '—'

    # ── Acciones de admin ────────────────────────────────────────────────────
    @admin.action(description='Marcar como Enviado (shipped)')
    def mark_shipped(self, request, queryset):
        updated = queryset.filter(status='paid').update(status='shipped')
        self.message_user(request, f'{updated} orden(es) marcadas como Enviadas.')

    @admin.action(description='Marcar envío como Entregado')
    def mark_delivered(self, request, queryset):
        updated = queryset.update(shipping_status='delivered')
        self.message_user(request, f'{updated} orden(es) marcadas como Entregadas.')

    @admin.action(description='Reintentar generación de guía (Skydropx)')
    def trigger_skydropx(self, request, queryset):
        from store.skydropx import process_skydropx_shipment_async
        count = 0
        for order in queryset.filter(status='paid'):
            process_skydropx_shipment_async(order.id)
            count += 1
        self.message_user(request, f'Se lanzó la generación de guía para {count} orden(es).')


# ── Cupones ────────────────────────────────────────────────────────────────────

@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_type', 'value', 'times_used', 'max_uses', 'is_active', 'valid_from', 'valid_until')
    list_filter = ('is_active', 'discount_type')
    search_fields = ('code',)
    ordering = ('-created_at',)


# ── Direcciones ────────────────────────────────────────────────────────────────

@admin.register(UserAddress)
class UserAddressAdmin(admin.ModelAdmin):
    list_display = ('user', 'alias', 'city', 'state', 'postal_code', 'is_default', 'created_at')
    list_filter = ('is_default', 'state')
    search_fields = ('user__username', 'user__email', 'city', 'postal_code')
    ordering = ('-created_at',)


# ── Otros modelos ──────────────────────────────────────────────────────────────

admin.site.register(OrderItem)
admin.site.register(Customization)
admin.site.register(ProductVariant)