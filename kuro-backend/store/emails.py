import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger('store.emails')


def send_order_confirmation_email(order):
    """
    Envía un correo de confirmación al cliente cuando su pago es aprobado.

    Se llama desde los webhooks de Stripe y Mercado Pago, por lo que
    cualquier excepción se captura y loggea sin propagar.
    """
    try:
        # ── Información del método de pago ───────────────────────────────────
        if order.card_brand and order.card_last4:
            payment_line = (
                f'Pagado con: {order.card_brand.capitalize()} '
                f'•••• {order.card_last4}'
            )
        elif order.payment_method == 'mercadopago':
            payment_line = 'Pagado con: Mercado Pago'
        else:
            payment_line = 'Pagado con: Tarjeta / Stripe'

        # ── Lista de artículos ───────────────────────────────────────────────
        item_lines = []
        for item in order.items.select_related('product').all():
            item_lines.append(
                f'  • {item.quantity}x {item.product.name}'
                f'  —  ${item.final_unit_price:.2f} MXN c/u'
            )
        items_text = '\n'.join(item_lines) or '  (sin artículos)'

        # ── Enlace al historial ──────────────────────────────────────────────
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:4321')
        order_url    = f'{frontend_url}/cuenta?tab=pedidos'

        # ── Cuerpo del correo ────────────────────────────────────────────────
        recipient_name = order.user.first_name or order.user.username
        body = (
            f'¡Hola {recipient_name}! 👋\n\n'
            f'Tu pago fue procesado con éxito. Aquí están los detalles:\n\n'
            f'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
            f'📦  Pedido #{order.id}\n'
            f'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
            f'{items_text}\n\n'
            f'Total cobrado:  ${order.total_amount:.2f} MXN\n'
            f'{payment_line}\n\n'
            f'Dirección de envío:\n'
            f'{order.shipping_address}\n\n'
            f'Puedes consultar el estado de tu pedido aquí:\n'
            f'{order_url}\n\n'
            f'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
            f'Pronto recibirás tu número de seguimiento cuando el pedido sea enviado.\n\n'
            f'¡Gracias por comprar en Kuro Custom! 🎉\n'
            f'— El equipo de Kuro Custom'
        )

        send_mail(
            subject=f'¡Tu pedido #{order.id} está confirmado! — Kuro Custom',
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.user.email],
            fail_silently=True,  # Nunca bloquear el flujo de pago por un email
        )
        logger.info(
            'Confirmation email sent | order=%s recipient=%s',
            order.id, order.user.email,
        )

    except Exception as exc:  # noqa: BLE001
        logger.error(
            'Failed to send confirmation email | order=%s error=%s',
            order.id, exc,
        )


def send_shipping_in_transit_email(order):
    """
    Envía un correo al cliente cuando su paquete ha sido recolectado
    y está en camino (shipping_status = 'in_transit').
    """
    try:
        recipient_name = order.user.first_name or order.user.username
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:4321')
        order_url = f'{frontend_url}/cuenta?tab=pedidos'

        tracking_line = ''
        if order.tracking_number:
            tracking_line = f'Número de guía:  {order.tracking_number}\n'
        if order.tracking_url:
            tracking_line += f'Rastrear paquete: {order.tracking_url}\n'

        body = (
            f'¡Hola {recipient_name}! 🚚\n\n'
            f'Tu pedido #{order.id} ya fue recolectado y está en camino.\n\n'
            f'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
            f'📦  Pedido #{order.id} — En tránsito\n'
            f'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
            f'{tracking_line}\n'
            f'Dirección de entrega:\n'
            f'{order.shipping_address}\n\n'
            f'Puedes consultar el estado de tu pedido aquí:\n'
            f'{order_url}\n\n'
            f'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
            f'¡Gracias por comprar en Kuro Custom! 🎉\n'
            f'— El equipo de Kuro Custom'
        )

        send_mail(
            subject=f'Tu pedido #{order.id} está en camino — Kuro Custom',
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.user.email],
            fail_silently=True,
        )
        logger.info(
            'In-transit email sent | order=%s recipient=%s',
            order.id, order.user.email,
        )

    except Exception as exc:  # noqa: BLE001
        logger.error(
            'Failed to send in-transit email | order=%s error=%s',
            order.id, exc,
        )


def send_shipping_delivered_email(order):
    """
    Envía un correo al cliente cuando su paquete ha sido entregado
    (shipping_status = 'delivered').
    """
    try:
        recipient_name = order.user.first_name or order.user.username
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:4321')
        order_url = f'{frontend_url}/cuenta?tab=pedidos'

        body = (
            f'¡Hola {recipient_name}! 🎉\n\n'
            f'Tu pedido #{order.id} ha sido entregado exitosamente.\n\n'
            f'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
            f'✅  Pedido #{order.id} — Entregado\n'
            f'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n'
            f'Esperamos que disfrutes tu compra. Si tienes algún problema\n'
            f'con tu pedido, por favor contáctanos respondiendo a este correo.\n\n'
            f'Puedes consultar el detalle de tu pedido aquí:\n'
            f'{order_url}\n\n'
            f'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
            f'¡Gracias por confiar en Kuro Custom! 💙\n'
            f'— El equipo de Kuro Custom'
        )

        send_mail(
            subject=f'¡Tu pedido #{order.id} fue entregado! — Kuro Custom',
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.user.email],
            fail_silently=True,
        )
        logger.info(
            'Delivered email sent | order=%s recipient=%s',
            order.id, order.user.email,
        )

    except Exception as exc:  # noqa: BLE001
        logger.error(
            'Failed to send delivered email | order=%s error=%s',
            order.id, exc,
        )
