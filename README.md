# AI Content Review

A comprehensive AI-powered content review system that helps analyze and validate document content against supporting materials using advanced language models.

## Project Structure

```
ai-content-review/
├── frontend-ai-content-review/    # React TypeScript frontend
├── backend-ai-content-review/     # FastAPI Python backend
└── README.md
```

## Features

- **Document Review Interface**: Interactive document reader with text selection and highlighting capabilities
- **AI-Powered Analysis**: Grounding analysis using Google Gemini AI to validate content against supporting documents
- **Highlight Management**: Support for multiple highlight types (justify, approve, flag, comment)
- **Real-time Feedback**: Instant visual feedback with loading states and progress indicators
- **Database Storage**: SQLite database for persistent highlight storage
- **Cross-Origin Support**: Proper CORS configuration for frontend-backend communication

## Frontend (React + TypeScript)

### Key Components
- **DocumentReader**: Main document viewing and interaction component
- **DocumentBrowser**: File selection and navigation
- **DocumentHighlightedItems**: Sidebar showing all highlights with click-to-scroll functionality
- **GroundingAnalysisModal**: Detailed AI analysis results display
- **LoadingOverlay**: Professional loading states for AI operations

### Technologies
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Modern hooks and state management

## Backend (FastAPI + Python)

### Key Features
- **RESTful API**: Complete CRUD operations for highlights
- **AI Integration**: Google Gemini AI service for content grounding analysis
- **Database Management**: SQLAlchemy with SQLite for data persistence
- **Error Handling**: Comprehensive error handling and validation
- **API Documentation**: Auto-generated OpenAPI/Swagger documentation

### Technologies
- FastAPI for high-performance API
- SQLAlchemy for database ORM
- Google Gemini AI integration
- Pydantic for data validation
- Uvicorn ASGI server

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Google Gemini API key

### Frontend Setup
```bash
cd frontend-ai-content-review
npm install
npm run dev
```

### Backend Setup
```bash
cd backend-ai-content-review
pip install -r requirements.txt
python3 main.py
```

### Environment Configuration
Create a `.env` file in the backend directory with:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

## API Endpoints

- `GET /api/documents` - List available documents
- `POST /api/highlights` - Create new highlights with AI analysis
- `GET /api/highlights/{document_name}` - Get highlights for a document
- `DELETE /api/highlights/clear` - Clear all highlights
- `DELETE /api/highlights/{highlight_id}` - Delete specific highlight

## Development

### Key Features Implemented
- ✅ Interactive document highlighting with multiple action types
- ✅ AI grounding analysis with confidence scoring
- ✅ Real-time highlight management and persistence
- ✅ Click-to-scroll navigation between highlights and document
- ✅ Comprehensive error handling and user feedback
- ✅ Database management with clear operations
- ✅ Professional UI/UX with loading states and animations

### Testing
The system includes comprehensive testing of AI grounding logic, database operations, and user interface interactions.

## Contributing

This project demonstrates advanced full-stack development with AI integration, focusing on user experience, performance, and maintainable code architecture.
