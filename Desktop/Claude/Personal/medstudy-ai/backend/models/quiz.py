from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from datetime import datetime
from database import Base

class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    quiz_type = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    topic = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, nullable=False)
    score = Column(Float, nullable=True)
    answers = Column(Text, nullable=True)
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
