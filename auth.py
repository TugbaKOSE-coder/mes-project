import os
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import bcrypt
from sqlalchemy.orm import Session

from database import get_db
from models import User, UserRole
from schemas import TokenData

# ==============================================================================
# GÜVENLİK AYARLARI & JWT KONFİGÜRASYONU
# ==============================================================================

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "mes_super_secret_jwt_key_graduation_project_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 Saat

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Girilen düz metin parolanın hash ile eşleştiğini doğrular."""
    try:
        password_bytes = plain_password.encode('utf-8')[:72]
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return plain_password == hashed_password

def get_password_hash(password: str) -> str:
    """Parolayı geri döndürülemez biçimde bcrypt algoritması ile hash'ler."""
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """JWT Token üretir ve rol/kullanıcı bilgilerini içine mühürler."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# ==============================================================================
# KİMLİK DOĞRULAMA & ROL YETKİLENDİRME DEPENDENCY'LERİ
# ==============================================================================

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Gelen JWT token'ı doğrular ve oturum açmış kullanıcı nesnesini döner."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Geçersiz kimlik doğrulama bilgisi veya token süresi dolmuş.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username, role=UserRole(role) if role else None)
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı bulunamadı veya hesabı devre dışı."
        )
    return user

def require_roles(allowed_roles: List[UserRole]):
    """Rol bazlı erişim kontrolü (RBAC) sağlayan filtre."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Bu işlem için yetkiniz yok! Gerekli roller: {[r.value for r in allowed_roles]}, Sizin rolünüz: {current_user.role.value}"
            )
        return current_user
    return role_checker
