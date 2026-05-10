import os
import decimal
import hashlib
import hmac
import logging
import stripe
import mercadopago
from django.conf import settings
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .emails import (
    send_order_confirmation_email,
    send_shipping_in_transit_email,
    send_shipping_delivered_email,
)

stripe.api_key = os.getenv('STRIPE_SECRET_KEY', '')
logger = logging.getLogger('store.payments')

from .models import Product, ProductVariant, Order, Customization, UserAddress, Coupon
from .serializers import (
    ProductSerializer,
    ProductVariantSerializer,
    OrderSerializer,
    CreateOrderSerializer,
    CustomizationSerializer,
    RegisterSerializer,
    MyTokenObtainPairSerializer,
    UserProfileSerializer,
    UserAddressSerializer,
    CouponSerializer,
)


class LoginUserThrottle(UserRateThrottle):
    """Rate limit por usuario autenticado para /api/login/."""
    scope = 'login'


class LoginAnonThrottle(AnonRateThrottle):
    """Rate limit por IP anónima para /api/login/."""
    scope = 'login_anon'


class RegisterUserThrottle(UserRateThrottle):
    """Rate limit por usuario para /api/register/ (caso raro si ya está autenticado)."""
    scope = 'register'


class RegisterAnonThrottle(AnonRateThrottle):
    """Rate limit por IP anónima para /api/register/."""
    scope = 'register_anon'

# PRODUCTOS

class ProductListAPI(generics.ListAPIView):
    """GET /api/products/  —  Listar todos los productos."""
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]


class ProductDetailAPI(generics.RetrieveAPIView):
    """GET /api/products/<slug>/  —  Detalle de un producto."""
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    lookup_field = 'slug'
    permission_classes = [AllowAny]


class ProductByCategoryAPI(generics.ListAPIView):
    """GET /api/products/category/<category>/  —  Filtrar productos por categoría."""
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        category = self.kwargs['category']
        return Product.objects.filter(category=category)


class ProductVariantListAPI(generics.ListAPIView):
    """GET /api/products/<product_id>/variants/  —  Variantes de un producto."""
    serializer_class = ProductVariantSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        product_id = self.kwargs['product_id']
        return ProductVariant.objects.filter(product_id=product_id)

# ÓRDENES

class OrderListCreateAPI(generics.ListCreateAPIView):
    """
    GET  /api/orders/   —  Listar órdenes del usuario autenticado.
    POST /api/orders/   —  Crear una orden nueva con items.
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateOrderSerializer
        return OrderSerializer

    def get_queryset(self):
        from django.db.models import Q
        # El historial de pedidos solo debe mostrar órdenes con estado de negocio
        # real. Se excluyen:
        #   - 'failed': el pago fue rechazado, la orden nunca se concretó.
        #   - 'pending' sin ID de pago: orden creada pero abandonada antes de pagar.
        # Se incluyen 'pending' que ya tienen un ID de pago asignado (pago en curso).
        return Order.objects.filter(
            user=self.request.user,
        ).exclude(
            status='failed',
        ).exclude(
            Q(status='pending') &
            Q(stripe_payment_id__isnull=True) &
            Q(mp_preference_id__isnull=True)
        ).order_by('-created_at')


    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        # Devolver la orden completa con OrderSerializer
        output = OrderSerializer(order)
        return Response(output.data, status=status.HTTP_201_CREATED)


class OrderDetailAPI(generics.RetrieveUpdateAPIView):
    """
    GET   /api/orders/<id>/  —  Ver detalle de una orden.
    PATCH /api/orders/<id>/  —  Actualizar estado / tracking.
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

# PERSONALIZACIONES

class CustomizationCreateAPI(generics.CreateAPIView):
    """POST /api/customizations/  —  Crear personalización para un item."""
    serializer_class = CustomizationSerializer
    permission_classes = [IsAuthenticated]


class CustomizationDetailAPI(generics.RetrieveUpdateAPIView):
    """
    GET /api/customizations/<id>/  —  Ver personalización.
    PUT /api/customizations/<id>/  —  Editar personalización.
    """
    serializer_class = CustomizationSerializer
    permission_classes = [IsAuthenticated]
    queryset = Customization.objects.all()


# AUTENTICACIÓN & USUARIO
class RegisterView(generics.CreateAPIView):
    """POST /api/register/  –  Registrar usuario nuevo."""
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer
    throttle_classes = [RegisterAnonThrottle, RegisterUserThrottle]


class MyTokenObtainPairView(TokenObtainPairView):
    """POST /api/login/  –  Obtener JWT."""
    serializer_class = MyTokenObtainPairSerializer
    throttle_classes = [LoginAnonThrottle, LoginUserThrottle]


