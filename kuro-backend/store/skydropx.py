import os
import requests
import logging
import json
import math
import time

logger = logging.getLogger(__name__)

# Se guarda a nivel de módulo para reutilizarlo entre órdenes.
# Se renueva automáticamente cuando expira (margen de 60 s antes del vencimiento).
_cached_token: str | None = None
_token_expires_at: float = 0.0  # timestamp UNIX

SKYDROPX_ENV = os.getenv("SKYDROPX_ENVIRONMENT", "sandbox").lower()

if SKYDROPX_ENV == "sandbox":
    SKYDROPX_BASE_HOST = "https://sb-pro.skydropx.com"
else:
    # Producción (PRO)
    SKYDROPX_BASE_HOST = "https://pro.skydropx.com"

SKYDROPX_API_BASE = f"{SKYDROPX_BASE_HOST}/api/v1"


def get_skydropx_access_token():
    """
    Obtiene un access_token OAuth2 de Skydropx usando client_credentials.
    El token se cachea a nivel de módulo y se renueva automáticamente
    60 segundos antes de que expire para evitar una petición extra por cada orden.
    Usa SKYDROPX_CLIENT_ID y SKYDROPX_CLIENT_SECRET desde el entorno.
    """
    global _cached_token, _token_expires_at

    # Reutilizar token si aún es válido (con margen de 60 s)
    if _cached_token and time.time() < (_token_expires_at - 60):
        logger.debug("Reutilizando access_token cacheado de Skydropx")
        return _cached_token

    client_id = os.getenv("SKYDROPX_CLIENT_ID")
    client_secret = os.getenv("SKYDROPX_CLIENT_SECRET")

    if not client_id or not client_secret:
        logger.error("Faltan SKYDROPX_CLIENT_ID o SKYDROPX_CLIENT_SECRET en .env")
        return None

    token_url = f"{SKYDROPX_API_BASE}/oauth/token"
    payload = {
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "client_credentials",
    }

    try:
        logger.info(f"Solicitando access_token a Skydropx ({SKYDROPX_ENV})")

        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        }
        response = requests.post(token_url, data=payload, headers=headers, timeout=15)
        response.raise_for_status()
        data = response.json()
        access_token = data.get("access_token")

        if not access_token:
            logger.error(f"Respuesta de token sin access_token: {data}")
            return None

        # Guardar en caché con su TTL (Skydropx suele devolver 'expires_in' en segundos)
        expires_in = int(data.get("expires_in", 3600))
        _cached_token = access_token
        _token_expires_at = time.time() + expires_in
        logger.info(f"Nuevo token obtenido. Expira en {expires_in}s")
        return access_token

    except requests.exceptions.RequestException as e:
        http_status = getattr(e.response, "status_code", None)
        snippet = ""
        if getattr(e, "response", None) is not None and e.response.text:
            snippet = e.response.text[:500]
        logger.error(
            f"Error obteniendo token de Skydropx: status={http_status}, body_snippet={snippet}"
        )
        return None
    except ValueError as e:
        snippet = ""
        try:
            snippet = response.text[:500]
        except Exception:
            pass
        logger.error(
            f"Respuesta no JSON al pedir token de Skydropx: {str(e)} | body_snippet={snippet}"
        )
        return None


