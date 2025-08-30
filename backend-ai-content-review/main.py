from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API keys from environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Import our models and database
from app.models import (
    HighlightedText, 
    HighlightSaveRequest, 
    HighlightLoadResponse,
    JustifyRequest, 
    JustifyResponse,
    GroundingAnalysis,
    Evidence,
    Violation
)
from app.database import get_db, create_tables
from app.crud import HighlightCRUD
from gemini_service import GeminiGroundingService
import json

# Create FastAPI app
app = FastAPI(
    title="AI Content Review Backend",
    description="Backend API for AI-powered content review and highlighting system",
    version="1.0.0"
)

# Initialize Gemini service
try:
    print("Initializing Gemini service...")
    if GEMINI_API_KEY:
        print(f"Gemini API key found: {GEMINI_API_KEY[:10]}...")
        gemini_service = GeminiGroundingService()
        print("Gemini service initialized successfully")
    else:
        print("No Gemini API key found in environment")
        gemini_service = None
except ValueError as e:
    print(f"Warning: Gemini service not initialized - {e}")
    gemini_service = None
except Exception as e:
    print(f"Error initializing Gemini service: {e}")
    gemini_service = None

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    await create_tables()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],  # Backend API and Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Remove old Pydantic models since they're now in app.models
# class HighlightedText(BaseModel): ... (removed)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "AI Content Review Backend API", "status": "running"}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "ai-content-review-backend",
        "gemini_api_configured": bool(GEMINI_API_KEY),
        "database": "sqlite"
    }

# Get all documents endpoint
@app.get("/api/documents")
async def get_documents():
    """Get list of available documents"""
    documents = [
        {
            "name": "0_Summary.md",
            "path": "/data/0_Summary.md",
            "isMainDocument": True,
            "canHighlight": True
        },
        {
            "name": "1_History_of_Small_Wildfires.md",
            "path": "/data/supporting-material/1_History_of_Small_Wildfires.md",
            "isMainDocument": False,
            "canHighlight": False
        },
        {
            "name": "2_History_of_Medium_Wildfires.md",
            "path": "/data/supporting-material/2_History_of_Medium_Wildfires.md",
            "isMainDocument": False,
            "canHighlight": False
        },
        {
            "name": "3_History_of_Large_Wildfires.md",
            "path": "/data/supporting-material/3_History_of_Large_Wildfires.md",
            "isMainDocument": False,
            "canHighlight": False
        },
        {
            "name": "4_Major_Cities_and_Effects.md",
            "path": "/data/supporting-material/4_Major_Cities_and_Effects.md",
            "isMainDocument": False,
            "canHighlight": False
        },
        {
            "name": "5_Monetary_Impact.md",
            "path": "/data/supporting-material/5_Monetary_Impact.md",
            "isMainDocument": False,
            "canHighlight": False
        }
    ]
    return {"documents": documents}

