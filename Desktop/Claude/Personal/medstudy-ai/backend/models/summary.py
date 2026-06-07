from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Summary(Base):
    __tablename__ = "summaries"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    summary_type = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    source_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    document = relationship("Document", back_populates="summaries")
