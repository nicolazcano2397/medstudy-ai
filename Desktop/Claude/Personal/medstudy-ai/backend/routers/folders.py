from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models.folder import Folder

router = APIRouter(prefix="/folders", tags=["folders"])

class FolderCreate(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None

@router.post("/")
def create_folder(req: FolderCreate, db: Session = Depends(get_db)):
    folder = Folder(**req.dict())
    db.add(folder); db.commit(); db.refresh(folder)
    return folder

@router.get("/")
def list_folders(parent_id: int = None, db: Session = Depends(get_db)):
    q = db.query(Folder)
    q = q.filter(Folder.parent_id == parent_id)
    return q.all()

@router.delete("/{folder_id}")
def delete_folder(folder_id: int, db: Session = Depends(get_db)):
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(404, "Carpeta no encontrada")
    db.delete(folder); db.commit()
    return {"message": "Eliminada"}
