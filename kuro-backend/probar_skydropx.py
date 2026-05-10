import os
import django

# Configuramos el entorno de django para poder usar los modelos
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nordika_backend.settings')
django.setup()

from store.models import Order
from store.skydropx import process_skydropx_shipment

def run_test():
    print("=" * 50)
    print("INICIANDO PRUEBA DE INTEGRACIÓN SKYDROPX ")
    print("=" * 50)

    # Preferir una orden pagada que aún no tenga guía 
    order = (
        Order.objects.filter(status="paid", tracking_number__isnull=True)
        .order_by("-paid_at")
        .first()
    )
    if not order:
        order = Order.objects.filter(status="paid").order_by("-paid_at").first()
    if not order:
        order = Order.objects.order_by("-created_at").first()

    if not order:
        print("No hay órdenes en la base de datos para probar.")
        print("Crea una orden desde el panel de admin o el frontend y márcala como pagada.")
        return

    print(f"Orden #{order.id} | Cliente: {order.user.username if order.user else 'N/A'}")
    print(f"Estado: {order.status} | Envío: {order.shipping_status}")
    print(f"Dirección:\n{order.shipping_address}")
    print("-" * 50)
    print(f"Tracking antes: {order.tracking_number or 'Ninguno'}")

    print("\n Conectando con la API de Skydropx...")
    success = process_skydropx_shipment(order)

    if success:
        order.refresh_from_db()
        print("\n¡ÉXITO! Guía generada.")
        print(f"Tracking: {order.tracking_number}")
        print(f"URL: {order.tracking_url or 'N/A'}")
        print(f"shipping_status: {order.shipping_status}")
    else:
        print("\nFalló la integración con Skydropx.")
        print("Revisa SKYDROPX_API_KEY en .env y que la dirección sea válida.")
        
if __name__ == "__main__":
    run_test()