# Get document content endpoint
@app.get("/api/documents/content/{filename:path}")
async def get_document_content(filename: str):
    """Get the content of a specific document"""
    import os
    
    # Define base paths for different document types
    if filename == "0_Summary.md":
        file_path = os.path.join("data", filename)
    else:
        file_path = os.path.join("data", "supporting-material", filename)
    
    # Security check: ensure the file path is within our data directory
    abs_file_path = os.path.abspath(file_path)
    abs_data_path = os.path.abspath("data")
    
    if not abs_file_path.startswith(abs_data_path):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if file exists
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        return {
            "filename": filename,
            "content": content,
            "size": len(content)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read document: {str(e)}")

# Justify text endpoint
@app.post("/api/justify", response_model=JustifyResponse)
async def justify_text(request: JustifyRequest):
    """
    Justify selected text using AI analysis
    This endpoint integrates with Google's Gemini API
    """
    if not gemini_service:
        raise HTTPException(status_code=500, detail="Gemini service not available")
    
    try:
        # Use Gemini service to ground the text
        grounding_analysis = await gemini_service.ground_text(request.selectedText)
        
        # Parse confidence from analysis (simplified for now)
        confidence = 0.85 if "supported" in grounding_analysis.lower() else 0.45
        
        return JustifyResponse(
            justification=grounding_analysis,
            confidence=confidence,
            sources=[
                "Supporting Material Analysis",
                "Document Cross-reference",
                "Gemini AI Fact-checking"
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze text: {str(e)}")

# Save highlights endpoint
@app.post("/api/highlights")
async def save_highlights(
    request: HighlightSaveRequest,
    db: AsyncSession = Depends(get_db)
):
    """Save highlighted text annotations to SQLite database with AI grounding for justify highlights"""
    try:
        saved_highlights = []
        for highlight in request.highlights:
            print(f"Processing highlight: {highlight.type}, text: {highlight.text[:50]}...")
            
            # If this is a "justify" type highlight, perform grounding analysis using Gemini API
            if highlight.type == "justify":
                print(f"This is a justify highlight, checking Gemini service...")
                if gemini_service:
                    try:
                        print(f"Performing Gemini grounding analysis for text: {highlight.text[:100]}...")
                        grounding_data = await gemini_service.ground_text(highlight.text)
                        
                        # Create structured grounding analysis
                        evidence_list = [Evidence(**ev) for ev in grounding_data.get("alignment_evidence", [])]
                        violations_list = [Violation(**viol) for viol in grounding_data.get("violations", [])]
                        
                        grounding_analysis = GroundingAnalysis(
                            alignment_evidence=evidence_list,
                            violations=violations_list,
                            missing_context=grounding_data.get("missing_context", []),
                            grounding_percentage=grounding_data.get("grounding_percentage", 0),
                            reliability_rating=grounding_data.get("reliability_rating", "NOT GROUNDED"),
                            recommendations=grounding_data.get("recommendations", []),
                            full_analysis_text=grounding_data.get("full_analysis_text", "")
                        )
                        
                        # Store the structured analysis
                        highlight.grounding_analysis = grounding_analysis
                        
                        # Also store a summary in the comment field for backwards compatibility
                        summary = f"Grounding: {grounding_analysis.reliability_rating} ({grounding_analysis.grounding_percentage}%)"
                        if highlight.comment:
                            highlight.comment = f"{highlight.comment}\n\n{summary}"
                        else:
                            highlight.comment = summary
                        
                        print(f"Grounding analysis completed successfully - {grounding_analysis.reliability_rating}")
                    except Exception as e:
                        error_msg = f"Failed to perform grounding analysis: {str(e)}"
                        print(f"Error in grounding analysis: {error_msg}")
                        
                        # Create error grounding analysis
                        error_analysis = GroundingAnalysis(
                            alignment_evidence=[],
                            violations=[Violation(
                                unsupported_claim="Analysis Error",
                                actual_evidence=error_msg,
                                source_file="System",
                                source_section="Error",
                                explanation="An error occurred during grounding analysis"
                            )],
                            missing_context=[],
                            grounding_percentage=0,
                            reliability_rating="NOT GROUNDED",
                            recommendations=["Retry analysis or check system configuration"],
                            full_analysis_text=f"Error: {error_msg}"
                        )
                        
                        highlight.grounding_analysis = error_analysis
                        
                        # Still save the highlight but add error comment
                        if highlight.comment:
                            highlight.comment = f"{highlight.comment}\n\n--- AI Grounding Analysis ---\nError: {error_msg}"
                        else:
                            highlight.comment = f"AI Grounding Analysis Error: {error_msg}"
                else:
                    print("Gemini service not available, skipping grounding analysis")
                    # Create unavailable service analysis
                    unavailable_analysis = GroundingAnalysis(
                        alignment_evidence=[],
                        violations=[],
                        missing_context=[],
                        grounding_percentage=0,
                        reliability_rating="NOT GROUNDED",
                        recommendations=["Enable Gemini service for grounding analysis"],
                        full_analysis_text="Gemini service not available"
                    )
                    
                    highlight.grounding_analysis = unavailable_analysis
                    
                    if highlight.comment:
                        highlight.comment = f"{highlight.comment}\n\n--- AI Grounding Analysis ---\nService not available"
                    else:
                        highlight.comment = "AI Grounding Analysis: Service not available"
            
            # Check if highlight already exists and update, or create new
            print(f"Saving highlight to database...")
            existing = await HighlightCRUD.get_highlight_by_id(db, highlight.id)
            if existing:
                updated_highlight = await HighlightCRUD.update_highlight(db, highlight.id, highlight)
                saved_highlights.append(HighlightCRUD.db_highlight_to_pydantic(updated_highlight))
            else:
                new_highlight = await HighlightCRUD.create_highlight(db, highlight, request.documentName)
                saved_highlights.append(HighlightCRUD.db_highlight_to_pydantic(new_highlight))
            print(f"Highlight saved successfully")
        
        return {
            "success": True,
            "message": f"Successfully saved {len(saved_highlights)} highlights for {request.documentName}",
            "highlights": saved_highlights
        }
    except Exception as e:
        print(f"Error in save_highlights: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to save highlights: {str(e)}")

# Get highlights for a document
@app.get("/api/highlights/{document_name}", response_model=HighlightLoadResponse)
async def get_highlights(
    document_name: str,
    db: AsyncSession = Depends(get_db)
):
    """Get saved highlights for a specific document from SQLite database"""
    try:
        db_highlights = await HighlightCRUD.get_highlights_by_document(db, document_name)
        highlights = [HighlightCRUD.db_highlight_to_pydantic(h) for h in db_highlights]
        
        return HighlightLoadResponse(
            documentName=document_name,
            highlights=highlights
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load highlights: {str(e)}")

# Delete all highlights from the database
@app.delete("/api/highlights/clear")
async def clear_all_highlights(
    db: AsyncSession = Depends(get_db)
):
    """Delete all highlights from the database"""
    try:
        deleted_count = await HighlightCRUD.delete_all_highlights(db)
        return {
            "success": True,
            "message": f"Successfully deleted {deleted_count} highlights from database"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear all highlights: {str(e)}")

# Delete a specific highlight
@app.delete("/api/highlights/{highlight_id}")
async def delete_highlight(
    highlight_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a specific highlight by ID"""
    try:
        deleted = await HighlightCRUD.delete_highlight(db, highlight_id)
        if deleted:
            return {
                "success": True,
                "message": f"Successfully deleted highlight {highlight_id}"
            }
        else:
            raise HTTPException(status_code=404, detail="Highlight not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete highlight: {str(e)}")

# Delete all highlights for a document
@app.delete("/api/highlights/document/{document_name}")
async def delete_document_highlights(
    document_name: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete all highlights for a specific document"""
    try:
        deleted_count = await HighlightCRUD.delete_all_highlights_for_document(db, document_name)
        return {
            "success": True,
            "message": f"Successfully deleted {deleted_count} highlights for {document_name}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete highlights: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)
