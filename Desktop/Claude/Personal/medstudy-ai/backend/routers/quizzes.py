import json, re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models.quiz import Quiz, QuizAttempt
from models.document import Document
from services.anthropic_service import generate_quiz, evaluate_clinical_response, evaluate_development_response

router = APIRouter(prefix="/quizzes", tags=["quizzes"])

def _parse_json(raw: str) -> dict:
    raw = raw.strip()
    raw = re.sub(r'^```(?:json)?\s*', '', raw)
    raw = re.sub(r'\s*```$', '', raw)
    return json.loads(raw)

class QuizRequest(BaseModel):
    topic: str
    quiz_type: str
    num_questions: int = 5
    text: Optional[str] = None
    document_id: Optional[int] = None

class EvalRequest(BaseModel):
    quiz_id: int
    user_response: str

class DevEvalRequest(BaseModel):
    quiz_id: int
    question_id: int
    user_response: str

@router.post("/generate")
async def create_quiz(req: QuizRequest, db: Session = Depends(get_db)):
    context_text = req.text
    if not context_text and req.document_id:
        doc = db.query(Document).filter(Document.id == req.document_id).first()
        if not doc:
            raise HTTPException(404, "Documento no encontrado")
        context_text = doc.content
    raw = await generate_quiz(req.topic, req.quiz_type, req.num_questions, context_text)
    try:
        parsed = _parse_json(raw)
    except Exception:
        raise HTTPException(500, "Error al parsear respuesta. Intenta nuevamente.")
    quiz = Quiz(title=f"Cuestionario: {req.topic}",
                quiz_type=req.quiz_type, content=json.dumps(parsed), topic=req.topic)
    db.add(quiz); db.commit(); db.refresh(quiz)
    return {"id": quiz.id, "title": quiz.title, "content": parsed}

@router.post("/evaluate-clinical")
async def evaluate_case(req: EvalRequest, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == req.quiz_id).first()
    if not quiz:
        raise HTTPException(404, "Cuestionario no encontrado")
    data = _parse_json(quiz.content)
    raw_feedback = await evaluate_clinical_response(
        data.get("case", ""), req.user_response, data
    )
    try:
        feedback = _parse_json(raw_feedback)
    except Exception:
        raise HTTPException(500, "Error al parsear evaluación. Intenta nuevamente.")
    attempt = QuizAttempt(quiz_id=req.quiz_id, score=feedback.get("score"),
                          answers=req.user_response, feedback=json.dumps(feedback))
    db.add(attempt); db.commit()
    return feedback

@router.post("/evaluate-development")
async def evaluate_development(req: DevEvalRequest, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == req.quiz_id).first()
    if not quiz:
        raise HTTPException(404, "Cuestionario no encontrado")
    data = _parse_json(quiz.content)
    questions = data.get("questions", [])
    q = next((x for x in questions if x.get("id") == req.question_id), None)
    if not q:
        raise HTTPException(404, "Pregunta no encontrada")
    raw_feedback = await evaluate_development_response(
        q.get("question", ""), req.user_response,
        q.get("key_points", []), q.get("model_answer", "")
    )
    try:
        feedback = _parse_json(raw_feedback)
    except Exception:
        raise HTTPException(500, "Error al parsear evaluación.")
    attempt = QuizAttempt(quiz_id=req.quiz_id, score=feedback.get("score"),
                          answers=req.user_response, feedback=json.dumps(feedback))
    db.add(attempt); db.commit()
    return feedback

@router.get("")
def list_quizzes(db: Session = Depends(get_db)):
    return db.query(Quiz).order_by(Quiz.created_at.desc()).all()

@router.delete("/{quiz_id}")
def delete_quiz(quiz_id: int, db: Session = Depends(get_db)):
    q = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not q:
        raise HTTPException(404, "Cuestionario no encontrado")
    db.delete(q); db.commit()
    return {"message": "Eliminado"}