class UserProfileAPI(generics.RetrieveUpdateAPIView):
    """
    GET /api/profile/  —  Ver perfil del usuario autenticado.
    PUT /api/profile/  —  Actualizar perfil.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserAddressListCreateAPI(generics.ListCreateAPIView):
    """
    GET /api/addresses/  — Listar direcciones del usuario
    POST /api/addresses/ — Crear nueva dirección
    """
    serializer_class = UserAddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user).order_by('-is_default', '-created_at')

    def perform_create(self, serializer):
        # Si es la primera dirección o se marca como predeterminada
        serializer.save(user=self.request.user)


class UserAddressDetailAPI(generics.RetrieveUpdateDestroyAPIView):
    """
    GET, PUT, PATCH, DELETE /api/addresses/<id>/
    """
    serializer_class = UserAddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user)


# ── Throttle de pagos (10 intentos por minuto por usuario) ─────────────────
class PaymentThrottle(UserRateThrottle):
    """Rate limit estricto para endpoints que crean pagos reales."""
    scope = 'payment'


# ── Verificación de firma Mercado Pago (webhook v2) ──────────────────────
def verify_mp_webhook_signature(request) -> bool:
    """
    Verifica el header x-signature que Mercado Pago envía en sus
    notificaciones v2. Retorna True si la firma es válida o si
    MERCADOPAGO_WEBHOOK_SECRET no está configurado (modo dev).

    Formato del header:
        x-signature: ts=<timestamp>,v1=<hmac-sha256-hex>
    Manifest a firmar:
        id:<data.id>;request-id:<x-request-id>;ts:<ts>;
    """
    mp_secret = os.getenv('MERCADOPAGO_WEBHOOK_SECRET', '')
    if not mp_secret:
        # En desarrollo permitimos continuar sin firma para facilitar pruebas.
        # En producción (DEBUG=False) esto debe considerarse un error grave
        # de configuración y se rechaza el webhook.
        if settings.DEBUG:
            return True
        logger.error(
            'MP webhook recibido sin MERCADOPAGO_WEBHOOK_SECRET configurado en producción'
        )
        return False

    sig_header  = request.META.get('HTTP_X_SIGNATURE', '')
    request_id  = request.META.get('HTTP_X_REQUEST_ID', '')
    data_id     = str(request.data.get('data', {}).get('id', ''))

    if not sig_header:
        logger.warning('MP webhook sin header x-signature — posible request forjado')
        return False

    # Parsear ts y v1 del header
    parts = {}
    for part in sig_header.split(','):
        if '=' in part:
            k, v = part.strip().split('=', 1)
            parts[k] = v

    ts = parts.get('ts', '')
    v1 = parts.get('v1', '')

    if not ts or not v1:
        return False

    manifest = f'id:{data_id};request-id:{request_id};ts:{ts};'
    expected = hmac.new(
        mp_secret.encode('utf-8'),
        manifest.encode('utf-8'),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected, v1)



@method_decorator(csrf_exempt, name='dispatch')
class StripeCreatePaymentIntentView(APIView):
    """
    POST /api/payments/stripe/create-intent/

    Body: { "order_id": 42 }

    Flujo:
      1. El frontend primero crea la orden con POST /api/orders/ y obtiene un order_id.
      2. Llama a este endpoint con ese order_id.
      3. Se crea el PaymentIntent en Stripe y se guarda stripe_payment_id en la orden.
      4. El frontend usa el client_secret para confirmar el pago con Stripe.js / SDK.

    Devuelve: { "client_secret": "...", "publishable_key": "..." }
    """
    permission_classes = [IsAuthenticated]
    throttle_classes   = [PaymentThrottle]  

    def post(self, request):
        order_id = request.data.get('order_id')

        # ── Validaciones básicas ────────────────────────────────────────────
        if not order_id:
            return Response(
                {'error': 'El campo order_id es requerido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Asegurarse de que la orden pertenece al usuario autenticado y está pendiente
        try:
            order = Order.objects.get(
                id=order_id,
                user=request.user,
                status='pending',
            )
        except Order.DoesNotExist:
            return Response(
                {'error': 'Orden no encontrada o ya fue procesada.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Si ya tiene un intent de Stripe, reutilizarlo (evita crear duplicados)
        if order.stripe_payment_id:
            try:
                existing_intent = stripe.PaymentIntent.retrieve(order.stripe_payment_id)
                if existing_intent.status not in ('canceled', 'succeeded'):
                    return Response({
                        'client_secret': existing_intent.client_secret,
                        'publishable_key': os.getenv('STRIPE_PUBLISHABLE_KEY', ''),
                    })
            except stripe.error.StripeError:
                pass  # Si falla la recuperación, creamos uno nuevo

        # ── Crear el PaymentIntent en Stripe ────────────────────────────────
        try:
            amount_cents = int(
                order.total_amount.quantize(decimal.Decimal('0.01')) * 100
            )

            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency='mxn',
                metadata={
                    'order_id': order.id,
                    'user_id': request.user.id,
                    'user_email': request.user.email,
                },
            )

            # Guardar el stripe_payment_id en la orden y marcar el método de pago
            order.stripe_payment_id = intent.id
            order.payment_method = 'stripe'
            order.save(update_fields=['stripe_payment_id', 'payment_method'])

            return Response({
                'client_secret': intent.client_secret,
                'publishable_key': os.getenv('STRIPE_PUBLISHABLE_KEY', ''),
            })

        except stripe.error.StripeError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response(
                {'error': 'Error interno del servidor.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    """
    POST /api/payments/stripe/webhook/

    Recibe eventos de Stripe. Verifica la firma criptográfica del webhook
    usando STRIPE_WEBHOOK_SECRET para garantizar que el evento es legítimo.

    Maneja:
      - payment_intent.succeeded      → marca la orden como 'paid', guarda info de tarjeta
      - payment_intent.payment_failed → marca la orden como 'failed', guarda razón del fallo
    """
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')
        webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET', '')

        # ── Verificar firma del webhook (CRÍTICO en producción) ─────────────
        try:
            if webhook_secret:
                event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
            else:
                # En desarrollo permitimos construir el evento sin validar firma
                # para facilitar pruebas locales. En producción esto se considera
                # un error de configuración y se rechaza el webhook.
                if not settings.DEBUG:
                    logger.error(
                        'Stripe webhook recibido pero STRIPE_WEBHOOK_SECRET '
                        'no está configurado en producción'
                    )
                    return Response({'error': 'Webhook no configurado'}, status=500)
                import json
                event = stripe.Event.construct_from(
                    json.loads(payload), stripe.api_key
                )
        except stripe.error.SignatureVerificationError:
            return Response({'error': 'Firma inválida.'}, status=400)
        except ValueError:
            return Response({'error': 'Payload inválido.'}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

        # ── Manejar el evento ───────────────────────────────────────────────
        event_type = event.get('type')

        if event_type == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            stripe_id = payment_intent['id']

            
            card_brand = None
            card_last4 = None
            try:
                expanded_intent = stripe.PaymentIntent.retrieve(
                    stripe_id, expand=['payment_method']
                )
                pm = expanded_intent.get('payment_method')
                if pm and getattr(pm, 'type', None) == 'card':
                    card_brand = pm.card.get('brand')
                    card_last4 = pm.card.get('last4')
            except Exception as e:
                import logging
                logging.getLogger('store.payments').error('Error extrayendo info de tarjeta (webhook): %s', e)

            # Actualizar la orden de forma atómica
            update_fields = {
                'status': 'paid',
                'paid_at': timezone.now(),
                'failure_reason': None,
            }
            if card_brand:
                update_fields['card_brand'] = card_brand
            if card_last4:
                update_fields['card_last4'] = card_last4

            Order.objects.filter(
                stripe_payment_id=stripe_id,
                status='pending',
            ).update(**update_fields)

            # Recargar la orden para enviar el email con todos los datos actualizados
            try:
                updated_order = Order.objects.prefetch_related('items__product').get(
                    stripe_payment_id=stripe_id
                )
                send_order_confirmation_email(updated_order)
                
                from .skydropx import process_skydropx_shipment_async
                try:
                    # 1. Se manda la informacion del usuario
                    # 2. Se genera el codigo de rastreo automaticamente en Skydropx (en background)
                    process_skydropx_shipment_async(updated_order.id)
                except Exception as e:
                    logger.error("Error al iniciar hilo de Skydropx en Stripe Webhook: %s", e)
                    
            except Order.DoesNotExist:
                pass

            logger.info(
                'Stripe payment succeeded | order=%s intent=%s card=%s%s',
                update_fields.get('card_last4', '?'),
                stripe_id,
                card_brand or 'unknown',
                f'_{card_last4}' if card_last4 else '',
            )

        elif event_type == 'payment_intent.payment_failed':
            payment_intent = event['data']['object']
            stripe_id = payment_intent['id']

            # Obtener razón del fallo
            last_error = payment_intent.get('last_payment_error', {}) or {}
            failure_reason = (
                last_error.get('message')
                or last_error.get('decline_code')
                or 'Pago rechazado'
            )

            Order.objects.filter(
                stripe_payment_id=stripe_id,
                status='pending',
            ).update(
                status='failed',
                failure_reason=failure_reason,
            )

            logger.warning(
                'Stripe payment failed | intent=%s reason=%s',
                stripe_id, failure_reason,
            )

        return Response({'status': 'ok'})


class StripeVerifyPaymentView(APIView):
    """
    POST /api/payments/stripe/verify/
    
    Verifica manualmente el estado de un PaymentIntent.
    Útil para entornos de desarrollo donde el webhook no llega, o como fallback.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('order_id')
        if not order_id:
            return Response({'error': 'El campo order_id es requerido.'}, status=400)

        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Orden no encontrada.'}, status=404)

        if not order.stripe_payment_id:
            return Response({'error': 'Orden no tiene Stripe ID.'}, status=400)

        try:
            intent = stripe.PaymentIntent.retrieve(
                order.stripe_payment_id, expand=['payment_method']
            )
            if intent.status == 'succeeded':
                # Extraer info de tarjeta expandiendo payment_method
                card_brand = None
                card_last4 = None
                pm = intent.get('payment_method')
                if pm and getattr(pm, 'type', None) == 'card':
                    card_brand = pm.card.get('brand')
                    card_last4 = pm.card.get('last4')

                update_fields = []

                # Solo actualizar status si todavía está pendiente
                if order.status == 'pending':
                    order.status = 'paid'
                    update_fields.append('status')
                if not order.paid_at:
                    order.paid_at = timezone.now()
                    update_fields.append('paid_at')

                # Guardar tarjeta si aún no está en la BD
                if card_brand and not order.card_brand:
                    order.card_brand = card_brand
                    update_fields.append('card_brand')
                if card_last4 and not order.card_last4:
                    order.card_last4 = card_last4
                    update_fields.append('card_last4')

                if update_fields:
                    order.save(update_fields=update_fields)
                    logger.info('Verify Stripe: orden #%s actualizada campos=%s', order.id, update_fields)

                # Lanzar Skydropx solo si todavía no existe una guía
                if not order.skydropx_shipment_id:
                    try:
                        from .skydropx import process_skydropx_shipment_async
                        process_skydropx_shipment_async(order.id)
                        logger.info('Verify Stripe: lanzado Skydropx para orden #%s', order.id)
                    except Exception as e:
                        logger.error('Error al iniciar hilo de Skydropx en Verify: %s', e)
                else:
                    logger.info('Verify Stripe: orden #%s ya tiene guía %s, Skydropx omitido', order.id, order.skydropx_shipment_id)

            return Response({'status': intent.status})
        except Exception as e:
            logger.error('Error en StripeVerifyPaymentView: %s', e)
            return Response({'error': str(e)}, status=400)


