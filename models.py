import enum
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, Date,
    Numeric, ForeignKey, Enum as SQLEnum, CheckConstraint, JSON
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

# ==============================================================================
# ENUM DEFINITIONS
# ==============================================================================

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    PLANNER = "PLANNER"
    OPERATOR = "OPERATOR"
    QC = "QC"
    SHIPMENT = "SHIPMENT"

class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class WorkOrderStatus(str, enum.Enum):
    PENDING = "PENDING"              # Beklemede
    PLANNED = "PLANNED"              # Planlandı
    IN_PROGRESS = "IN_PROGRESS"      # Üretimde
    STOPPED = "STOPPED"              # Durdu
    QUALITY_CHECK = "QUALITY_CHECK"  # Kalite Kontrolde
    COMPLETED = "COMPLETED"          # Tamamlandı
    SHIPPED = "SHIPPED"              # Sevk Edildi

class Priority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class WorkstationStatus(str, enum.Enum):
    IDLE = "IDLE"
    RUNNING = "RUNNING"
    STOPPED = "STOPPED"
    MAINTENANCE = "MAINTENANCE"

class DowntimeCategory(str, enum.Enum):
    MECHANICAL = "MECHANICAL"
    ELECTRICAL = "ELECTRICAL"
    MATERIAL = "MATERIAL"
    OPERATOR = "OPERATOR"
    OTHER = "OTHER"

class QCDecision(str, enum.Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CONDITIONAL = "CONDITIONAL"

class ShipmentStatus(str, enum.Enum):
    PREPARING = "PREPARING"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

# ==============================================================================
# MODELS
# ==============================================================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.OPERATOR)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    assigned_work_orders = relationship("WorkOrder", foreign_keys="WorkOrder.assigned_operator_id", back_populates="operator")
    production_logs = relationship("ProductionLog", back_populates="operator")
    inspections = relationship("QualityInspection", back_populates="inspector")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(30), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    contact_person = Column(String(100))
    email = Column(String(100))
    phone = Column(String(30))
    address = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    orders = relationship("Order", back_populates="customer")
    shipments = relationship("Shipment", back_populates="customer")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text)
    unit = Column(String(20), default="ADET", nullable=False)
    standard_cycle_time_sec = Column(Integer, default=60)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    order_items = relationship("OrderItem", back_populates="product")
    work_orders = relationship("WorkOrder", back_populates="product")


class Workstation(Base):
    __tablename__ = "workstations"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(30), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    station_type = Column(String(50))
    capacity_per_hour = Column(Integer, default=60)
    status = Column(SQLEnum(WorkstationStatus), default=WorkstationStatus.IDLE, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    work_orders = relationship("WorkOrder", back_populates="workstation")
    production_logs = relationship("ProductionLog", back_populates="workstation")


class DowntimeReason(Base):
    __tablename__ = "downtime_reasons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    category = Column(SQLEnum(DowntimeCategory), default=DowntimeCategory.OTHER, nullable=False)
    description = Column(Text)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    order_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False, index=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
    work_orders = relationship("WorkOrder", back_populates="order_item")


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(Integer, primary_key=True, index=True)
    work_order_code = Column(String(50), unique=True, nullable=False, index=True)
    order_item_id = Column(Integer, ForeignKey("order_items.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    workstation_id = Column(Integer, ForeignKey("workstations.id"), index=True)
    
    planned_quantity = Column(Integer, nullable=False)
    produced_quantity = Column(Integer, default=0, nullable=False)
    scrapped_quantity = Column(Integer, default=0, nullable=False)

    status = Column(SQLEnum(WorkOrderStatus), default=WorkOrderStatus.PENDING, nullable=False, index=True)
    priority = Column(SQLEnum(Priority), default=Priority.MEDIUM, nullable=False)
    
    planned_start_time = Column(DateTime(timezone=True))
    planned_end_time = Column(DateTime(timezone=True))
    actual_start_time = Column(DateTime(timezone=True))
    actual_end_time = Column(DateTime(timezone=True))

    assigned_operator_id = Column(Integer, ForeignKey("users.id"))
    created_by_user_id = Column(Integer, ForeignKey("users.id"))
    notes = Column(Text)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    order_item = relationship("OrderItem", back_populates="work_orders")
    product = relationship("Product", back_populates="work_orders")
    workstation = relationship("Workstation", back_populates="work_orders")
    operator = relationship("User", foreign_keys=[assigned_operator_id], back_populates="assigned_work_orders")
    
    production_logs = relationship("ProductionLog", back_populates="work_order", cascade="all, delete-orphan")
    inspections = relationship("QualityInspection", back_populates="work_order")
    shipment_items = relationship("ShipmentItem", back_populates="work_order")


class ProductionLog(Base):
    __tablename__ = "production_logs"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    workstation_id = Column(Integer, ForeignKey("workstations.id"), nullable=False)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True))
    
    produced_quantity = Column(Integer, default=0, nullable=False)
    scrap_quantity = Column(Integer, default=0, nullable=False)
    downtime_minutes = Column(Integer, default=0, nullable=False)
    downtime_reason_id = Column(Integer, ForeignKey("downtime_reasons.id"))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    work_order = relationship("WorkOrder", back_populates="production_logs")
    workstation = relationship("Workstation", back_populates="production_logs")
    operator = relationship("User", back_populates="production_logs")


class QualityInspection(Base):
    __tablename__ = "quality_inspections"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False, index=True)
    inspector_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    inspection_date = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    sample_quantity = Column(Integer, default=0, nullable=False)
    accepted_quantity = Column(Integer, default=0, nullable=False)
    rejected_quantity = Column(Integer, default=0, nullable=False)
    
    decision = Column(SQLEnum(QCDecision), nullable=False)
    defect_reason = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    work_order = relationship("WorkOrder", back_populates="inspections")
    inspector = relationship("User", back_populates="inspections")


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    shipment_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    tracking_number = Column(String(100))
    shipment_date = Column(Date)
    status = Column(SQLEnum(ShipmentStatus), default=ShipmentStatus.PREPARING, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("Customer", back_populates="shipments")
    items = relationship("ShipmentItem", back_populates="shipment", cascade="all, delete-orphan")


class ShipmentItem(Base):
    __tablename__ = "shipment_items"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id", ondelete="CASCADE"), nullable=False)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    shipment = relationship("Shipment", back_populates="items")
    work_order = relationship("WorkOrder", back_populates="shipment_items")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(50), nullable=False)
    entity_name = Column(String(50), nullable=False, index=True)
    entity_id = Column(Integer, nullable=False, index=True)
    old_state = Column(JSON)
    new_state = Column(JSON)
    ip_address = Column(String(45))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
