from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from models import (
    UserRole, OrderStatus, WorkOrderStatus, Priority,
    WorkstationStatus, DowntimeCategory, QCDecision, ShipmentStatus
)

# ==============================================================================
# AUTH & USER SCHEMAS
# ==============================================================================

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[UserRole] = None

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.OPERATOR

class UserCreate(UserBase):
    password: str = Field(..., min_length=4)

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ==============================================================================
# WORKSTATION SCHEMAS
# ==============================================================================

class WorkstationBase(BaseModel):
    code: str
    name: str
    station_type: Optional[str] = None
    capacity_per_hour: int = 60

class WorkstationCreate(WorkstationBase):
    pass

class WorkstationStatusUpdate(BaseModel):
    status: WorkstationStatus

class WorkstationResponse(WorkstationBase):
    id: int
    status: WorkstationStatus
    created_at: datetime

    class Config:
        from_attributes = True

# ==============================================================================
# DOWNTIME REASON SCHEMAS
# ==============================================================================

class DowntimeReasonResponse(BaseModel):
    id: int
    code: str
    name: str
    category: DowntimeCategory
    description: Optional[str] = None

    class Config:
        from_attributes = True

# ==============================================================================
# PRODUCT & CUSTOMER SCHEMAS
# ==============================================================================

class ProductBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    unit: str = "ADET"
    standard_cycle_time_sec: int = 60

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CustomerBase(BaseModel):
    code: str
    name: str
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ==============================================================================
# WORK ORDER (İŞ EMRİ) SCHEMAS
# ==============================================================================

class WorkOrderCreate(BaseModel):
    work_order_code: str
    order_item_id: int
    product_id: int
    workstation_id: Optional[int] = None
    planned_quantity: int = Field(..., gt=0)
    priority: Priority = Priority.MEDIUM
    planned_start_time: Optional[datetime] = None
    planned_end_time: Optional[datetime] = None
    assigned_operator_id: Optional[int] = None
    notes: Optional[str] = None

class WorkOrderStatusUpdate(BaseModel):
    status: WorkOrderStatus
    notes: Optional[str] = None

class WorkOrderResponse(BaseModel):
    id: int
    work_order_code: str
    order_item_id: int
    product_id: int
    workstation_id: Optional[int] = None
    planned_quantity: int
    produced_quantity: int
    scrapped_quantity: int
    status: WorkOrderStatus
    priority: Priority
    planned_start_time: Optional[datetime] = None
    planned_end_time: Optional[datetime] = None
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    assigned_operator_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime

    # İlgili ürün ve istasyon detaylarını doğrudan görebilmek için
    product: Optional[ProductResponse] = None
    workstation: Optional[WorkstationResponse] = None

    class Config:
        from_attributes = True

# ==============================================================================
# PRODUCTION LOG SCHEMAS (OPERATÖR ÜRETİM VE DURUŞ KAYDI)
# ==============================================================================

class ProductionLogCreate(BaseModel):
    work_order_id: int
    workstation_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    produced_quantity: int = Field(default=0, ge=0)
    scrap_quantity: int = Field(default=0, ge=0)
    downtime_minutes: int = Field(default=0, ge=0)
    downtime_reason_id: Optional[int] = None
    notes: Optional[str] = None

class ProductionLogResponse(BaseModel):
    id: int
    work_order_id: int
    workstation_id: int
    operator_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    produced_quantity: int
    scrap_quantity: int
    downtime_minutes: int
    downtime_reason_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ==============================================================================
# QUALITY INSPECTION SCHEMAS (KALİTE KONTROL)
# ==============================================================================

class QualityInspectionCreate(BaseModel):
    work_order_id: int
    sample_quantity: int = Field(..., ge=0)
    accepted_quantity: int = Field(..., ge=0)
    rejected_quantity: int = Field(..., ge=0)
    decision: QCDecision
    defect_reason: Optional[str] = None

class QualityInspectionResponse(BaseModel):
    id: int
    work_order_id: int
    inspector_id: int
    inspection_date: datetime
    sample_quantity: int
    accepted_quantity: int
    rejected_quantity: int
    decision: QCDecision
    defect_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
