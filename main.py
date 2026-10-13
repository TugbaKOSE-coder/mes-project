from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, workstations, work_orders, production, quality

# ==============================================================================
# FASTAPI UYGULAMASI VE SWAGGER YAPILANDIRMASI
# ==============================================================================

app = FastAPI(
    title="Üretim Yönetim Sistemi (MES) API",
    description="""
## Bilgisayar Mühendisliği Dönem Sonu Bitirme Projesi
Sipariş, Planlama, İş Emri, Üretim Takibi, Kalite Kontrol ve Sevkiyat Süreçlerinin Tek Platformda Yönetimi.

### Desteklenen Modüller:
* **Kimlik Doğrulama (Auth):** JWT & RBAC (Admin, Planlama, Operatör, Kalite, Sevkiyat)
* **İstasyonlar & Makineler:** Fabrika makinelerinin çalışma/arıza durumları
* **İş Emirleri:** Durum makinesi (State Machine) kontrollü üretim döngüsü
* **Üretim Takibi:** Operatör sayaçları, fire miktarı ve duruş kayıtları
* **Kalite Kontrol:** Kabul/Ret kararları ve Rework (yeniden işleme) akışı
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ==============================================================================
# CORS (FRONTEND ERİŞİM İZNİ)
# ==============================================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Geliştirme aşamasında tüm kökenlere izin ver
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================================================
# ROTALARIN (ROUTERS) KAYDI
# ==============================================================================
app.include_router(auth.router)
app.include_router(workstations.router)
app.include_router(work_orders.router)
app.include_router(production.router)
app.include_router(quality.router)

@app.get("/", tags=["Sistem"])
def root():
    return {
        "project": "Üretim Yönetim Sistemi (MES)",
        "status": "Online",
        "docs_url": "/docs",
        "message": "Sistem başarıyla çalışıyor! API testleri için /docs adresini ziyaret edebilirsiniz."
    }
