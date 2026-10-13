from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import (
    QualityInspection, WorkOrder, WorkOrderStatus,
    User, UserRole, QCDecision
)
from schemas import (
    QualityInspectionCreate, QualityInspectionResponse
)
from auth import get_current_user, require_roles

router = APIRouter(prefix="/api/quality", tags=["Kalite Kontrol (QC)"])

@router.get("/inspections", response_model=List[QualityInspectionResponse], summary="Muayene Kayıtlarını Listele")
def list_inspections(
    work_order_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(QualityInspection)
    if work_order_id:
        query = query.filter(QualityInspection.work_order_id == work_order_id)
    return query.order_by(QualityInspection.inspection_date.desc()).all()

@router.post("/inspect", response_model=QualityInspectionResponse, status_code=status.HTTP_201_CREATED, summary="Kalite Muayenesi Kaydet (QC / Admin)")
def create_inspection(
    inspection_in: QualityInspectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.QC]))
):
    """
    Kalite kontrol muayenesini kaydeder.
    - Kabul edilirse iş emri 'COMPLETED' durumuna geçer.
    - Reddedilirse iş emri tekrar 'IN_PROGRESS' (Yeniden İşleme - Rework) durumuna alınır.
    """
    wo = db.query(WorkOrder).filter(WorkOrder.id == inspection_in.work_order_id).first()
    if not wo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="İş emri bulunamadı!")

    new_inspection = QualityInspection(
        work_order_id=inspection_in.work_order_id,
        inspector_id=current_user.id,
        sample_quantity=inspection_in.sample_quantity,
        accepted_quantity=inspection_in.accepted_quantity,
        rejected_quantity=inspection_in.rejected_quantity,
        decision=inspection_in.decision,
        defect_reason=inspection_in.defect_reason
    )
    db.add(new_inspection)

    # İş emri durumunu karara göre güncelle
    if inspection_in.decision == QCDecision.APPROVED:
        wo.status = WorkOrderStatus.COMPLETED
        wo.actual_end_time = datetime.utcnow()
    elif inspection_in.decision == QCDecision.REJECTED:
        wo.status = WorkOrderStatus.IN_PROGRESS # Rework döngüsü
        wo.notes = f"{wo.notes or ''}\n[Kalite Ret] {inspection_in.defect_reason or 'Hatalı ürün tespiti, yeniden işleme alındı.'}".strip()

    db.commit()
    db.refresh(new_inspection)
    return new_inspection
