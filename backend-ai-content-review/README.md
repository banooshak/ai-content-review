# AI Content Review Backend

A FastAPI-based backend service for the AI content review and highlighting system.

## Features

- **Document Management**: API endpoints for retrieving document lists and metadata
- **Text Justification**: AI-powered text analysis and justification using external AI services
- **Highlight Management**: Save and retrieve text highlights and annotations
- **CORS Support**: Configured for frontend integration
- **Health Monitoring**: Health check endpoints for service monitoring

## Setup

### Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

### Installation

1. **Create a virtual environment** (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

### Running the Server

1. **Development mode** (with auto-reload):
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 3000
   ```

2. **Production mode**:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 3000
   ```

3. **Alternative using Python**:
   ```bash
   python main.py
   ```

The API will be available at:
- **API Base URL**: http://localhost:3000
- **Interactive API Documentation**: http://localhost:3000/docs
- **ReDoc Documentation**: http://localhost:3000/redoc

## API Endpoints

### Core Endpoints

- `GET /` - Root endpoint with service information
- `GET /health` - Health check endpoint

### Document Management

- `GET /api/documents` - Get list of available documents with metadata

### Text Analysis

- `POST /api/justify` - Justify selected text using AI analysis
  ```json
  {
    "selectedText": "text to justify",
    "documentContent": "full document content",
    "documentName": "document.md"
  }
  ```

### Highlight Management

- `POST /api/highlights` - Save text highlights and annotations
- `GET /api/highlights/{document_name}` - Get highlights for a specific document

## Project Structure

```
backend-ai-content-review/
├── main.py              # Main FastAPI application
├── requirements.txt     # Python dependencies
├── README.md           # This file
├── .env.example        # Environment variables template
└── app/                # Application modules (future expansion)
    ├── __init__.py
    ├── models/         # Pydantic models
    ├── routers/        # API route handlers
    ├── services/       # Business logic services
    └── utils/          # Utility functions
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True

# AI Service Configuration (when implemented)
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration (when implemented)
DATABASE_URL=sqlite:///./app.db

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Development

### Code Style

This project follows Python best practices:
- **PEP 8** code style
- **Type hints** for better code documentation
- **Pydantic models** for data validation
- **Async/await** for better performance

### Adding New Features

1. **Models**: Add new Pydantic models in `app/models/`
2. **Routes**: Add new API endpoints in `app/routers/`
3. **Services**: Add business logic in `app/services/`
4. **Tests**: Add tests in `tests/` directory

## Integration

### Frontend Integration

The backend is configured to work with the React frontend at:
- Development: `http://localhost:3000` or `http://localhost:5173`
- CORS is pre-configured for these origins

### AI Service Integration

To integrate with AI services (Gemini, OpenAI, etc.):

1. Add API keys to environment variables
2. Install additional dependencies (e.g., `google-generativeai`, `openai`)
3. Implement the AI service calls in the `/api/justify` endpoint

## Deployment

### Docker (Recommended)

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Cloud Platforms

- **Heroku**: Use the included `Procfile`
- **AWS Lambda**: Use `mangum` adapter for serverless deployment
- **Google Cloud Run**: Use the Docker configuration

## License

This project is part of the Socratic AI Content Review system.
