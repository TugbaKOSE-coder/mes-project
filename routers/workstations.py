from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Workstation, WorkstationStatus, User, UserRole
from schemas import WorkstationResponse, WorkstationCreate, WorkstationStatusUpdate
from auth import get_current_user, require_roles

router = APIRouter(prefix="/api/workstations", tags=["İstasyonlar & Makineler"])

@router.get("", response_model=List[WorkstationResponse], summary="Tüm İstasyonları Listele")
def list_workstations(
    status_filter: Optional[WorkstationStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fabrikadaki tüm üretim makinelerini ve anlık durumlarını getirir."""
    query = db.query(Workstation)
    if status_filter:
        query = query.filter(Workstation.status == status_filter)
    return query.all()

@router.get("/{workstation_id}", response_model=WorkstationResponse, summary="Tekil İstasyon Detayı")
def get_workstation(
    workstation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    station = db.query(Workstation).filter(Workstation.id == workstation_id).first()
    if not station:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="İstasyon bulunamadı!")
    return station

@router.post("", response_model=WorkstationResponse, status_code=status.HTTP_201_CREATED, summary="Yeni İstasyon Ekle (Admin)")
def create_workstation(
    station_in: WorkstationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PLANNER]))
):
    """Yeni makine/istasyon tanımı yapar."""
    existing = db.query(Workstation).filter(Workstation.code == station_in.code).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bu istasyon kodu zaten var!")
    
    new_station = Workstation(
        code=station_in.code,
        name=station_in.name,
        station_type=station_in.station_type,
        capacity_per_hour=station_in.capacity_per_hour,
        status=WorkstationStatus.IDLE
    )
    db.add(new_station)
    db.commit()
    db.refresh(new_station)
    return new_station

@router.patch("/{workstation_id}/status", response_model=WorkstationResponse, summary="Makine Durumunu Güncelle")
def update_workstation_status(
    workstation_id: int,
    status_in: WorkstationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Makinenin durumunu günceller (IDLE, RUNNING, STOPPED, MAINTENANCE)."""
    station = db.query(Workstation).filter(Workstation.id == workstation_id).first()
    if not station:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="İstasyon bulunamadı!")
    
    station.status = status_in.status
    db.commit()
    db.refresh(station)
    return station