def parse_shipping_address(address_str):
    try:
        data_json = json.loads(address_str)
        return {
            "name": data_json.get("name", "Cliente"),
            "address1": f"{data_json.get('street', '')} col. {data_json.get('neighborhood', '')}".strip() or "Dirección Desconocida",
            "city": data_json.get("city", "Ciudad Desconocida"),
            "province": data_json.get("state", "Estado Desconocido"),
            "zip": data_json.get("zip", "00000"),
            "phone": data_json.get("phone", "0000000000")
        }
    except json.JSONDecodeError:
        pass

    lines = [line.strip() for line in address_str.strip().split('\n') if line.strip()]
    
    data = {
        "name": "Cliente",
        "address1": "Dirección Desconocida",
        "city": "Ciudad Desconocida",
        "province": "Estado Desconocido",
        "zip": "00000",
        "phone": "0000000000"
    }
    
    if len(lines) > 0:
        data["name"] = lines[0]
    if len(lines) > 1:
        data["address1"] = lines[1]
    if len(lines) > 2:
        parts = lines[2].split(',')
        if len(parts) >= 2:
            data["city"] = parts[0].strip()
            state_zip = parts[1].strip()
            sz_parts = state_zip.rsplit(' ', 1)
            if len(sz_parts) == 2:
                data["province"] = sz_parts[0]
                data["zip"] = sz_parts[1]
            else:
                data["province"] = state_zip
        else:
            data["city"] = lines[2]
            
    if len(lines) > 3:
        data["phone"] = lines[3].replace("Tel:", "").strip()
        
    return data

