# 🏭 Üretim Yönetim Sistemi (MES) - Bitirme Projesi

> **Sipariş, Planlama, İş Emri, Üretim Takibi, Kalite Kontrol ve Sevkiyat Süreçlerinin Tek Platformda Yönetimi**  
> *Bilgisayar Mühendisliği Bölümü — Dönem Sonu Bitirme Projesi*

---

## 📖 1. Proje Hakkında

Birçok üretim işletmesinde üretim bilgileri kâğıt formlar, Excel dosyaları ve sözlü iletişim yoluyla yönetilmektedir. Bu durum süreçlerde gecikmelere, izlenebilirlik kaybına ve planlama hatalarına yol açmaktadır.

Geliştirilen bu **Üretim Yönetim Sistemi (MES - Manufacturing Execution System)**, bir fabrikanın müşteri siparişinden son sevkiyatına kadar olan tüm aşamalarını tek bir dijital platform üzerinden gerçek zamanlı olarak takip etmeyi ve yönetmeyi sağlar.

---

## 🚀 2. Temel Özellikler ve Modüller

* **Kimlik Doğrulama & Rol Tabanlı Erişim (RBAC):** `ADMIN`, `PLANNER` (Planlama), `OPERATOR` (Atölye/Usta), `QC` (Kalite Kontrol) ve `SHIPMENT` (Sevkiyat) rolleri. JWT tabanlı güvenli oturum.
* **İş Emri Durum Makinesi (State Machine):**  
  `Beklemede ➔ Planlandı ➔ Üretimde ➔ (Durdu) ➔ Kalite Kontrolde ➔ Tamamlandı ➔ Sevk Edildi`
  * Kalite kontrolde reddedilen ürünler için otomatik **yeniden işleme (rework)** akışı.
* **Gerçek Zamanlı İstasyon Entegrasyonu:** İş emri başladığında makine durumu otomatik `RUNNING`, duruş bildirildiğinde `STOPPED`, bittiğinde `IDLE` olur.
* **Operatör & Duruş Takibi:** Üretilen adet, fire sayısı, duruş süreleri ve duruş nedenleri (Mekanik arıza, elektrik, malzeme eksikliği vb.) anlık kaydedilir.
* **İzlenebilirlik (Audit Logging):** Kritik işlemlerin denetim logları sistemde saklanır.

---

## 🛠️ 3. Kullanılan Teknolojiler

| Katman | Teknoloji | Açıklama |
|---|---|---|
| **Backend** | Python 3.12 + FastAPI | Yüksek performanslı asenkron REST API motoru |
| **Veritabanı & ORM** | PostgreSQL / SQLite + SQLAlchemy | İlişkisel veri modeli ve migration altyapısı |
| **Veri Doğrulama** | Pydantic v2 | Tip güvenliği ve istek/yanıt filtreleri |
| **Güvenlik** | JWT (python-jose) + bcrypt | Durumsuz (stateless) oturum ve parola hashleme |
| **Dokümantasyon** | Swagger UI / OpenAPI & ReDoc | Otomatik etkileşimli API dokümantasyonu |

---

## 📁 4. Proje Dizin Yapısı

```text
mes-project/
├── auth.py              # JWT token üretimi ve bcrypt şifreleme mantığı
├── database.py          # Veritabanı motoru ve bağlantı yönetimi
├── models.py            # SQLAlchemy veritabanı tabloları ve ilişkileri
├── schemas.py           # Pydantic istek/yanıt veri modelleri
├── schema.sql           # PostgreSQL saf DDL şeması
├── init_db.py           # Tabloları oluşturan ve örnek makineleri yükleyen betik
├── requirements.txt     # Bağımlılık paketleri
├── test_api.py          # Entegrasyon ve API testleri
├── main.py              # FastAPI ana uygulama ve CORS ayarları
└── routers/             # Modüler API kapıları
    ├── auth.py          # Giriş, token ve kullanıcı işlemleri
    ├── workstations.py  # Tezgah/makine listeleme ve durum yönetimi
    ├── work_orders.py   # İş emirleri ve durum makinesi (state machine)
    ├── production.py    # Operatör üretim ve arıza/duruş kayıtları
    └── quality.py       # Kalite kontrol onay/ret ve rework döngüsü
```

---

## ⚙️ 5. Kurulum ve Çalıştırma

### 1. Adım: Depoyu Klonlayın
```bash
git clone <GITHUB_REPO_URL>
cd mes-project
```

### 2. Adım: Sanal Ortam (venv) Kurun ve Aktifleştirin
* **Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```
* **Linux / macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Adım: Bağımlılıkları Yükleyin
```bash
pip install -r requirements.txt
```

### 4. Adım: Veritabanını Başlatın (Tablolar & Örnek Veriler)
```bash
python init_db.py
```

### 5. Adım: Sunucuyu Başlatın
```bash
uvicorn main:app --reload --port 8000
```

---

## 🌐 6. Canlı API Dokümantasyonu (Swagger UI)

Sunucu çalıştıktan sonra tarayıcınızda şu adresi açın:
👉 **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**

### Test Kullanıcı Giriş Bilgileri:
* **Kullanıcı Adı:** `admin`
* **Şifre:** `admin123`
*(Swagger arayüzünün sağ üst köşesindeki `Authorize` butonundan giriş yapabilirsiniz).*

---

## 🧪 7. Testleri Çalıştırma

API uçtan uca akışını doğrulamak için:
```bash
python test_api.py
```
*(Tüm testler başarılı olduğunda yeşil `OK` bildirimleri konsola yazdırılır).*
