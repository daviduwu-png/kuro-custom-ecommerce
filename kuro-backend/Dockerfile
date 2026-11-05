FROM python:3.15-slim

# Variables de entorno para optimizar Python en contenedores
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copiar e instalar dependencias de Python (todas usan wheels binarios precompilados)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente de la API
COPY . .

# Exponer el puerto donde correrá el backend
EXPOSE 8000

# Recolectar archivos estáticos para que WhiteNoise los sirva
RUN SECRET_KEY="dummy-key-for-build" python manage.py collectstatic --noinput

RUN useradd -m -r -u 1000 kuro && chown -R kuro:kuro /app
USER 1000

# Comando por defecto para producción usando Gunicorn 
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "--threads", "2", "--timeout", "60", "kuro_backend.wsgi:application"]
