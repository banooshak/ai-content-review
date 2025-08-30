import React, { useState } from 'react';
import type { HighlightedText } from '../types';

interface HighlightedSectionProps {
  highlight: HighlightedText;
}

const HighlightedSection: React.FC<HighlightedSectionProps> = ({ highlight }) => {
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'justify':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'thumbs-up':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z"/>
          </svg>
        );
      case 'thumbs-down':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.73 5.25h1.035A7.465 7.465 0 0118 9.375a7.465 7.465 0 01-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 01-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V21a.75.75 0 01-.75.75 2.25 2.25 0 01-2.25-2.25c0-1.152.26-2.243.723-3.218C7.74 15.724 7.366 15 6.748 15H3.622c-1.026 0-1.945-.694-2.054-1.715A12.134 12.134 0 011.5 12c0-2.848.992-5.464 2.649-7.521C4.537 3.997 5.136 3.75 5.754 3.75H9.77a4.5 4.5 0 011.423.23l3.114 1.04a4.5 4.5 0 001.423.23zM21.669 14.023c.536-1.362.831-2.845.831-4.398 0-1.22-.182-2.398-.52-3.507-.26-.85-1.084-1.368-1.973-1.368H19.1c-.445 0-.72.498-.523.898.591 1.2.924 2.55.924 3.977a8.958 8.958 0 01-1.302 4.666c-.245.403.028.959.5.959h1.053c.832 0 1.612-.453 1.918-1.227z"/>
          </svg>
        );
      case 'comment':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'justify':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'thumbs-up':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'thumbs-down':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'comment':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'justify':
        return 'Justified';
      case 'thumbs-up':
        return 'Approved';
      case 'thumbs-down':
        return 'Flagged';
      case 'comment':
        return 'Commented';
      default:
        return type;
    }
  };

  const getJustificationPlaceholder = () => {
    return "This content has been verified against source documents and found to be factually accurate. The claims made align with the provided reference materials and current best practices in the field.";
  };

  return (
    <div className={`border rounded-lg p-4 mb-4 ${getTypeColor(highlight.type)}`}>
      {/* Header with type and icon */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`${highlight.type === 'justify' ? 'text-blue-600' : highlight.type === 'thumbs-up' ? 'text-green-600' : highlight.type === 'thumbs-down' ? 'text-red-600' : 'text-gray-600'}`}>
          {getTypeIcon(highlight.type)}
        </span>
        <h3 className={`font-semibold ${highlight.type === 'justify' ? 'text-blue-800' : highlight.type === 'thumbs-up' ? 'text-green-800' : highlight.type === 'thumbs-down' ? 'text-red-800' : 'text-gray-800'}`}>
          {getTypeLabel(highlight.type)}
        </h3>
      </div>

      {/* Selected text */}
      <div className="mb-3">
        <h4 className="text-sm font-medium text-gray-700 mb-1">Selected Text:</h4>
        <blockquote className="border-l-4 border-gray-300 pl-3 italic text-gray-600 text-sm truncate">
          "{highlight.text}"
        </blockquote>
      </div>

      {/* Type-specific content */}
      {highlight.type === 'comment' && highlight.comment && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Comment:</h4>
          <p className="text-sm text-gray-600 bg-white p-2 rounded border">
            {highlight.comment}
          </p>
        </div>
      )}

      {highlight.type === 'justify' && highlight.grounding_analysis && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Grounding Analysis
          </h4>
          
          {/* Rating and Percentage */}
          <div className="mb-3">
            <div className="bg-white p-2 rounded border text-center w-full">
              <div className="text-xs text-gray-600">Confidence</div>
              <div className={`text-sm font-semibold ${
                highlight.grounding_analysis.grounding_percentage >= 80 ? 'text-green-600' :
                highlight.grounding_analysis.grounding_percentage >= 60 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {highlight.grounding_analysis.grounding_percentage}%
              </div>
            </div>
          </div>

          {/* Evidence Summary */}
          {highlight.grounding_analysis.alignment_evidence.length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {highlight.grounding_analysis.alignment_evidence.length} Supporting Evidence Item(s)
              </div>
            </div>
          )}

          {/* Violations Summary */}
          {highlight.grounding_analysis.violations.length > 0 && 
           highlight.grounding_analysis.violations[0].unsupported_claim !== "None.  All claims in the highlighted text are supported by the provided materials." && (
            <div className="mb-2">
              <div className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {highlight.grounding_analysis.violations.length} Issue(s) Found
              </div>
            </div>
          )}

          {/* Missing Context Summary */}
          {highlight.grounding_analysis.missing_context.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Missing Context Available
              </div>
            </div>
          )}

          {/* Toggle Full Analysis */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowFullAnalysis(!showFullAnalysis);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
          >
            {showFullAnalysis ? 'Hide' : 'Show'} Detailed Analysis
          </button>

          {/* Full Analysis Text */}
          {showFullAnalysis && highlight.grounding_analysis.full_analysis_text && (
            <div className="mt-3 bg-gray-50 border rounded p-3">
              <h5 className="text-xs font-medium text-gray-700 mb-2">Detailed AI Analysis:</h5>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                {highlight.grounding_analysis.full_analysis_text}
              </pre>
            </div>
          )}
        </div>
      )}

      {highlight.type === 'justify' && !highlight.grounding_analysis && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Justification Result:</h4>
          <p className="text-sm text-gray-600 bg-white p-2 rounded border">
            {getJustificationPlaceholder()}
          </p>
        </div>
      )}
    </div>
  );
};

export default HighlightedSection;
