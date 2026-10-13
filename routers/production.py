from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import (
    ProductionLog, WorkOrder, Workstation, DowntimeReason,
    User, UserRole
)
from schemas import (
    ProductionLogCreate, ProductionLogResponse, DowntimeReasonResponse
)
from auth import get_current_user

router = APIRouter(prefix="/api/production", tags=["Üretim & Operatör Takibi"])

@router.get("/downtime-reasons", response_model=List[DowntimeReasonResponse], summary="Duruş Nedenleri Listesi")
def list_downtime_reasons(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Operatörün duruş bildirirken seçeceği hazır arıza/mola nedenleri."""
    return db.query(DowntimeReason).all()

@router.get("/logs", response_model=List[ProductionLogResponse], summary="Üretim Loglarını Listele")
def list_production_logs(
    work_order_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ProductionLog)
    if work_order_id:
        query = query.filter(ProductionLog.work_order_id == work_order_id)
    return query.order_by(ProductionLog.created_at.desc()).all()

@router.post("/log", response_model=ProductionLogResponse, status_code=status.HTTP_201_CREATED, summary="Üretim ve Duruş Kaydı Gir (Operatör)")
def create_production_log(
    log_in: ProductionLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Operatörün ürettiği adet, fire ve yaşadığı duruş süresini kaydetmesi.
    İş emrindeki toplam üretilen ve fire adetlerini otomatik günceller!
    """
    wo = db.query(WorkOrder).filter(WorkOrder.id == log_in.work_order_id).first()
    if not wo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="İş emri bulunamadı!")

    # Yeni log oluştur
    new_log = ProductionLog(
        work_order_id=log_in.work_order_id,
        workstation_id=log_in.workstation_id,
        operator_id=current_user.id,
        start_time=log_in.start_time,
        end_time=log_in.end_time or datetime.utcnow(),
        produced_quantity=log_in.produced_quantity,
        scrap_quantity=log_in.scrap_quantity,
        downtime_minutes=log_in.downtime_minutes,
        downtime_reason_id=log_in.downtime_reason_id,
        notes=log_in.notes
    )
    db.add(new_log)

    # İş emrinin toplam sayaçlarını güncelle
    wo.produced_quantity += log_in.produced_quantity
    wo.scrapped_quantity += log_in.scrap_quantity

    db.commit()
    db.refresh(new_log)
    return new_log