def process_skydropx_shipment(order_or_id):
    """
    NUEVO FLUJO SKYDROPX PRO ASÍNCRONO:
    1. Cotización (POST /quotations)
    2. Polling (GET /quotations/{id}) hasta is_completed == True
    3. Seleccionar la tarifa exitosa más barata
    4. Generar Envío (POST /shipments) usando quotation_id y rate_id
    5. Guardar tracking en la BD
    """
    from store.models import Order
    
    access_token = get_skydropx_access_token()
    if not access_token:
        logger.error("No se pudo obtener access_token de Skydropx. Revisa CLIENT_ID/CLIENT_SECRET.")
        return False

    if isinstance(order_or_id, int) or isinstance(order_or_id, str):
        try:
            order = Order.objects.get(id=int(order_or_id))
        except Order.DoesNotExist:
            logger.error(f"Skydropx error: Order {order_or_id} not found.")
            return False
    else:
        order = order_or_id
        
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    customer_addr = parse_shipping_address(order.shipping_address)
    email = order.user.email if order.user and order.user.email else "cliente@nordika.mx"
    
    total_weight_kg = 0.0
    total_volume_cm3 = 0.0
    total_qty = 0

    for item in order.items.all():
        qty = item.quantity
        total_qty += qty
        cat = item.product.category
        if cat == 'playeras':
            w, v = 0.2, 1000  
        elif cat == 'shorts_box':
            w, v = 0.22, 1200
        elif cat == 'sudaderas':
            w, v = 0.4, 3750  
        elif cat == 'gorras':
            w, v = 0.15, 4000 
        elif cat == 'tazas':
            w, v = 0.35, 3375 
        else:
            w, v = 0.3, 2000

        total_weight_kg += (w * qty)
        total_volume_cm3 += (v * qty)

    side = max(10, math.ceil(total_volume_cm3 ** (1/3)))
    weight = max(1.0, total_weight_kg)
    
    # Determinar si usar bolsa o caja (mayoreo o mucho volumen)
    # 5H4 = Bolsa, 4G = Caja de cartón
    package_type = "5H4"
    if total_qty >= 5 or total_volume_cm3 >= 15000 or total_weight_kg >= 3.0:
        package_type = "4G"

    cliente_phone = customer_addr["phone"].replace(" ", "").replace("-", "").replace("+", "")
    if len(cliente_phone) < 10:
        cliente_phone = cliente_phone.zfill(10)
    elif len(cliente_phone) > 10:
        cliente_phone = cliente_phone[-10:] # Tomar últimos 10 (remover lada internacional como +52)

    # Extraer colonia si es posible
    colonia = "Centro"
    if "col." in customer_addr["address1"].lower():
        partes_direccion = customer_addr["address1"].lower().split("col.")
        if len(partes_direccion) > 1:
            colonia = partes_direccion[1].strip().title()
    
    quotation_payload = {
        "quotation": {
            "address_from": {
                "country_code": "MX",
                "postal_code": "72320",
                "area_level1": "Puebla",
                "area_level2": "Puebla",
                "area_level3": "Alamos" 
            },
            "address_to": {
                "country_code": "MX",
                "postal_code": str(customer_addr["zip"]),
                "area_level1": customer_addr["province"],
                "area_level2": customer_addr["city"],
                "area_level3": colonia
            },
            "parcels": [
                {
                    "length": int(side),
                    "width": int(side),
                    "height": int(side),
                    "weight": float(round(weight, 2))
                }
            ]
        }
    }
    
    try:
        logger.info(f"Paso 1: Creando Cotización en Skydropx PRO para pedido {order.id}")
        quotation_response = requests.post(f"{SKYDROPX_API_BASE}/quotations", json=quotation_payload, headers=headers)
        quotation_response.raise_for_status()
        quotation_data = quotation_response.json()
        
        quotation_id = quotation_data.get("id")
        
        max_intentos = 10
        intentos = 0
        
        while not quotation_data.get("is_completed", False) and intentos < max_intentos:
            logger.info(f"Cotización pendiente. Esperando 2 segundos para revisar de nuevo... (Intento {intentos + 1}/{max_intentos})")
            time.sleep(2)
            
            get_response = requests.get(f"{SKYDROPX_API_BASE}/quotations/{quotation_id}", headers=headers)
            get_response.raise_for_status()
            quotation_data = get_response.json()
            intentos += 1
            
        if not quotation_data.get("is_completed"):
            logger.error(f"La cotización {quotation_id} tardó demasiado en completarse.")
            return False
        
        rates = quotation_data.get("rates", [])
        
        valid_rates = [r for r in rates if r.get("success") is True and r.get("total") is not None]
        
        if not valid_rates:
            logger.error(f"Skydropx cotizó pero ninguna paquetería tiene cobertura o precio válido para la orden {order.id}")
            return False

        print("\n" + "="*50)
        print("TARIFAS DISPONIBLES ENCONTRADAS:")
        for r in valid_rates:
            provider = r.get("provider_display_name", "Desconocido")
            service = r.get("provider_service_name", "N/A")
            days = r.get("days", "?")
            price = r.get("total", "0.0")
            print(f"- {provider} ({service}) | Entrega: {days} días | Precio: ${price} MXN")
        print("="*50 + "\n")

        selected_rate = min(valid_rates, key=lambda x: float(x.get("total")))
        rate_id = selected_rate.get("id")
        logger.info(f"Tarifa seleccionada: {rate_id} por ${selected_rate.get('total')} | Cotización: {quotation_id}")

        logger.info(f"Paso 2: Generando Envío (Shipment) para pedido {order.id}")
        
        shipment_payload = {
            "shipment": {
                "rate_id": str(rate_id),
                "address_from": {
                    "street1": os.getenv("SKYDROPX_FROM_STREET", "Dirección de origen genérica"), 
                    "name": os.getenv("SKYDROPX_FROM_NAME", "Tienda E-commerce"),
                    "company": os.getenv("SKYDROPX_FROM_COMPANY", "Nombre Comercial"),
                    "phone": os.getenv("SKYDROPX_FROM_PHONE", "0000000000"),
                    "email": os.getenv("SKYDROPX_FROM_EMAIL", "contacto@tienda.com"),
                    "reference": os.getenv("SKYDROPX_FROM_REF", "N/A")
                },
                "address_to": {
                    "street1": customer_addr["address1"][:250], 
                    "name": customer_addr["name"][:250],
                    "company": "Consumidor Final",
                    "phone": cliente_phone,
                    "email": email,
                    "reference": "N/A"
                },
                "packages": [
                    {
                        "package_number": "1",
                        "package_protected": False,
                        "consignment_note": "53102400", # Código SAT genérico para prendas/artículos de vestir
                        "package_type": package_type
                    }
                ]
            }
        }
        
        print("\n" + "="*50)
        print("PAYLOAD DE ENVÍO (SHIPMENT) A ENVIAR:")
        print(json.dumps(shipment_payload, indent=2))
        print("="*50 + "\n")
        
        shipment_response = requests.post(f"{SKYDROPX_API_BASE}/shipments", json=shipment_payload, headers=headers)
        shipment_response.raise_for_status()
        shipment_data = shipment_response.json()
        
        data_node = shipment_data.get("data", {})
        shipment_id = data_node.get("id")
        
        if shipment_id:
            order.skydropx_shipment_id = str(shipment_id)
            order.save(update_fields=['skydropx_shipment_id'])
            logger.info(f"Guardado skydropx_shipment_id={shipment_id} para orden {order.id}")
            
        attributes = data_node.get("attributes", {})
        workflow_status = attributes.get("workflow_status")
        
        if workflow_status == "failed" or workflow_status == "error":
            error_detail = attributes.get("error_detail")
            logger.error(f"Error final generando la guía en Skydropx: {error_detail}")
            return False

        
        tracking_number = attributes.get("master_tracking_number")
        
        tracking_url = ""
        included_node = shipment_data.get("included", [])
        if included_node:
            for item in included_node:
                if item.get("type") == "package":
                    pkg_attrs = item.get("attributes", {})
                    tracking_url_prov = pkg_attrs.get("tracking_url_provider", "")
                    tracking_url_skydropx = pkg_attrs.get("tracking_url", "")
                    tracking_url = tracking_url_prov if tracking_url_prov else tracking_url_skydropx
                    
                    if not tracking_number:
                        tracking_number = pkg_attrs.get("tracking_number")
                    break

        if not tracking_number:
            logger.info(f"Envío {shipment_id} creado sin tracking inmediato. Iniciando polling corto de Skydropx...")
            max_intentos = 12
            for i in range(max_intentos):
                time.sleep(3)
                try:
                    shipment_check = requests.get(f"{SKYDROPX_API_BASE}/shipments/{shipment_id}", headers=headers)
                    if shipment_check.status_code == 200:
                        s_data = shipment_check.json()
                        
                        inc_node = s_data.get("included", [])
                        for item in inc_node:
                            if item.get("type") == "package":
                                p_attrs = item.get("attributes", {})
                                tracking_number = p_attrs.get("tracking_number")
                                t_url_prov = p_attrs.get("tracking_url_provider", "")
                                t_url_sky = p_attrs.get("tracking_url", "")
                                tracking_url = t_url_prov if t_url_prov else t_url_sky
                                break
                        
                        if tracking_number:
                            logger.info(f"Tracking encontrado tras polling (intento {i+1})")
                            break
                except Exception as ex:
                    logger.warning(f"Error en polling de Skydropx: {ex}")
                    pass

        if tracking_number:
            order.tracking_number = str(tracking_number)
            order.tracking_url = tracking_url if tracking_url else None
            order.shipping_status = 'label_created'
            order.save(update_fields=['tracking_number', 'tracking_url', 'shipping_status'])
            logger.info(f"¡Guía generada exitosamente! Tracking: {tracking_number}")
            return True
        else:
            logger.info(f"El envío {shipment_id} se creó correctamente. Tracking no disponible todavía, dependerá del webhook.")
            return True

    except requests.exceptions.RequestException as e:
        print("\n" + "="*50)
        print("ERROR AL COMUNICARSE CON SKYDROPX PRO")
        if getattr(e, "response", None) is not None:
            print(f"Status: {e.response.status_code}")
            try:
                print(json.dumps(e.response.json(), indent=2))
            except:
                print(e.response.text)
        print("="*50 + "\n")
        logger.error(f"Error HTTP: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Error inesperado procesando Skydropx: {str(e)}")
        return False

def process_skydropx_shipment_async(order_or_id):
    """
    Wrapper para lanzar process_skydropx_shipment en un hilo asíncrono y,
    MÁS IMPORTANTE, asegurarse de cerrar la conexión de la BD después.
    """
    import threading
    from django.db import connection

    def target():
        try:
            process_skydropx_shipment(order_or_id)
        finally:
            connection.close()

    threading.Thread(target=target).start()