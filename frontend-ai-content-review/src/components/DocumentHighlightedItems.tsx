import React, { useState, useEffect } from 'react';
import HighlightedSection from './HighlightedSection';
import type { HighlightedText } from '../types';

interface DocumentHighlightedItemsProps {
  highlightedTexts: HighlightedText[];
  onHighlightClick: (highlight: HighlightedText) => void;
  onClearAllHighlights?: () => void;
}

const DocumentHighlightedItems: React.FC<DocumentHighlightedItemsProps> = ({ 
  highlightedTexts,
  onHighlightClick,
  onClearAllHighlights
}) => {
  const [pulsatingItemId, setPulsatingItemId] = useState<string | null>(null);

  // Sort highlights by most recent first
  const sortedHighlights = [...highlightedTexts].sort((a, b) => {
    return parseInt(b.id) - parseInt(a.id);
  });

  // Effect to handle pulsating animation for new items
  useEffect(() => {
    if (highlightedTexts.length > 0) {
      const mostRecentId = sortedHighlights[0]?.id;
      
      if (mostRecentId && mostRecentId !== pulsatingItemId) {
        setPulsatingItemId(mostRecentId);
      }

      // Clear pulsating effect after 2 seconds
      const timer = setTimeout(() => {
        setPulsatingItemId(null);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [highlightedTexts.length]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Highlighted Items</h2>
            <p className="text-sm text-gray-600 mt-1">
              {highlightedTexts.length} item{highlightedTexts.length !== 1 ? 's' : ''} highlighted
            </p>
          </div>
          {highlightedTexts.length > 0 && onClearAllHighlights && (
            <button
              onClick={onClearAllHighlights}
              className="flex items-center gap-1 px-3 py-2 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg border border-red-200 hover:border-red-300 transition-colors"
              title="Delete all highlights"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {highlightedTexts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 017 13V7a4 4 0 014-4z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No highlights yet</p>
            <p className="text-gray-400 text-xs mt-1">Select text and choose an action to add highlights</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedHighlights.map((highlight) => {
              const isPulsating = pulsatingItemId === highlight.id;
              const pulsateClasses = isPulsating ? 'animate-pulse ring-2 ring-blue-400 ring-opacity-75' : '';
              
              return (
                <div
                  key={highlight.id}
                  className={`cursor-pointer transition-colors ${pulsateClasses}`}
                  onClick={() => {
                    onHighlightClick(highlight);
                  }}
                >
                  <HighlightedSection highlight={highlight} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentHighlightedItems;
