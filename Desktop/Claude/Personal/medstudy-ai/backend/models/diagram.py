from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from database import Base

class Diagram(Base):
    __tablename__ = "diagrams"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    topic = Column(String, nullable=True)
    mermaid_code = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
