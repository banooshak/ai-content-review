from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime

class Evidence(BaseModel):
    """Model for grounding evidence"""
    claim: str
    supporting_quote: str
    source_file: str
    source_section: str
    explanation: str

class Violation(BaseModel):
    """Model for grounding violations"""
    unsupported_claim: str
    actual_evidence: str
    source_file: str
    source_section: str
    explanation: str

class GroundingAnalysis(BaseModel):
    """Model for detailed grounding analysis"""
    alignment_evidence: List[Evidence]
    violations: List[Violation]
    missing_context: List[str]
    grounding_percentage: int
    reliability_rating: Literal['FULLY GROUNDED', 'MOSTLY GROUNDED', 'PARTIALLY GROUNDED', 'POORLY GROUNDED', 'NOT GROUNDED']
    recommendations: List[str]
    full_analysis_text: str

class HighlightedText(BaseModel):
    """Model for highlighted text with annotations - matches frontend interface"""
    text: str
    startIndex: int
    endIndex: int
    type: Literal['justify', 'thumbs-up', 'thumbs-down', 'comment']
    id: str
    comment: Optional[str] = None
    grounding_analysis: Optional[GroundingAnalysis] = None

class HighlightedTextDB(BaseModel):
    """Database model for highlighted text with timestamps"""
    text: str
    startIndex: int
    endIndex: int
    type: Literal['justify', 'thumbs-up', 'thumbs-down', 'comment']
    id: str
    comment: Optional[str] = None
    grounding_analysis: Optional[str] = None  # JSON string for database storage
    document_name: str
    created_at: datetime
    updated_at: datetime

class Document(BaseModel):
    """Model for document metadata"""
    name: str
    path: str
    isMainDocument: bool
    canHighlight: bool
    size: Optional[int] = None
    lastModified: Optional[str] = None

class JustifyRequest(BaseModel):
    """Request model for text justification"""
    selectedText: str
    documentContent: str
    documentName: str

class JustifyResponse(BaseModel):
    """Response model for text justification"""
    justification: str
    confidence: float
    sources: List[str]

class HighlightSaveRequest(BaseModel):
    """Request model for saving highlights"""
    documentName: str
    highlights: List[HighlightedText]

class HighlightLoadResponse(BaseModel):
    """Response model for loading highlights"""
    documentName: str
    highlights: List[HighlightedText]

class ApiResponse(BaseModel):
    """Generic API response model"""
    success: bool
    message: str
    data: Optional[dict] = None
