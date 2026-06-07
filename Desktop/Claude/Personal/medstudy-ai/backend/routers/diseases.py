import json, re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.disease import Disease
from services.anthropic_service import generate_disease_card

router = APIRouter(prefix="/diseases", tags=["diseases"])

def _parse_json(raw: str) -> dict:
    raw = raw.strip()
    # Strip markdown code fences if present
    raw = re.sub(r'^```(?:json)?\s*', '', raw)
    raw = re.sub(r'\s*```$', '', raw)
    return json.loads(raw)

class DiseaseRequest(BaseModel):
    name: str

@router.post("/generate")
async def create_disease_card(req: DiseaseRequest, db: Session = Depends(get_db)):
    existing = db.query(Disease).filter(Disease.name.ilike(f"%{req.name}%")).first()
    if existing:
        return existing
    raw = await generate_disease_card(req.name)
    try:
        data = _parse_json(raw)
    except Exception:
        raise HTTPException(500, f"Error al parsear respuesta del modelo. Intenta nuevamente.")
    disease = Disease(
        name=data.get("name", req.name),
        etiology=data.get("etiology"),
        pathophysiology=data.get("pathophysiology"),
        clinical_presentation=data.get("clinical_presentation"),
        diagnosis=data.get("diagnosis"),
        treatment=data.get("treatment"),
        prognosis=data.get("prognosis")
    )
    db.add(disease); db.commit(); db.refresh(disease)
    return disease

@router.get("/")
def list_diseases(search: str = None, db: Session = Depends(get_db)):
    q = db.query(Disease)
    if search:
        q = q.filter(Disease.name.ilike(f"%{search}%"))
    return q.order_by(Disease.name).all()

@router.get("/{disease_id}")
def get_disease(disease_id: int, db: Session = Depends(get_db)):
    d = db.query(Disease).filter(Disease.id == disease_id).first()
    if not d:
        raise HTTPException(404, "Enfermedad no encontrada")
    return d

@router.delete("/{disease_id}")
def delete_disease(disease_id: int, db: Session = Depends(get_db)):
    d = db.query(Disease).filter(Disease.id == disease_id).first()
    if not d:
        raise HTTPException(404, "Enfermedad no encontrada")
    db.delete(d); db.commit()
    return {"message": "Eliminada"}
