from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Product, User
from schemas import ProductResponse, ProductCreate
from auth import get_current_user

router = APIRouter(prefix="/api/products", tags=["Ürünler"])

@router.get("", response_model=List[ProductResponse], summary="Tüm Ürünleri Listele")
def list_products(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Veritabanındaki kayıtlı tüm ürünleri getirir."""
    return db.query(Product).order_by(Product.name).all()

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED, summary="Yeni Ürün Ekle")
def create_product(product_in: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(Product).filter(Product.code == product_in.code).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bu ürün kodu zaten mevcut!")
    
    new_product = Product(
        code=product_in.code,
        name=product_in.name,
        description=product_in.description,
        unit=product_in.unit,
        standard_cycle_time_sec=product_in.standard_cycle_time_sec
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product
