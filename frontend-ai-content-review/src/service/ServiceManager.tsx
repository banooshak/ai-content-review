import type { HighlightedText } from '../types';

interface Document {
  name: string;
  isMainDocument: boolean;
  canHighlight: boolean;
}

interface DocumentsResponse {
  documents: Document[];
}

interface DocumentContentResponse {
  content: string;
}

interface HighlightsResponse {
  highlights: HighlightedText[];
}

interface SaveHighlightsResponse {
  highlights: HighlightedText[];
}

interface SaveHighlightsRequest {
  documentName: string;
  highlights: HighlightedText[];
}

class ServiceManager {
  private baseUrl = 'http://localhost:3000/api';

  // Document related services
  async getDocuments(): Promise<Document[]> {
    try {
      const response = await fetch(`${this.baseUrl}/documents`);
      if (!response.ok) {
        throw new Error('Failed to load documents list');
      }
      
      const data: DocumentsResponse = await response.json();
      return data.documents;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  }

  async getDocumentContent(documentName: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/content/${encodeURIComponent(documentName)}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${documentName}`);
      }
      
      const data: DocumentContentResponse = await response.json();
      return data.content;
    } catch (error) {
      console.error(`Error loading document ${documentName}:`, error);
      throw error;
    }
  }

  // Highlight related services
  async saveHighlights(request: SaveHighlightsRequest): Promise<SaveHighlightsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/highlights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: SaveHighlightsResponse = await response.json();
      return result;
    } catch (error) {
      console.error('Error saving highlights:', error);
      throw error;
    }
  }

  async getHighlights(documentName: string): Promise<HighlightedText[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/highlights/${encodeURIComponent(documentName)}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          // No highlights found for this document, which is fine
          return [];
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: HighlightsResponse = await response.json();
      return result.highlights || [];
    } catch (error) {
      console.error(`Error loading highlights for ${documentName}:`, error);
      return []; // Return empty array on error
    }
  }

  async clearAllHighlights(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/highlights/clear`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error clearing all highlights:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const serviceManager = new ServiceManager();
export default serviceManager;
