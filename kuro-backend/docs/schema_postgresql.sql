-- =============================================================================
-- KURO CUSTOM BACKEND - Esquema completo PostgreSQL
-- Compatible con Django (nombres de tablas store_*, auth_user)
-- Ejecutar en pgAdmin conectado a la base de datos kuro_db
-- =============================================================================
-- Si se usa Django, lo recomendado es crear solo la BD vacía y ejecutar:
--       python manage.py migrate
-- Este script sirve como referencia o para entornos sin Django.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Eliminar tablas existentes (orden inverso por FKs)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS store_customization CASCADE;
DROP TABLE IF EXISTS store_orderitem CASCADE;
DROP TABLE IF EXISTS store_order CASCADE;
DROP TABLE IF EXISTS store_coupon CASCADE;
DROP TABLE IF EXISTS store_productvariant CASCADE;
DROP TABLE IF EXISTS store_product CASCADE;
DROP TABLE IF EXISTS store_useraddress CASCADE;
-- auth_user lo crea Django; no lo borramos si ya existe
-- DROP TABLE IF EXISTS auth_user CASCADE;

-- -----------------------------------------------------------------------------
-- 2. TABLA auth_user (Django - usuarios)
-- Solo crear si no existe (Django migrate la crea por defecto)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_user (
    id SERIAL PRIMARY KEY,
    password VARCHAR(128) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    username VARCHAR(150) NOT NULL UNIQUE,
    first_name VARCHAR(150) NOT NULL DEFAULT '',
    last_name VARCHAR(150) NOT NULL DEFAULT '',
    email VARCHAR(254) NOT NULL,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    date_joined TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. TABLA store_product (productos)
-- -----------------------------------------------------------------------------
CREATE TABLE store_product (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    price NUMERIC(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    image VARCHAR(255),
    is_customizable BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 4. TABLA store_productvariant (tallas y stock)
-- -----------------------------------------------------------------------------
CREATE TABLE store_productvariant (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES store_product(id) ON DELETE CASCADE,
    size VARCHAR(5) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0
);

-- -----------------------------------------------------------------------------
-- 5. TABLA store_coupon (cupones de descuento)
-- -----------------------------------------------------------------------------
CREATE TABLE store_coupon (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(10) NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER,
    times_used INTEGER NOT NULL DEFAULT 0,
    min_purchase NUMERIC(10, 2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_store_coupon_code ON store_coupon(code);

-- -----------------------------------------------------------------------------
-- 6. TABLA store_order (órdenes)
-- -----------------------------------------------------------------------------
CREATE TABLE store_order (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    shipping_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    total_amount NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    shipping_address TEXT NOT NULL,
    tracking_number VARCHAR(100),
    tracking_url VARCHAR(500),
    stripe_payment_id VARCHAR(200),
    mp_preference_id VARCHAR(200),
    mp_payment_id VARCHAR(200),
    payment_method VARCHAR(20),
    card_brand VARCHAR(20),
    card_last4 VARCHAR(4),
    failure_reason TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    coupon_id INTEGER REFERENCES store_coupon(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_store_order_stripe ON store_order(stripe_payment_id);
CREATE INDEX idx_store_order_mp_pref ON store_order(mp_preference_id);
CREATE INDEX idx_store_order_mp_pay ON store_order(mp_payment_id);

-- -----------------------------------------------------------------------------
-- 7. TABLA store_orderitem (ítems de la orden)
-- -----------------------------------------------------------------------------
CREATE TABLE store_orderitem (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES store_order(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES store_product(id) ON DELETE PROTECT,
    variant_id INTEGER REFERENCES store_productvariant(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    customization_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    final_unit_price NUMERIC(10, 2) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 8. TABLA store_customization (personalizaciones)
-- -----------------------------------------------------------------------------
CREATE TABLE store_customization (
    id SERIAL PRIMARY KEY,
    order_item_id INTEGER NOT NULL UNIQUE REFERENCES store_orderitem(id) ON DELETE CASCADE,
    uploaded_image VARCHAR(255) NOT NULL,
    base_color_hex VARCHAR(10) NOT NULL DEFAULT '#ffffff',
    design_position_x DOUBLE PRECISION NOT NULL,
    design_position_y DOUBLE PRECISION NOT NULL,
    design_scale DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 9. TABLA store_useraddress (direcciones del usuario)
-- -----------------------------------------------------------------------------
CREATE TABLE store_useraddress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    alias VARCHAR(50),
    street VARCHAR(255) NOT NULL DEFAULT 'Desconocida',
    exterior_number VARCHAR(50) NOT NULL DEFAULT 'S/N',
    interior_number VARCHAR(50),
    neighborhood VARCHAR(255) NOT NULL DEFAULT 'Desconocida',
    reference TEXT,
    phone VARCHAR(20),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'México',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- Índices adicionales útiles
-- -----------------------------------------------------------------------------
CREATE INDEX idx_store_order_user ON store_order(user_id);
CREATE INDEX idx_store_order_status ON store_order(status);
CREATE INDEX idx_store_orderitem_order ON store_orderitem(order_id);
CREATE INDEX idx_store_useraddress_user ON store_useraddress(user_id);