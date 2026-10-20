from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any

from database import get_db
from models import WorkOrder, Workstation, ProductionLog, DowntimeReason, QualityInspection, User
from auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Verimlilik & OEE Analitiği"])

@router.get("/oee", summary="Gerçek OEE ve Duruş Analitiği")
def get_oee_metrics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Veritabanındaki gerçek iş emirleri, üretim logları ve duruş kayıtlarından
    dinamik OEE (Kullanılabilirlik, Performans, Kalite) ve Pareto duruş analizini hesaplar.
    """
    # 1. Toplam Üretim ve Fire Miktarları (work_orders tablosundan)
    totals = db.query(
        func.coalesce(func.sum(WorkOrder.planned_quantity), 0).label("planned"),
        func.coalesce(func.sum(WorkOrder.produced_quantity), 0).label("produced"),
        func.coalesce(func.sum(WorkOrder.scrapped_quantity), 0).label("scrapped")
    ).first()

    total_planned = int(totals.planned) if totals else 0
    total_produced = int(totals.produced) if totals else 0
    total_scrapped = int(totals.scrapped) if totals else 0

    # 2. Toplam Duruş Süresi (production_logs tablosundan)
    total_downtime_minutes = db.query(
        func.coalesce(func.sum(ProductionLog.downtime_minutes), 0)
    ).scalar() or 0
    total_downtime_minutes = int(total_downtime_minutes)

    # 3. Planlanan Vardiya Çalışma Süresi (İstasyon sayısı * 8 saat = 480 dk/istasyon)
    station_count = db.query(Workstation).count() or 1
    shift_planned_minutes = station_count * 480  # Günlük vardiya süresi (dk)

    # 4. Dinamik Kullanılabilirlik (Availability)
    if shift_planned_minutes > 0:
        operating_minutes = max(0, shift_planned_minutes - total_downtime_minutes)
        availability_rate = round((operating_minutes / shift_planned_minutes) * 100, 1)
    else:
        availability_rate = 0.0

    # 5. Dinamik Performans (Performance) ve Çevrim Süreleri
    avg_std_cycle = db.query(func.avg(Product.standard_cycle_time_sec)).scalar() or 60
    standard_cycle_sec = int(round(avg_std_cycle))

    operating_seconds = operating_minutes * 60
    if total_produced > 0 and operating_seconds > 0:
        actual_cycle_sec = round(operating_seconds / total_produced, 1)
        # Performance: (Standart Çevrim * Üretim) / Çalışma Süresi
        perf_calc = ((standard_cycle_sec * total_produced) / operating_seconds) * 100
        performance_rate = round(min(100.0, max(0.0, perf_calc)), 1)
    elif total_planned > 0:
        actual_cycle_sec = 0.0
        performance_rate = round(min(100.0, (total_produced / total_planned) * 100), 1)
    else:
        actual_cycle_sec = 0.0
        performance_rate = 0.0

    # 6. Dinamik Kalite Oranı (Quality)
    total_pieces = total_produced + total_scrapped
    if total_pieces > 0:
        quality_rate = round((total_produced / total_pieces) * 100, 1)
    else:
        quality_rate = 100.0 if total_produced > 0 else 0.0

    # 7. Genel Ekipman Verimliliği (OEE) = (A * P * Q) / 10000
    if availability_rate > 0 and performance_rate > 0 and quality_rate > 0:
        oee_rate = round((availability_rate * performance_rate * quality_rate) / 10000, 1)
    else:
        oee_rate = 0.0

    # 8. Dinamik Pareto Duruş Nedenleri Dağılımı (production_logs ve downtime_reasons üzerinden)
    pareto_query = db.query(
        DowntimeReason.name,
        func.coalesce(func.sum(ProductionLog.downtime_minutes), 0).label("minutes")
    ).join(
        ProductionLog, ProductionLog.downtime_reason_id == DowntimeReason.id
    ).group_by(DowntimeReason.name).order_by(func.sum(ProductionLog.downtime_minutes).desc()).all()

    pareto_list = []
    if pareto_query and total_downtime_minutes > 0:
        for name, mins in pareto_query:
            mins_int = int(mins)
            pct = round((mins_int / total_downtime_minutes) * 100, 1)
            pareto_list.append({
                "reason": name,
                "minutes": mins_int,
                "percent": pct
            })
    elif total_downtime_minutes == 0:
        pareto_list = []

    return {
        "availability_rate": availability_rate,
        "performance_rate": performance_rate,
        "quality_rate": quality_rate,
        "oee_rate": oee_rate,
        "shift_planned_minutes": shift_planned_minutes,
        "total_downtime_minutes": total_downtime_minutes,
        "total_planned": total_planned,
        "total_produced": total_produced,
        "total_scrapped": total_scrapped,
        "standard_cycle_sec": standard_cycle_sec,
        "actual_cycle_sec": actual_cycle_sec,
        "downtime_pareto": pareto_list
    }

