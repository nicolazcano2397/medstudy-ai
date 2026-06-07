from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models.summary import Summary
from models.document import Document
from services.anthropic_service import generate_summary

router = APIRouter(prefix="/summaries", tags=["summaries"])
VALID_TYPES = {"executive", "bullets", "mechanism", "flashcards"}

class SummaryRequest(BaseModel):
    text: Optional[str] = None
    document_id: Optional[int] = None
    summary_type: str

@router.post("/generate")
async def create_summary(req: SummaryRequest, db: Session = Depends(get_db)):
    source_text = req.text
    if not source_text and req.document_id:
        doc = db.query(Document).filter(Document.id == req.document_id).first()
        if not doc:
            raise HTTPException(404, "Documento no encontrado")
        source_text = doc.content
    if not source_text:
        raise HTTPException(400, "Se requiere texto o document_id")
    if req.summary_type not in VALID_TYPES:
        raise HTTPException(400, f"Tipo inválido. Opciones: {VALID_TYPES}")
    content = await generate_summary(source_text, req.summary_type)
    summary = Summary(document_id=req.document_id, summary_type=req.summary_type,
                      content=content, source_text=source_text[:800])
    db.add(summary); db.commit(); db.refresh(summary)
    return {"id": summary.id, "content": content, "summary_type": req.summary_type}

@router.get("")
def list_summaries(document_id: int = None, db: Session = Depends(get_db)):
    q = db.query(Summary)
    if document_id:
        q = q.filter(Summary.document_id == document_id)
    return q.order_by(Summary.created_at.desc()).all()

@router.get("/{summary_id}")
def get_summary(summary_id: int, db: Session = Depends(get_db)):
    s = db.query(Summary).filter(Summary.id == summary_id).first()
    if not s:
        raise HTTPException(404, "Resumen no encontrado")
    return s

@router.delete("/{summary_id}")
def delete_summary(summary_id: int, db: Session = Depends(get_db)):
    s = db.query(Summary).filter(Summary.id == summary_id).first()
    if not s:
        raise HTTPException(404, "Resumen no encontrado")
    db.delete(s); db.commit()
    return {"message": "Eliminado"}
