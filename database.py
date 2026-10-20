import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# ------------------------------------------------------------------------------
# VERİTABANI BAĞLANTI AYARI
# ------------------------------------------------------------------------------
# 1. Kolay Başlangıç (Sıfır Kurulum): Yerel SQLite dosyası ("mes.db")
# 2. İleride PostgreSQL kurulduğunda: DATABASE_URL ortam değişkeni ile PostgreSQL'e bağlanır.
#    Örnek: "postgresql://postgres:parola@localhost:5432/mes_db"
# ------------------------------------------------------------------------------

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./mes.db")

# SQLite için çoklu thread ayarı, PostgreSQL için standart bağlantı
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """FastAPI endpoint'lerinde veritabanı oturumu açıp kapatmak için kullanılır."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
