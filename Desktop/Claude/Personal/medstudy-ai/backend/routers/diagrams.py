from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models.diagram import Diagram
from models.document import Document
from services.anthropic_service import generate_diagram

router = APIRouter(prefix="/diagrams", tags=["diagrams"])

class DiagramRequest(BaseModel):
    topic: str
    title: Optional[str] = None
    text: Optional[str] = None
    document_id: Optional[int] = None
    diagram_type: Optional[str] = "flowchart"

@router.post("/generate")
async def create_diagram(req: DiagramRequest, db: Session = Depends(get_db)):
    context_text = req.text
    if not context_text and req.document_id:
        doc = db.query(Document).filter(Document.id == req.document_id).first()
        if not doc:
            raise HTTPException(404, "Documento no encontrado")
        context_text = doc.content
    mermaid_code = await generate_diagram(req.topic, context_text, req.diagram_type or "flowchart")
    diagram = Diagram(title=req.title or req.topic,
                      topic=req.topic, mermaid_code=mermaid_code)
    db.add(diagram); db.commit(); db.refresh(diagram)
    return {"id": diagram.id, "title": diagram.title, "mermaid_code": mermaid_code}

@router.get("")
def list_diagrams(db: Session = Depends(get_db)):
    return db.query(Diagram).order_by(Diagram.created_at.desc()).all()

@router.get("/{diagram_id}")
def get_diagram(diagram_id: int, db: Session = Depends(get_db)):
    d = db.query(Diagram).filter(Diagram.id == diagram_id).first()
    if not d:
        raise HTTPException(404, "Diagrama no encontrado")
    return d

@router.put("/{diagram_id}")
def update_diagram(diagram_id: int, mermaid_code: str, db: Session = Depends(get_db)):
    d = db.query(Diagram).filter(Diagram.id == diagram_id).first()
    if not d:
        raise HTTPException(404, "Diagrama no encontrado")
    d.mermaid_code = mermaid_code
    db.commit(); db.refresh(d)
    return d

@router.delete("/{diagram_id}")
def delete_diagram(diagram_id: int, db: Session = Depends(get_db)):
    d = db.query(Diagram).filter(Diagram.id == diagram_id).first()
    if not d:
        raise HTTPException(404, "Diagrama no encontrado")
    db.delete(d); db.commit()
    return {"message": "Eliminado"}
