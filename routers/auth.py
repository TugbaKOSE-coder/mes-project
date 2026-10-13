from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from database import get_db
from models import User, UserRole
from schemas import UserCreate, UserLogin, UserResponse, Token
from auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, require_roles
)

router = APIRouter(prefix="/api/auth", tags=["Kimlik Doğrulama (Auth)"])

@router.post("/token", response_model=Token, summary="Swagger UI için OAuth2 Giriş Endpoint'i")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Swagger UI Authorize butonunun kullandığı standart form login kapısı."""
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Hatalı kullanıcı adı veya şifre!",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username, "role": user.role.value})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username
    }

@router.post("/login", response_model=Token, summary="Frontend için JSON Giriş Endpoint'i")
def login_json(credentials: UserLogin, db: Session = Depends(get_db)):
    """React / Frontend uygulamasının JSON ile giriş yapacağı kapı."""
    user = db.query(User).filter(User.username == credentials.username).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Hatalı kullanıcı adı veya şifre!"
        )
    access_token = create_access_token(data={"sub": user.username, "role": user.role.value})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username
    }

@router.post("/register", response_model=UserResponse, summary="Yeni Kullanıcı Kaydı")
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """Yeni kullanıcı oluşturma."""
    existing_user = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu kullanıcı adı veya e-posta adresi zaten kullanımda!"
        )
    
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        role=user_in.role,
        hashed_password=get_password_hash(user_in.password),
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/me", response_model=UserResponse, summary="Giriş Yapan Kullanıcı Bilgisi")
def read_current_user_profile(current_user: User = Depends(get_current_user)):
    """O an oturum açmış olan kullanıcının bilgilerini döner."""
    return current_user
