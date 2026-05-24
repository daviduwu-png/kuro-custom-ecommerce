FROM python:3.12-slim

# Variables de entorno para optimizar Python en contenedores
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias del sistema necesarias para PostgreSQL (psycopg2) y compilar
RUN apt-get update \
    && apt-get install -y libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente de la API
COPY . .

# Exponer el puerto donde correrá el backend
EXPOSE 8000

# Recolectar archivos estáticos para que WhiteNoise los sirva
RUN SECRET_KEY="dummy-key-for-build" python manage.py collectstatic --noinput

# Comando por defecto para producción usando Gunicorn 
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "kuro_backend.wsgi:application"]
