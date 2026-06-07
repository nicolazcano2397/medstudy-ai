from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from database import Base

class Disease(Base):
    __tablename__ = "diseases"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    etiology = Column(Text, nullable=True)
    pathophysiology = Column(Text, nullable=True)
    clinical_presentation = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=True)
    treatment = Column(Text, nullable=True)
    prognosis = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
