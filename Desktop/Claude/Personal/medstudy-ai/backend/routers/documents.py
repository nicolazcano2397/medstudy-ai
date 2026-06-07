import os, shutil
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from database import get_db
from models.document import Document
from services.file_service import process_uploaded_file
from config import settings

router = APIRouter(prefix="/documents", tags=["documents"])
ALLOWED_TYPES = ["pdf", "ppt", "pptx", "doc", "docx"]
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    folder_id: int = Form(None),
    db: Session = Depends(get_db)
):
    ext = file.filename.split(".")[-1].lower()
    if ext not in ALLOWED_TYPES:
        raise HTTPException(400, f"Solo se permiten: {', '.join(ALLOWED_TYPES)}")
    file_path = f"{settings.UPLOAD_DIR}/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    try:
        content = process_uploaded_file(file_path, ext)
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(500, f"Error al procesar: {str(e)}")
    doc = Document(title=file.filename, content=content,
                   file_path=file_path, file_type=ext, folder_id=folder_id)
    db.add(doc); db.commit(); db.refresh(doc)
    return {"id": doc.id, "title": doc.title, "file_type": ext,
            "char_count": len(content), "preview": content[:300]}

@router.get("")
def list_documents(folder_id: int = None, db: Session = Depends(get_db)):
    q = db.query(Document)
    if folder_id:
        q = q.filter(Document.folder_id == folder_id)
    return q.order_by(Document.created_at.desc()).all()

@router.get("/{doc_id}")
def get_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")
    return doc

@router.delete("/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")
    if doc.file_path and os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    db.delete(doc); db.commit()
    return {"message": "Eliminado"}
