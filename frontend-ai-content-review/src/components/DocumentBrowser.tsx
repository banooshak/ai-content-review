import React, { useState, useEffect } from 'react';
import CollapseButton from './CollapseButton';
import serviceManager from '../service/ServiceManager';

interface Document {
  name: string;
  isMainDocument: boolean;
  canHighlight: boolean;
}

interface DocumentBrowserProps {
  onDocumentSelect: (content: string, fileName: string, canHighlight?: boolean) => void;
  selectedDocument?: string;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

const DocumentBrowser: React.FC<DocumentBrowserProps> = ({ 
  onDocumentSelect, 
  selectedDocument,
  onToggleCollapse,
  isCollapsed = false
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Fetch documents list from backend API
      const documents = await serviceManager.getDocuments();
      setDocuments(documents);
      
      // Auto-load 0_Summary.md if no document is currently selected
      if (!selectedDocument) {
        const summaryDoc = documents.find((doc: Document) => doc.name === '0_Summary.md');
        if (summaryDoc) {
          await loadAndSelectDocument(summaryDoc);
        }
      }
    } catch (err) {
      setError('Failed to load documents');
      console.error('Error loading documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAndSelectDocument = async (document: Document) => {
    try {
      // Use the backend API to get document content
      const content = await serviceManager.getDocumentContent(document.name);
      onDocumentSelect(content, document.name, document.canHighlight);
    } catch (err) {
      setError(`Failed to load ${document.name}`);
      console.error('Error loading document:', err);
    }
  };

  const handleDocumentClick = async (document: Document) => {
    await loadAndSelectDocument(document);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'txt':
        return '📄';
      case 'md':
        return '📝';
      case 'json':
        return '📋';
      case 'csv':
        return '📊';
      default:
        return '📄';
    }
  };

  const formatFileName = (fileName: string) => {
    return fileName
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
      .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
  };

  return (
    <div className="h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Documents</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={loadDocuments}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              title="Refresh documents"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            {onToggleCollapse && (
              <CollapseButton
                isCollapsed={isCollapsed}
                onToggle={onToggleCollapse}
                direction="right"
                variant="default"
                title="Collapse browser"
              />
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {documents.length} document{documents.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-sm text-gray-600">Loading documents...</span>
          </div>
        )}

        {error && (
          <div className="p-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && documents.length === 0 && (
          <div className="text-center py-8 px-4">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No documents found</p>
          </div>
        )}

        {!isLoading && !error && documents.length > 0 && (
          <div className="p-2">
            {/* Main Documents Section */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 px-2 py-1 mb-2 bg-gray-50 rounded">
                📝 Main Documents ({documents.filter(doc => doc.isMainDocument).length})
              </h3>
              {documents
                .filter(doc => doc.isMainDocument)
                .map((document, index) => (
                  <div
                    key={`main-${index}`}
                    onClick={() => handleDocumentClick(document)}
                    className={`
                      flex items-center p-3 rounded-lg cursor-pointer transition-colors mb-1
                      ${selectedDocument === document.name 
                        ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                        : 'hover:bg-gray-50 text-gray-700'
                      }
                    `}
                  >
                    <span className="text-lg mr-3">{getFileIcon(document.name)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {formatFileName(document.name)}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {document.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Can highlight
                      </span>
                      {selectedDocument === document.name && (
                        <div className="text-blue-500">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {/* Supporting Documents Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 px-2 py-1 mb-2 bg-gray-50 rounded">
                📚 Supporting Materials ({documents.filter(doc => !doc.isMainDocument).length})
              </h3>
              {documents
                .filter(doc => !doc.isMainDocument)
                .map((document, index) => (
                  <div
                    key={`support-${index}`}
                    onClick={() => handleDocumentClick(document)}
                    className={`
                      flex items-center p-3 rounded-lg cursor-pointer transition-colors mb-1
                      ${selectedDocument === document.name 
                        ? 'bg-amber-50 border border-amber-200 text-amber-700' 
                        : 'hover:bg-gray-50 text-gray-700'
                      }
                    `}
                  >
                    <span className="text-lg mr-3">{getFileIcon(document.name)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {formatFileName(document.name)}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {document.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        Read-only
                      </span>
                      {selectedDocument === document.name && (
                        <div className="text-amber-500">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <div className="text-xs text-gray-500 text-center">
          Click on any document to view its content
        </div>
      </div>
    </div>
  );
};

export default DocumentBrowser;
