import { useState } from 'react'
import DocumentReader from './components/DocumentReader'
import DocumentBrowser from './components/DocumentBrowser'
import DocumentHighlightedItems from './components/DocumentHighlightedItems'
import CollapseButton from './components/CollapseButton'
import serviceManager from './service/ServiceManager'
import type { HighlightedText } from './types'
import './App.css'

function App() {
  const [selectedContent, setSelectedContent] = useState<string>('')
  const [selectedFileName, setSelectedFileName] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isBrowserCollapsed, setIsBrowserCollapsed] = useState<boolean>(false)
  const [highlightedTexts, setHighlightedTexts] = useState<HighlightedText[]>([])
  const [scrollToHighlight, setScrollToHighlight] = useState<HighlightedText | null>(null)
  const [canHighlight, setCanHighlight] = useState<boolean>(true)

  const handleDocumentSelect = (content: string, fileName: string, canHighlight: boolean = true) => {
    setIsLoading(true)
    // Only clear highlights if we're switching to a different document
    if (selectedFileName !== fileName) {
      setHighlightedTexts([])
      setScrollToHighlight(null)
    }
    // Set highlight capability
    setCanHighlight(canHighlight)
    // Simulate loading delay for better UX
    setTimeout(() => {
      setSelectedContent(content)
      setSelectedFileName(fileName)
      setIsLoading(false)
    }, 300)
  }

  const handleHighlightClick = (highlight: HighlightedText) => {
    setScrollToHighlight(highlight);
  }

  const handleScrollComplete = () => {
    setScrollToHighlight(null);
  }

  const handleClearAllHighlights = async () => {
    try {
      // Call backend to clear all highlights
      await serviceManager.clearAllHighlights();

      // Clear local state
      setHighlightedTexts([]);
      setScrollToHighlight(null);
    } catch (error) {
      console.error('Failed to clear highlights:', error);
      // Still clear local state even if backend call fails
      setHighlightedTexts([]);
      setScrollToHighlight(null);
    }
  }

  const toggleBrowser = () => {
    setIsBrowserCollapsed(!isBrowserCollapsed)
  }

  return (
    <div className="h-screen bg-gray-50 p-4">
      {/* Mobile/Small Screen Layout */}
      <div className="sm:hidden flex flex-col gap-4 h-full">
        {/* Toggle Button for Mobile */}
        <button
          onClick={toggleBrowser}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          {isBrowserCollapsed ? 'Show Documents' : 'Hide Documents'}
        </button>
        
        {/* Mobile Content */}
        {isBrowserCollapsed ? (
          <div className="flex-1 bg-white rounded-lg shadow-lg border border-gray-200">
            <DocumentReader 
              content={selectedContent}
              fileName={selectedFileName}
              isLoading={isLoading}
              highlightedTexts={highlightedTexts}
              onHighlightedTextsChange={setHighlightedTexts}
              scrollToHighlight={scrollToHighlight}
              onScrollComplete={handleScrollComplete}
              canHighlight={canHighlight}
            />
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-lg shadow-lg border border-gray-200">
            <DocumentBrowser 
              onDocumentSelect={handleDocumentSelect}
              selectedDocument={selectedFileName}
            />
          </div>
        )}
      </div>

      {/* Desktop Layout (600px and above) */}
      <div className="hidden sm:flex flex-row gap-4 h-full">
        {/* Document Reader - Takes remaining space */}
        <div className={`${isBrowserCollapsed ? 'w-full' : 'w-4/5'} h-full bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-300`}>
          <div className="relative h-full">
            {/* Show Browser Button when collapsed */}
            {isBrowserCollapsed && (
              <CollapseButton
                isCollapsed={isBrowserCollapsed}
                onToggle={toggleBrowser}
                direction="right"
                variant="floating"
                className="absolute top-4 right-4 z-10"
                title="Show Document Browser"
              />
            )}
            
            <DocumentReader 
              content={selectedContent}
              fileName={selectedFileName}
              isLoading={isLoading}
              highlightedTexts={highlightedTexts}
              onHighlightedTextsChange={setHighlightedTexts}
              scrollToHighlight={scrollToHighlight}
              canHighlight={canHighlight}
            />
          </div>
        </div>
        
        {/* Document Browser and Highlighted Items - 20% width when open, hidden when collapsed */}
        {!isBrowserCollapsed && (
          <div className="w-1/5 flex-shrink-0 h-full flex flex-col gap-4">
            {/* Document Browser - Top half (50%) */}
            <div className="h-1/2 bg-white rounded-lg shadow-lg border border-gray-200">
              <DocumentBrowser 
                onDocumentSelect={handleDocumentSelect}
                selectedDocument={selectedFileName}
                onToggleCollapse={toggleBrowser}
                isCollapsed={isBrowserCollapsed}
              />
            </div>
            
            {/* Document Highlighted Items - Bottom half (50%) */}
            <div className="h-1/2 bg-white rounded-lg shadow-lg border border-gray-200">
              <DocumentHighlightedItems 
                highlightedTexts={highlightedTexts} 
                onHighlightClick={handleHighlightClick}
                onClearAllHighlights={handleClearAllHighlights}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
