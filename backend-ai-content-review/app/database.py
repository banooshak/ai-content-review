import os
from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from datetime import datetime

# Database URL for SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./highlights.db")

# Create async engine
engine = create_async_engine(DATABASE_URL, echo=True)

# Create session factory
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base class for models
Base = declarative_base()

class HighlightedTextDB(Base):
    """SQLAlchemy model for highlighted text"""
    __tablename__ = "highlighted_texts"
    
    id = Column(String, primary_key=True, index=True)
    document_name = Column(String, index=True, nullable=False)
    text = Column(Text, nullable=False)
    start_index = Column(Integer, nullable=False)
    end_index = Column(Integer, nullable=False)
    type = Column(String, nullable=False)  # 'justify', 'thumbs-up', 'thumbs-down', 'comment'
    comment = Column(Text, nullable=True)
    grounding_analysis = Column(Text, nullable=True)  # JSON string for structured grounding data
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Dependency to get database session
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# Create tables
async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
