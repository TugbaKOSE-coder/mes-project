-- ==============================================================================
-- PROJE: Üretim Yönetim Sistemi (MES) - PostgreSQL Veritabanı Şeması (DDL)
-- Bitirme Projesi Raporu İle Birebir Uyumlu Veri Modeli
-- ==============================================================================

-- 1. ENUM Tipleri Tanımlama
CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'PLANNER', 'OPERATOR', 'QC', 'SHIPMENT');
CREATE TYPE order_status_enum AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE work_order_status_enum AS ENUM (
    'PENDING',          -- Beklemede
    'PLANNED',          -- Planlandı
    'IN_PROGRESS',      -- Üretimde
    'STOPPED',          -- Durdu
    'QUALITY_CHECK',    -- Kalite Kontrolde
    'COMPLETED',        -- Tamamlandı
    'SHIPPED'           -- Sevk Edildi
);
CREATE TYPE priority_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE workstation_status_enum AS ENUM ('IDLE', 'RUNNING', 'STOPPED', 'MAINTENANCE');
CREATE TYPE downtime_category_enum AS ENUM ('MECHANICAL', 'ELECTRICAL', 'MATERIAL', 'OPERATOR', 'OTHER');
CREATE TYPE qc_decision_enum AS ENUM ('APPROVED', 'REJECTED', 'CONDITIONAL');
CREATE TYPE shipment_status_enum AS ENUM ('PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- 2. Kullanıcılar ve Roller (Yetkilendirme & RBAC)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'OPERATOR',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Müşteriler (Customers)
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(30),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Ürünler (Products)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    unit VARCHAR(20) NOT NULL DEFAULT 'ADET',
    standard_cycle_time_sec INT DEFAULT 60, -- 1 adet üretmek için standart süre (sn)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. İstasyonlar / Makineler (Workstations)
CREATE TABLE workstations (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    station_type VARCHAR(50),
    capacity_per_hour INT DEFAULT 60,
    status workstation_status_enum NOT NULL DEFAULT 'IDLE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Duruş Nedenleri (Downtime Reasons)
CREATE TABLE downtime_reasons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category downtime_category_enum NOT NULL DEFAULT 'OTHER',
    description TEXT
);

-- 7. Siparişler (Orders)
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    order_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status order_status_enum NOT NULL DEFAULT 'PENDING',
    created_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Sipariş Kalemleri (Order Items)
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. İş Emirleri (Work Orders - Sistemin Kalbi)
CREATE TABLE work_orders (
    id SERIAL PRIMARY KEY,
    work_order_code VARCHAR(50) UNIQUE NOT NULL,
    order_item_id INT NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    workstation_id INT REFERENCES workstations(id) ON DELETE SET NULL,
    planned_quantity INT NOT NULL CHECK (planned_quantity > 0),
    produced_quantity INT NOT NULL DEFAULT 0,
    scrapped_quantity INT NOT NULL DEFAULT 0,
    status work_order_status_enum NOT NULL DEFAULT 'PENDING',
    priority priority_enum NOT NULL DEFAULT 'MEDIUM',
    planned_start_time TIMESTAMP WITH TIME ZONE,
    planned_end_time TIMESTAMP WITH TIME ZONE,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    assigned_operator_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Üretim Logları ve İstasyon Takibi (Production & Downtime Logs)
CREATE TABLE production_logs (
    id SERIAL PRIMARY KEY,
    work_order_id INT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    workstation_id INT NOT NULL REFERENCES workstations(id) ON DELETE RESTRICT,
    operator_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    produced_quantity INT NOT NULL DEFAULT 0,
    scrap_quantity INT NOT NULL DEFAULT 0,
    downtime_minutes INT NOT NULL DEFAULT 0,
    downtime_reason_id INT REFERENCES downtime_reasons(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Kalite Kontrol (Quality Inspections)
CREATE TABLE quality_inspections (
    id SERIAL PRIMARY KEY,
    work_order_id INT NOT NULL REFERENCES work_orders(id) ON DELETE RESTRICT,
    inspector_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    inspection_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sample_quantity INT NOT NULL CHECK (sample_quantity >= 0),
    accepted_quantity INT NOT NULL CHECK (accepted_quantity >= 0),
    rejected_quantity INT NOT NULL CHECK (rejected_quantity >= 0),
    decision qc_decision_enum NOT NULL,
    defect_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Sevkiyat (Shipments)
CREATE TABLE shipments (
    id SERIAL PRIMARY KEY,
    shipment_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    tracking_number VARCHAR(100),
    shipment_date DATE,
    status shipment_status_enum NOT NULL DEFAULT 'PREPARING',
    created_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Sevkiyat Kalemleri (Shipment Items)
CREATE TABLE shipment_items (
    id SERIAL PRIMARY KEY,
    shipment_id INT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    work_order_id INT NOT NULL REFERENCES work_orders(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. İzlenebilirlik ve Denetim Kayıtları (Audit Logs - Non-functional Requirement)
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,       -- CREATE, UPDATE, STATUS_CHANGE, DELETE vb.
    entity_name VARCHAR(50) NOT NULL,  -- work_orders, orders, quality_inspections vb.
    entity_id INT NOT NULL,
    old_state JSONB,
    new_state JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- İndeksler (Sorgu Performansı İçin)
-- ==============================================================================
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_workstation ON work_orders(workstation_id);
CREATE INDEX idx_production_logs_work_order ON production_logs(work_order_id);
CREATE INDEX idx_quality_work_order ON quality_inspections(work_order_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_name, entity_id);
