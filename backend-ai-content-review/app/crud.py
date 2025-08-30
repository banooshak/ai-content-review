from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.database import HighlightedTextDB
from app.models import HighlightedText, GroundingAnalysis
from typing import List, Optional
from datetime import datetime
import json

class HighlightCRUD:
    """CRUD operations for highlighted text"""
    
    @staticmethod
    async def create_highlight(db: AsyncSession, highlight: HighlightedText, document_name: str) -> HighlightedTextDB:
        """Create a new highlight in the database"""
        grounding_json = None
        if highlight.grounding_analysis:
            try:
                grounding_json = highlight.grounding_analysis.json()
            except AttributeError:
                # Fallback for newer Pydantic versions
                grounding_json = json.dumps(highlight.grounding_analysis.dict())
        
        db_highlight = HighlightedTextDB(
            id=highlight.id,
            document_name=document_name,
            text=highlight.text,
            start_index=highlight.startIndex,
            end_index=highlight.endIndex,
            type=highlight.type,
            comment=highlight.comment,
            grounding_analysis=grounding_json,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(db_highlight)
        await db.commit()
        await db.refresh(db_highlight)
        return db_highlight
    
    @staticmethod
    async def get_highlights_by_document(db: AsyncSession, document_name: str) -> List[HighlightedTextDB]:
        """Get all highlights for a specific document"""
        result = await db.execute(
            select(HighlightedTextDB).where(HighlightedTextDB.document_name == document_name)
        )
        return result.scalars().all()
    
    @staticmethod
    async def get_highlight_by_id(db: AsyncSession, highlight_id: str) -> Optional[HighlightedTextDB]:
        """Get a specific highlight by ID"""
        result = await db.execute(
            select(HighlightedTextDB).where(HighlightedTextDB.id == highlight_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_highlight(db: AsyncSession, highlight_id: str, highlight: HighlightedText) -> Optional[HighlightedTextDB]:
        """Update an existing highlight"""
        db_highlight = await HighlightCRUD.get_highlight_by_id(db, highlight_id)
        if db_highlight:
            grounding_json = None
            if highlight.grounding_analysis:
                try:
                    grounding_json = highlight.grounding_analysis.json()
                except AttributeError:
                    # Fallback for newer Pydantic versions
                    grounding_json = json.dumps(highlight.grounding_analysis.dict())
            
            db_highlight.text = highlight.text
            db_highlight.start_index = highlight.startIndex
            db_highlight.end_index = highlight.endIndex
            db_highlight.type = highlight.type
            db_highlight.comment = highlight.comment
            db_highlight.grounding_analysis = grounding_json
            db_highlight.updated_at = datetime.utcnow()
            await db.commit()
            await db.refresh(db_highlight)
        return db_highlight
    
    @staticmethod
    async def delete_highlight(db: AsyncSession, highlight_id: str) -> bool:
        """Delete a highlight by ID"""
        result = await db.execute(
            delete(HighlightedTextDB).where(HighlightedTextDB.id == highlight_id)
        )
        await db.commit()
        return result.rowcount > 0
    
    @staticmethod
    async def delete_all_highlights_for_document(db: AsyncSession, document_name: str) -> int:
        """Delete all highlights for a specific document"""
        result = await db.execute(
            delete(HighlightedTextDB).where(HighlightedTextDB.document_name == document_name)
        )
        await db.commit()
        return result.rowcount
    
    @staticmethod
    async def delete_all_highlights(db: AsyncSession) -> int:
        """Delete all highlights from the database"""
        result = await db.execute(delete(HighlightedTextDB))
        await db.commit()
        return result.rowcount
    
    @staticmethod
    def db_highlight_to_pydantic(db_highlight: HighlightedTextDB) -> HighlightedText:
        """Convert database model to Pydantic model"""
        grounding_analysis = None
        if db_highlight.grounding_analysis:
            try:
                grounding_data = json.loads(db_highlight.grounding_analysis)
                # Handle both dict and string cases
                if isinstance(grounding_data, str):
                    grounding_data = json.loads(grounding_data)
                grounding_analysis = GroundingAnalysis(**grounding_data)
            except Exception as e:
                print(f"Error parsing grounding analysis: {e}")
                # Create a minimal grounding analysis if parsing fails
                grounding_analysis = GroundingAnalysis(
                    alignment_evidence=[],
                    violations=[],
                    missing_context=[],
                    grounding_percentage=0,
                    reliability_rating="NOT GROUNDED",
                    recommendations=["Error parsing stored analysis"],
                    full_analysis_text="Error: Could not parse stored grounding analysis"
                )
        
        return HighlightedText(
            text=db_highlight.text,
            startIndex=db_highlight.start_index,
            endIndex=db_highlight.end_index,
            type=db_highlight.type,
            id=db_highlight.id,
            comment=db_highlight.comment,
            grounding_analysis=grounding_analysis
        )
