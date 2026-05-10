from django.urls import path
from . import views

urlpatterns = [
    # Productos
    path('products/', views.ProductListAPI.as_view(), name='product-list'),
    path('products/category/<str:category>/', views.ProductByCategoryAPI.as_view(), name='product-by-category'),
    path('products/<int:product_id>/variants/', views.ProductVariantListAPI.as_view(), name='product-variants'),
    path('products/<slug:slug>/', views.ProductDetailAPI.as_view(), name='product-detail'),

    # Órdenes
    path('orders/', views.OrderListCreateAPI.as_view(), name='order-list-create'),
    path('orders/<int:pk>/', views.OrderDetailAPI.as_view(), name='order-detail'),

    # Personalizaciones
    path('customizations/', views.CustomizationCreateAPI.as_view(), name='customization-create'),
    path('customizations/<int:pk>/', views.CustomizationDetailAPI.as_view(), name='customization-detail'),

    # Direcciones
    path('addresses/', views.UserAddressListCreateAPI.as_view(), name='address-list-create'),
    path('addresses/<int:pk>/', views.UserAddressDetailAPI.as_view(), name='address-detail'),

    
    # Stripe
    path('payments/stripe/create-intent/', views.StripeCreatePaymentIntentView.as_view(), name='stripe-create-intent'),
    path('payments/stripe/verify/',        views.StripeVerifyPaymentView.as_view(),        name='stripe-verify'),
    path('payments/stripe/webhook/',       views.StripeWebhookView.as_view(),              name='stripe-webhook'),

    # Reembolso Universal (Stripe/MP)
    path('payments/refund/',               views.RefundOrderView.as_view(),                name='order-refund'),

    # Mercado Pago
    path('payments/mercadopago/create-preference/', views.MPCreatePreferenceView.as_view(), name='mp-create-preference'),
    path('payments/mercadopago/webhook/',           views.MPWebhookView.as_view(),           name='mp-webhook'),

    # Cupones (validación pública para el frontend)
    path('coupons/validate/', views.CouponValidateAPI.as_view(), name='coupon-validate'),

    # Admin (panel: órdenes, cupones, estadísticas)
    path('admin/orders/', views.AdminOrderListAPI.as_view(), name='admin-order-list'),
    path('admin/orders/<int:pk>/', views.AdminOrderDetailAPI.as_view(), name='admin-order-detail'),
    path('admin/coupons/', views.AdminCouponListCreateAPI.as_view(), name='admin-coupon-list-create'),
    path('admin/coupons/<int:pk>/', views.AdminCouponDetailAPI.as_view(), name='admin-coupon-detail'),
    path('admin/stats/', views.AdminStatsAPI.as_view(), name='admin-stats'),

    # Skydropx — Webhook de rastreo (notificaciones de estado del paquete)
    path('shipping/skydropx/webhook/', views.SkydropxWebhookView.as_view(), name='skydropx-webhook'),
]