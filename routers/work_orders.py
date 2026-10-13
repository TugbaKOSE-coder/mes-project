from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import (
    WorkOrder, WorkOrderStatus, Workstation, WorkstationStatus,
    User, UserRole, Product, OrderItem
)
from schemas import (
    WorkOrderResponse, WorkOrderCreate, WorkOrderStatusUpdate
)
from auth import get_current_user, require_roles

router = APIRouter(prefix="/api/work-orders", tags=["İş Emirleri (Work Orders)"])

# ==============================================================================
# İŞ EMRİ DURUM GEÇİŞ KURALLARI (STATE MACHINE)
# ==============================================================================
VALID_TRANSITIONS = {
    WorkOrderStatus.PENDING: [WorkOrderStatus.PLANNED],
    WorkOrderStatus.PLANNED: [WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.PENDING],
    WorkOrderStatus.IN_PROGRESS: [WorkOrderStatus.STOPPED, WorkOrderStatus.QUALITY_CHECK],
    WorkOrderStatus.STOPPED: [WorkOrderStatus.IN_PROGRESS],
    WorkOrderStatus.QUALITY_CHECK: [WorkOrderStatus.COMPLETED, WorkOrderStatus.IN_PROGRESS], # In Progress = Rework
    WorkOrderStatus.COMPLETED: [WorkOrderStatus.SHIPPED],
    WorkOrderStatus.SHIPPED: [] # Nihai durum
}

@router.get("", response_model=List[WorkOrderResponse], summary="İş Emirlerini Listele")
def list_work_orders(
    status_filter: Optional[WorkOrderStatus] = None,
    workstation_id: Optional[int] = None,
    assigned_to_me: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Filtrelere göre iş emirlerini getirir."""
    query = db.query(WorkOrder)
    if status_filter:
        query = query.filter(WorkOrder.status == status_filter)
    if workstation_id:
        query = query.filter(WorkOrder.workstation_id == workstation_id)
    if assigned_to_me:
        query = query.filter(WorkOrder.assigned_operator_id == current_user.id)
    
    return query.order_by(WorkOrder.created_at.desc()).all()

@router.get("/{work_order_id}", response_model=WorkOrderResponse, summary="İş Emri Detayı")
def get_work_order(
    work_order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    work_order = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not work_order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="İş emri bulunamadı!")
    return work_order

@router.post("", response_model=WorkOrderResponse, status_code=status.HTTP_201_CREATED, summary="Yeni İş Emri Oluştur (Planlama / Admin)")
def create_work_order(
    wo_in: WorkOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PLANNER]))
):
    """Planlamacı veya yöneticinin yeni bir iş emri açması."""
    existing = db.query(WorkOrder).filter(WorkOrder.work_order_code == wo_in.work_order_code).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bu iş emri kodu zaten mevcut!")
    
    # Başlangıç durumu istasyon atanmışsa PLANNED, atanmamışsa PENDING
    initial_status = WorkOrderStatus.PLANNED if wo_in.workstation_id else WorkOrderStatus.PENDING

    new_wo = WorkOrder(
        work_order_code=wo_in.work_order_code,
        order_item_id=wo_in.order_item_id,
        product_id=wo_in.product_id,
        workstation_id=wo_in.workstation_id,
        planned_quantity=wo_in.planned_quantity,
        priority=wo_in.priority,
        status=initial_status,
        planned_start_time=wo_in.planned_start_time,
        planned_end_time=wo_in.planned_end_time,
        assigned_operator_id=wo_in.assigned_operator_id,
        created_by_user_id=current_user.id,
        notes=wo_in.notes
    )
    db.add(new_wo)
    db.commit()
    db.refresh(new_wo)
    return new_wo

@router.patch("/{work_order_id}/status", response_model=WorkOrderResponse, summary="İş Emri Durumunu Güncelle (State Machine Kontrolü)")
def update_work_order_status(
    work_order_id: int,
    status_update: WorkOrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    İş emrinin durumunu günceller.
    Rapordaki kural: Geçersiz durum geçişleri iş mantığı katmanında engellenir!
    """
    wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not wo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="İş emri bulunamadı!")
    
    current_status = wo.status
    target_status = status_update.status

    # Durum aynıysa bir şey yapma
    if current_status == target_status:
        return wo

    # 1. State Machine Kural Kontrolü
    allowed_next_states = VALID_TRANSITIONS.get(current_status, [])
    if target_status not in allowed_next_states:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Geçersiz durum geçişi! '{current_status.value}' durumundan '{target_status.value}' durumuna geçilemez. Geçerli adımlar: {[s.value for s in allowed_next_states]}"
        )

    # 2. Yetki Kontrolleri
    if target_status == WorkOrderStatus.PLANNED and current_user.role not in [UserRole.ADMIN, UserRole.PLANNER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Yalnızca Planlama ve Yönetici iş emrini planlayabilir.")
    
    # 3. Gerçek Zamanlı İstasyon (Makine) Entegrasyonu
    # İş emri başladığında makineyi RUNNING, durduğunda STOPPED, bittiğinde IDLE yap
    if wo.workstation_id:
        station = db.query(Workstation).filter(Workstation.id == wo.workstation_id).first()
        if station:
            if target_status == WorkOrderStatus.IN_PROGRESS:
                station.status = WorkstationStatus.RUNNING
                if not wo.actual_start_time:
                    wo.actual_start_time = datetime.utcnow()
            elif target_status == WorkOrderStatus.STOPPED:
                station.status = WorkstationStatus.STOPPED
            elif target_status in [WorkOrderStatus.QUALITY_CHECK, WorkOrderStatus.COMPLETED]:
                station.status = WorkstationStatus.IDLE
                if target_status == WorkOrderStatus.COMPLETED and not wo.actual_end_time:
                    wo.actual_end_time = datetime.utcnow()

    # Durumu güncelle
    wo.status = target_status
    if status_update.notes:
        wo.notes = f"{wo.notes or ''}\n[{datetime.utcnow().strftime('%Y-%m-%d %H:%M')}] {status_update.notes}".strip()

    db.commit()
    db.refresh(wo)
    return wo
