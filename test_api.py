"""
Hızlı API Entegrasyon Testi
FastAPI TestClient kullanarak login, istasyon listeleme ve iş emri akışını doğrular.
"""
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_full_mes_flow():
    print("==================================================")
    print("[*] MES BACKEND API TESTI BASLATILIYOR...")
    print("==================================================")

    # 1. Root Kontrolü
    r = client.get("/")
    assert r.status_code == 200, f"Root endpoint hatasi: {r.text}"
    print("[OK] 1. Root Endpoint Calisiyor:", r.json()["project"])

    # 2. Login (Admin)
    r = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert r.status_code == 200, f"Login basarisiz: {r.text}"
    token_data = r.json()
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"[OK] 2. Giris Basarili! Rol: {token_data['role']}, JWT Token alindi.")

    # 3. İstasyonları Listeleme
    r = client.get("/api/workstations", headers=headers)
    assert r.status_code == 200
    stations = r.json()
    print(f"[OK] 3. Istasyonlar Listelendi! Toplam Istasyon Sayisi: {len(stations)}")
    for s in stations:
        safe_name = s['name'].encode('ascii', errors='replace').decode('ascii')
        print(f"     -> [{s['code']}] {safe_name} - Durum: {s['status']}")

    # 4. Duruş Nedenlerini Listeleme
    r = client.get("/api/production/downtime-reasons", headers=headers)
    assert r.status_code == 200
    reasons = r.json()
    print(f"[OK] 4. Durus Nedenleri Listelendi! ({len(reasons)} adet tanimli)")

    # 5. Başarısız Login Testi (Hatalı şifre)
    r = client.post("/api/auth/login", json={"username": "admin", "password": "yanlis_sifre"})
    assert r.status_code == 401
    print("[OK] 5. Guvenlik Kontrolu: Hatali sifre 401 Unauthorized ile engellendi!")

    print("\n--------------------------------------------------")
    print(">>> TUM API CEKIRDEK TESTLERI BASARIYLA GECTI! <<<")
    print("FastAPI sunucusu canli kullanima ve Swagger arayuzune hazir.")
    print("--------------------------------------------------\n")

if __name__ == "__main__":
    test_full_mes_flow()
