"""
Veritabanını başlatan ve modellerde tanımlanan tüm tabloları oluşturan betik.
Kullanım: python init_db.py
"""
import sys
from database import engine, SessionLocal
from models import Base, User, UserRole, Workstation, WorkstationStatus, DowntimeReason, DowntimeCategory

def init_database():
    print("==================================================")
    print("🚀 MES VERİTABANI BAŞLATILIYOR...")
    print(f"Bağlantı Adresi: {engine.url}")
    print("==================================================")

    # 1. Modellerdeki tüm tabloları veritabanında fiziksel olarak oluşturur
    print("\n📦 Tablolar oluşturuluyor...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tüm tablolar başarıyla oluşturuldu!")

    # 2. Örnek Başlangıç Verilerini (Seed Data) Ekleyelim
    db = SessionLocal()
    try:
        # Eğer hiç kullanıcı yoksa varsayılan Yöneticiyi ekle
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            print("\n👤 Varsayılan yönetici kullanıcısı ekleniyor (admin)...")
            from auth import get_password_hash
            admin = User(
                username="admin",
                email="admin@mes.local",
                hashed_password=get_password_hash("admin123"),
                full_name="Sistem Yöneticisi",
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin)

        # Örnek İstasyonlar Ekleyelim
        if db.query(Workstation).count() == 0:
            print("🏭 Örnek makineler/istasyonlar ekleniyor...")
            stations = [
                Workstation(code="ST-01", name="CNC Kesim İstasyonu", station_type="Kesim", capacity_per_hour=30, status=WorkstationStatus.IDLE),
                Workstation(code="ST-02", name="Robotik Kaynak İstasyonu", station_type="Kaynak", capacity_per_hour=25, status=WorkstationStatus.IDLE),
                Workstation(code="ST-03", name="Elektrostatik Boya Hattı", station_type="Boya", capacity_per_hour=40, status=WorkstationStatus.IDLE),
                Workstation(code="ST-04", name="Son Montaj & Paketleme", station_type="Montaj", capacity_per_hour=20, status=WorkstationStatus.IDLE),
            ]
            db.add_all(stations)

        # Örnek Duruş Nedenleri Ekleyelim
        if db.query(DowntimeReason).count() == 0:
            print("⚠️ Örnek duruş nedenleri ekleniyor...")
            reasons = [
                DowntimeReason(code="D-01", name="Mekanik Arıza", category=DowntimeCategory.MECHANICAL, description="Makine bıçak veya motor arızası"),
                DowntimeReason(code="D-02", name="Elektrik / Sensör Arızası", category=DowntimeCategory.ELECTRICAL, description="Sensör okuma hatası veya enerji kesintisi"),
                DowntimeReason(code="D-03", name="Hammadde Eksikliği", category=DowntimeCategory.MATERIAL, description="Hatta besleme malzemesi kalmadı"),
                DowntimeReason(code="D-04", name="Operatör Çay/Yemek Molası", category=DowntimeCategory.OPERATOR, description="Planlı mola"),
            ]
            db.add_all(reasons)

        db.commit()
        print("\n🎉 BAŞARILI: Başlangıç verileri veritabanına kaydedildi!")
        print("Artık sistem tabloları ve örnek verileri hazır.\n")

    except Exception as e:
        db.rollback()
        print(f"❌ Hata oluştu: {e}", file=sys.stderr)
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