class MPCreatePreferenceView(APIView):
    """
    POST /api/payments/mercadopago/create-preference/

    Body: { "order_id": 42 }

    Flujo:
      1. El frontend primero crea la orden con POST /api/orders/ y obtiene un order_id.
      2. Llama a este endpoint con ese order_id.
      3. Se genera la preferencia en Mercado Pago con los items reales de la orden.
      4. Se guarda mp_preference_id en la orden.
      5. El frontend redirige al usuario a init_point (o usa el SDK de MP).

    Devuelve: { "preference_id": "...", "init_point": "...", "sandbox_init_point": "..." }
    """
    permission_classes = [IsAuthenticated]
    throttle_classes   = [PaymentThrottle]  

    def post(self, request):
        order_id = request.data.get('order_id')

        # ── Validaciones básicas ────────────────────────────────────────────
        if not order_id:
            return Response(
                {'error': 'El campo order_id es requerido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order = Order.objects.prefetch_related('items__product').get(
                id=order_id,
                user=request.user,
                status='pending',
            )
        except Order.DoesNotExist:
            return Response(
                {'error': 'Orden no encontrada o ya fue procesada.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Reutilizar preferencia si ya existe y no ha expirado
        if order.mp_preference_id:
            # Determinar si es sandbox o producción para reconstruir el link
            mp_access_token = os.getenv('MERCADOPAGO_ACCESS_TOKEN', '')
            is_sandbox = 'TEST' in mp_access_token.upper()
            base_url = (
                'https://sandbox.mercadopago.com.mx'
                if is_sandbox
                else 'https://www.mercadopago.com.mx'
            )
            return Response({
                'preference_id': order.mp_preference_id,
                'init_point': f'{base_url}/checkout/v1/redirect?pref_id={order.mp_preference_id}',
                'sandbox_init_point': f'https://sandbox.mercadopago.com.mx/checkout/v1/redirect?pref_id={order.mp_preference_id}',
            })

        # ── Construir los items desde la orden real ─────────────────────────
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:4321')
        mp_access_token = os.getenv('MERCADOPAGO_ACCESS_TOKEN', '')

        if not mp_access_token:
            return Response(
                {'error': 'Pasarela de pago no configurada.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            sdk = mercadopago.SDK(mp_access_token)

            # Tomar los items directamente de la orden
            mp_items = []
            for item in order.items.all():
                mp_items.append({
                    'id': str(item.product.id),
                    'title': item.product.name,
                    'quantity': item.quantity,
                    'unit_price': float(item.final_unit_price),
                    'currency_id': 'MXN',
                })

            preference_data = {
                'items': mp_items,
                'payer': {'email': request.user.email},
                'back_urls': {
                    'success': f'{frontend_url}/cuenta?payment=success&order={order.id}',
                    'failure': f'{frontend_url}/cuenta?payment=failed&order={order.id}',
                    'pending': f'{frontend_url}/cuenta?payment=pending&order={order.id}',
                },
                'auto_return': 'approved',
                'statement_descriptor': 'Kuro Custom',
                # Usamos order_id como external_reference para identificar exactamente qué orden pagar
                'external_reference': str(order.id),
                'notification_url': f'{os.getenv("BACKEND_URL", "")}/api/payments/mercadopago/webhook/',
            }

            preference_response = sdk.preference().create(preference_data)
            preference = preference_response.get('response', {})
            response_status = preference_response.get('status')

            if response_status not in [200, 201]:
                error_msg = preference.get('message') or preference.get('error') or 'Error al crear preferencia'
                return Response({'error': error_msg}, status=status.HTTP_400_BAD_REQUEST)

            preference_id = preference.get('id')

            # Guardar el preference_id en la orden y marcar el método de pago
            order.mp_preference_id = preference_id
            order.payment_method = 'mercadopago'
            order.save(update_fields=['mp_preference_id', 'payment_method'])

            return Response({
                'preference_id': preference_id,
                'init_point': preference.get('init_point'),
                'sandbox_init_point': preference.get('sandbox_init_point'),
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class MPWebhookView(APIView):
    """
    POST /api/payments/mercadopago/webhook/

    Recibe notificaciones IPN de Mercado Pago.
    Busca la orden por external_reference (order_id) de forma exacta y segura.

    Estados de MP que manejamos:
      - 'approved'  → marca la orden como 'paid'
      - 'rejected'  → deja la orden en 'pending' para reintentar
      - 'cancelled' → marca la orden como 'cancelled'
    """
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        # Solo activo cuando MERCADOPAGO_WEBHOOK_SECRET está configurado
        if not verify_mp_webhook_signature(request):
            logger.warning('MP webhook rechazado por firma inválida')
            return Response({'error': 'Firma inválida'}, status=403)

        # MP envía { "type": "payment", "data": { "id": "12345" } }
        topic = request.data.get('type', '')
        payment_id = request.data.get('data', {}).get('id')

        # También puede llegar como query param (IPN legacy de MP)
        if not payment_id:
            payment_id = request.query_params.get('id')
            topic = request.query_params.get('topic', topic)

        if topic not in ('payment', 'merchant_order') or not payment_id:
            # Ignorar eventos que no nos interesan pero confirmar recepción
            return Response({'status': 'ignored'})

        mp_access_token = os.getenv('MERCADOPAGO_ACCESS_TOKEN', '')
        if not mp_access_token:
            return Response({'status': 'ok'})  # Sin config, no procesar

        try:
            sdk = mercadopago.SDK(mp_access_token)
            payment_info = sdk.payment().get(payment_id)

            if payment_info.get('status') not in [200, 201]:
                # MP no encontró el pago — posible prueba de ping, retornar OK
                return Response({'status': 'ok'})

            payment = payment_info.get('response', {})
            mp_status = payment.get('status')          # 'approved', 'rejected', 'pending', etc.
            external_ref = payment.get('external_reference', '')  # Este es nuestro order_id

            if not external_ref:
                return Response({'status': 'ok'})

            # Buscar la orden de forma exacta por order_id (no user_id)
            try:
                order = Order.objects.get(id=int(external_ref))
            except (Order.DoesNotExist, ValueError):
                # Si la orden no existe, retornar 200 igual (MP requiere 200 para no reintentar)
                return Response({'status': 'ok'})

            # ── Actualizar la orden según el estado del pago ────────────────
            if mp_status == 'approved' and order.status == 'pending':
                order.status = 'paid'
                order.mp_payment_id = str(payment_id)
                order.paid_at = timezone.now()
                order.failure_reason = None
                order.save(update_fields=['status', 'mp_payment_id', 'paid_at', 'failure_reason'])
                send_order_confirmation_email(order)
                
                from .skydropx import process_skydropx_shipment_async
                try:
                    # 1. Se manda la informacion del usuario
                    # 2. Se genera el codigo de rastreo automaticamente en Skydropx (en background)
                    process_skydropx_shipment_async(order.id)
                except Exception as e:
                    logger.error("Error al iniciar hilo de Skydropx en MP Webhook: %s", e)

                logger.info(
                    'MP payment approved | order=%s mp_payment_id=%s',
                    order.id, payment_id,
                )

            elif mp_status in ('rejected', 'cancelled') and order.status == 'pending':
                failure_reason = (
                    payment.get('status_detail')
                    or ('Pago cancelado' if mp_status == 'cancelled' else 'Pago rechazado')
                )
                new_status = 'cancelled' if mp_status == 'cancelled' else 'failed'
                order.status = new_status
                order.mp_payment_id = str(payment_id)
                order.failure_reason = failure_reason
                order.save(update_fields=['status', 'mp_payment_id', 'failure_reason'])
                logger.warning(
                    'MP payment %s | order=%s reason=%s',
                    mp_status, order.id, failure_reason,
                )

            # 'pending' de MP → se deja en 'pending' para que el usuario reintente

        except Exception as exc:  # noqa: BLE001
            # Nunca retornar error HTTP a MP (causaría reintentos infinitos)
            logger.error('MP webhook processing error | %s', exc)

        # Mercado Pago requiere SIEMPRE un 200 para no reintentar el webhook
        return Response({'status': 'ok'})


class RefundOrderView(APIView):
    """
    POST /api/payments/refund/

    Body: { "order_id": 42 }

    Solo accesible por administradores (is_staff=True).
    Reembolsa la orden independientemente de si fue pagada con Stripe o Mercado Pago.
    Marca la orden como 'cancelled' y **devuelve el stock al inventario**.

    Devuelve: { "refund_id": "...", "status": "succeeded", "message": "..." }
    """
    permission_classes = [IsAdminUser]   # Solo staff / superusers
    throttle_classes   = [PaymentThrottle]

    def post(self, request):
        order_id = request.data.get('order_id')
        if not order_id:
            return Response(
                {'error': 'El campo order_id es requerido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            # Volver a cargar la orden con bloqueo para evitar carreras en cancelaciones dobles
            try:
                # Usamos select_related o prefetch_related si es necesario, pero
                # select_for_update garantiza protección atómica.
                order = Order.objects.select_for_update().get(
                    id=order_id,
                    status='paid',
                )
            except Order.DoesNotExist:
                return Response(
                    {'error': 'Orden no encontrada o ya no está en estado "paid".'},
                    status=status.HTTP_404_NOT_FOUND,
                )

            refund_id = None

            # ── 1. Procesar el reembolso con el proveedor (Stripe o MP) ─────────
            try:
                if order.payment_method == 'stripe':
                    if not order.stripe_payment_id:
                        return Response({'error': 'Esta orden no tiene ID de pago de Stripe.'}, status=400)
                        
                    refund = stripe.Refund.create(
                        payment_intent=order.stripe_payment_id,
                        metadata={
                            'order_id':    order.id,
                            'customer_id': order.user.id,
                            'approved_by': request.user.email,
                            'reason':      'requested_by_customer',
                        },
                    )
                    refund_id = refund.id

                elif order.payment_method == 'mercadopago':
                    if not order.mp_payment_id:
                        return Response({'error': 'Esta orden no tiene ID de pago de Mercado Pago.'}, status=400)
                    
                    mp_access_token = os.getenv('MERCADOPAGO_ACCESS_TOKEN', '')
                    sdk = mercadopago.SDK(mp_access_token)
                    
                    payment_id = int(order.mp_payment_id)
                    refund_res = sdk.refund().create(payment_id)
                    
                    if refund_res['status'] not in (200, 201):
                        logger.error('MP refund error | response=%s', refund_res)
                        return Response({'error': 'Error al procesar el reembolso en Mercado Pago.'}, status=400)
                        
                    refund_id = str(refund_res['response'].get('id', 'desconocido'))

                else:
                    return Response({'error': 'Método de pago no soportado para reembolsos.'}, status=400)

            except Exception as e:
                logger.error('Refund processing failed | order=%s error=%s', order.id, e)
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

            # ── 2. Devolver stock al inventario ────────────────────────────────
            for item in order.items.all():
                if item.variant:
                    # Actualización atómica en la base de datos
                    ProductVariant.objects.filter(id=item.variant.id).update(
                        stock=F('stock') + item.quantity
                    )

            # ── 3. Marcar la orden como cancelada ──────────────────────────────
            order.status = 'cancelled'
            order.failure_reason = f'Reembolso procesado por admin ({request.user.email}). ID: {refund_id}'
            order.save(update_fields=['status', 'failure_reason'])

        # Fuera de la transacción
        logger.info(
            '%s refund created | order=%s refund_id=%s admin=%s stock_restored=True',
            order.payment_method.capitalize(), order.id, refund_id, request.user.email
        )

        return Response({
            'refund_id': refund_id,
            'status': 'succeeded',
            'message': 'Reembolso procesado correctamente y stock devuelto al inventario.',
        })


# API Admin (panel de administración)    
class AdminOrderListAPI(generics.ListAPIView):
    """
    GET /api/admin/orders/
    Lista todas las órdenes. Solo administradores.
    Query params: status, shipping_status, user_id
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = Order.objects.all().select_related('user', 'coupon').prefetch_related('items__product').order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        shipping_filter = self.request.query_params.get('shipping_status')
        user_id = self.request.query_params.get('user_id')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if shipping_filter:
            qs = qs.filter(shipping_status=shipping_filter)
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs


class AdminOrderDetailAPI(generics.RetrieveUpdateAPIView):
    """
    GET /api/admin/orders/<id>/  —  Ver cualquier orden.
    PATCH /api/admin/orders/<id>/  —  Actualizar status, shipping_status (ej. marcar "en tránsito").
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAdminUser]
    queryset = Order.objects.all().select_related('user', 'coupon').prefetch_related('items__product')


class AdminCouponListCreateAPI(generics.ListCreateAPIView):
    """GET /api/admin/coupons/  —  Listar cupones.  POST  —  Crear cupón."""
    serializer_class = CouponSerializer
    permission_classes = [IsAdminUser]
    queryset = Coupon.objects.all().order_by('-created_at')


class AdminCouponDetailAPI(generics.RetrieveUpdateDestroyAPIView):
    """GET / PUT / PATCH / DELETE /api/admin/coupons/<id>/"""
    serializer_class = CouponSerializer
    permission_classes = [IsAdminUser]
    queryset = Coupon.objects.all()


class AdminStatsAPI(APIView):
    """
    GET /api/admin/stats/
    Resumen de órdenes por estado (para dashboard).
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        from django.db.models import Count
        orders_by_status = dict(
            Order.objects.values('status').annotate(count=Count('id')).values_list('status', 'count')
        )
        orders_by_shipping = dict(
            Order.objects.values('shipping_status').annotate(count=Count('id')).values_list('shipping_status', 'count')
        )
        return Response({
            'orders_by_status': orders_by_status,
            'orders_by_shipping': orders_by_shipping,
            'total_orders': Order.objects.count(),
        })


class CouponValidateAPI(APIView):
    """
    GET /api/coupons/validate/?code=VERANO10
    Valida un cupón y devuelve su información (para mostrar descuento en frontend).
    Público (AllowAny).
    """
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.query_params.get('code', '').strip()
        if not code:
            return Response({'error': 'Falta el parámetro code.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            coupon = Coupon.objects.get(code__iexact=code, is_active=True)
        except Coupon.DoesNotExist:
            return Response({'error': 'Cupón no válido.'}, status=status.HTTP_404_NOT_FOUND)
        now = timezone.now()
        if coupon.valid_from and now < coupon.valid_from:
            return Response({'error': 'El cupón aún no está vigente.'}, status=status.HTTP_400_BAD_REQUEST)
        if coupon.valid_until and now > coupon.valid_until:
            return Response({'error': 'El cupón ha expirado.'}, status=status.HTTP_400_BAD_REQUEST)
        if coupon.max_uses is not None and coupon.times_used >= coupon.max_uses:
            return Response({'error': 'El cupón ya no tiene usos disponibles.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            'code': coupon.code,
            'discount_type': coupon.discount_type,
            'value': str(coupon.value),
            'min_purchase': str(coupon.min_purchase) if coupon.min_purchase else None,
        })


@method_decorator(csrf_exempt, name='dispatch')
class SkydropxWebhookView(APIView):
    """
    POST /api/shipping/skydropx/webhook/

    Recibe notificaciones de Skydropx cuando el estado del paquete cambia.
    Verifica la firma HMAC-SHA256 usando SKYDROPX_WEBHOOK_SECRET para garantizar
    que la petición viene de Skydropx.

    Mapeo de eventos Skydropx → shipping_status de la orden:
      - label_created / shipment_created  → 'label_created'
      - in_transit / picked_up            → 'in_transit'
      - delivered / out_for_delivery      → 'delivered'
      - exception / failed                → no cambia (solo se loguea)

    Requiere configurar en el panel de Skydropx:
      URL: https://<tu-dominio>/api/shipping/skydropx/webhook/
      Secret: el valor de SKYDROPX_WEBHOOK_SECRET en tu .env
    """
    permission_classes = []
    authentication_classes = []

    # Mapa de eventos de Skydropx a los estados internos de la orden
    EVENT_STATUS_MAP = {
        # Guía generada
        'label_created':    'label_created',
        'shipment_created': 'label_created',
        # En tránsito
        'in_transit':       'in_transit',
        'picked_up':        'in_transit',
        'out_for_delivery': 'in_transit',
        # Entregado
        'delivered':        'delivered',
    }

    def _verify_signature(self, request) -> bool:
        """
        Verifica el token estático que envía Skydropx en el header de 'Authorization'.
        Retorna True si es válido o si no hay secret configurado en desarrollo (DEBUG=True).
        """
        webhook_secret = os.getenv('SKYDROPX_WEBHOOK_SECRET', '')

        if not webhook_secret:
            if settings.DEBUG:
                logger.warning(
                    'SKYDROPX_WEBHOOK_SECRET no configurado — aceptando webhook sin verificar (DEBUG=True)'
                )
                return True
            logger.error('SKYDROPX_WEBHOOK_SECRET no configurado en producción — rechazando webhook')
            return False

        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        custom_header = request.META.get('HTTP_X_SKYDROPX_TOKEN', '')
        
        received_token = auth_header.replace('Bearer ', '').strip() or custom_header.strip()

        if not received_token:
            logger.warning('Webhook de Skydropx sin header de autorización')
            return False

        # Usar compare_digest para prevenir time-based attacks incluso en strings planos
        return hmac.compare_digest(webhook_secret, received_token)

    def post(self, request):
        # ── 1. Verificar firma ──────────────────────────────────────────────
        if not self._verify_signature(request):
            logger.warning('Webhook de Skydropx rechazado por firma inválida')
            return Response({'error': 'Firma inválida'}, status=403)

        # ── 2. Parsear el cuerpo del webhook ────────────────────────────────
        event_type     = request.data.get('event', '').lower()
        tracking_number = request.data.get('tracking_number') or request.data.get('data', {}).get('tracking_number')
        shipment_id    = request.data.get('data', {}).get('id')

        logger.info(
            'Skydropx webhook recibido | event=%s tracking=%s shipment_id=%s',
            event_type, tracking_number, shipment_id
        )

        if not tracking_number and not shipment_id:
            logger.warning('Webhook de Skydropx sin tracking_number ni shipment_id en el body')
            return Response({'status': 'ignored'})

        new_shipping_status = self.EVENT_STATUS_MAP.get(event_type)

        if not new_shipping_status:
            logger.info('Evento de Skydropx ignorado: %s', event_type)
            return Response({'status': 'ignored'})

        # ── 4. Buscar la orden por tracking_number o shipment_id ─────────────
        order = None
        try:
            if tracking_number:
                order = Order.objects.filter(tracking_number=tracking_number).first()
            
            if not order and shipment_id:
                order = Order.objects.filter(skydropx_shipment_id=str(shipment_id)).first()

            if not order:
                logger.warning(
                    'Webhook Skydropx: no se encontró orden con tracking_number=%s o shipment_id=%s',
                    tracking_number, shipment_id
                )
                return Response({'status': 'ok'})
                
        except Exception as e:
            logger.error('Error buscando orden en webhook Skydropx: %s', e)
            return Response({'status': 'ok'})

        if tracking_number and not order.tracking_number:
            order.tracking_number = str(tracking_number)
            order.save(update_fields=['tracking_number'])
            logger.info('Asignado tracking_number=%s a la orden #%s desde el webhook', tracking_number, order.id)
        STATUS_ORDER = ['pending', 'label_created', 'in_transit', 'delivered']
        current_idx = STATUS_ORDER.index(order.shipping_status) if order.shipping_status in STATUS_ORDER else 0
        new_idx     = STATUS_ORDER.index(new_shipping_status)   if new_shipping_status in STATUS_ORDER else 0

        if new_idx <= current_idx:
            logger.info(
                'Webhook Skydropx: no se actualiza (estado actual=%s >= nuevo=%s) | order=%s',
                order.shipping_status, new_shipping_status, order.id,
            )
            return Response({'status': 'ok'})

        # Actualizar solo el campo de envío (atómico)
        Order.objects.filter(pk=order.pk).update(shipping_status=new_shipping_status)

        logger.info(
            'Orden #%s actualizada | shipping_status: %s → %s',
            order.id, order.shipping_status, new_shipping_status,
        )

        # Recargar la orden para tener los datos actualizados (tracking, user, etc.)
        try:
            refreshed_order = Order.objects.select_related('user').prefetch_related('items__product').get(pk=order.pk)
            if new_shipping_status == 'in_transit':
                send_shipping_in_transit_email(refreshed_order)
            elif new_shipping_status == 'delivered':
                send_shipping_delivered_email(refreshed_order)
        except Exception as e:
            logger.error('Error enviando email de shipping | order=%s error=%s', order.id, e)

        return Response({'status': 'ok'})