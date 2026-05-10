# Kuro Custom - Backend (API)

Backend para la plataforma de e-commerce Kuro Custom. Expone una API REST para autenticación, catálogo, órdenes, pagos e integraciones de terceros. Está construido con Django y Django REST Framework.

## Tecnologías

- Django, Django REST Framework.
- Autenticación: SimpleJWT.
- Base de datos: PostgreSQL.
- Almacenamiento de archivos (media): Cloudinary.
- Configuración: variables de entorno (`python-dotenv`).

## Configuración de entorno

Este proyecto no versiona archivos `.env` reales. Usar el archivo de ejemplo:

```bash
cp .env.example .env
```

Completar al menos:

- `SECRET_KEY` (obligatoria).
- `DEBUG`.
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`.

Las integraciones (Stripe, Mercado Pago, Skydropx, Cloudinary, Google OAuth) se habilitan por variables de entorno en `.env`.

## Instalación (sin Docker)

1. Crear y activar entorno virtual:

```bash
python -m venv .venv
source .venv/bin/activate
```

2. Instalar dependencias:

```bash
pip install -r requirements.txt
```

3. Migraciones y ejecución:

```bash
python manage.py migrate
python manage.py runserver
```

La API quedará disponible por defecto en `http://127.0.0.1:8000/`.

## Estructura

- `kuro_backend/`: configuración principal del proyecto.
- `store/`: aplicación principal (modelos, serializers, vistas y lógica de negocio).

## Seguridad

- No versionar credenciales ni llaves privadas.
- Mantener secretos únicamente en `.env` (ignorado por git) o en un gestor de secretos.
