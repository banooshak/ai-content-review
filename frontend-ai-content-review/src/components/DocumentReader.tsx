import React, { useState, useRef, useEffect } from 'react';
import TextSelectionMenu from './TextSelectionMenu';
import Tooltip from './Tooltip';
import LoadingOverlay from './LoadingOverlay';
import GroundingAnalysisModal from './GroundingAnalysisModal';
import ErrorPopup from './ErrorPopup';
import SuccessPopup from './SuccessPopup';
import serviceManager from '../service/ServiceManager';
import type { HighlightedText, GroundingAnalysis } from '../types';

interface DocumentReaderProps {
  content: string;
  fileName: string;
  isLoading?: boolean;
  highlightedTexts: HighlightedText[];
  onHighlightedTextsChange: (highlights: HighlightedText[]) => void;
  scrollToHighlight?: HighlightedText | null;
  onScrollComplete?: () => void;
  canHighlight?: boolean;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  selectedText: string;
}

interface CommentModalState {
  visible: boolean;
  selectedText: string;
}

interface GroundingModalState {
  visible: boolean;
  analysis: GroundingAnalysis | null;
  selectedText: string;
}

interface PopupState {
  visible: boolean;
  message: string;
  title?: string;
}

const DocumentReader: React.FC<DocumentReaderProps> = ({
  content,
  fileName,
  isLoading = false,
  highlightedTexts,
  onHighlightedTextsChange,
  scrollToHighlight = null,
  onScrollComplete,
  canHighlight = true,
}) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    selectedText: '',
  });
  const [commentModal, setCommentModal] = useState<CommentModalState>({
    visible: false,
    selectedText: '',
  });
  const [groundingModal, setGroundingModal] = useState<GroundingModalState>({
    visible: false,
    analysis: null,
    selectedText: '',
  });
  const [errorPopup, setErrorPopup] = useState<PopupState>({
    visible: false,
    message: '',
    title: 'Error',
  });
  const [successPopup, setSuccessPopup] = useState<PopupState>({
    visible: false,
    message: '',
    title: 'Success',
  });
  const [comment, setComment] = useState('');
  const [pulsatingHighlightId, setPulsatingHighlightId] = useState<
    string | null
  >(null);
  const [isJustifyLoading, setIsJustifyLoading] = useState(false);
  const contentRef = useRef<HTMLPreElement>(null);

  // Handle text selection
  const handleTextSelection = (event: React.MouseEvent) => {
    // Don't show text selection menu if highlighting is disabled
    if (!canHighlight) {
      return;
    }

    // Check if the click happened on the context menu - if so, ignore it
    const target = event.target as HTMLElement;
    if (target.closest('.context-menu')) {
      return;
    }

    // Small delay to ensure selection is complete
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        const selectedText = selection.toString().trim();

        setContextMenu({
          visible: true,
          x: event.clientX,
          y: event.clientY,
          selectedText,
        });
      } else {
        setContextMenu({ visible: false, x: 0, y: 0, selectedText: '' });
      }
    }, 10);
  };

  // Hide context menu when clicking elsewhere
  const handleClickOutside = (event: Event) => {
    const target = event.target as HTMLElement;
    // Don't close if clicking on the context menu itself
    if (target.closest('.context-menu')) {
      return;
    }
    setContextMenu({ visible: false, x: 0, y: 0, selectedText: '' });
  };

  // Helper function to find text position in content
  const findTextPosition = (selectedText: string) => {
    const startIndex = content.indexOf(selectedText);
    if (startIndex !== -1) {
      return {
        startIndex,
        endIndex: startIndex + selectedText.length,
      };
    }
    return null;
  };

  // Function to save highlight to backend
  const saveHighlightToBackend = async (highlight: HighlightedText) => {
    try {
      const result = await serviceManager.saveHighlights({
        documentName: fileName,
        highlights: [highlight],
      });
      return result;
    } catch (error) {
      // Don't show error to user for now, just log it
      console.error('Failed to save highlight to backend:', error);
      throw error;
    }
  };

  // Function to load highlights from backend
  const loadHighlightsFromBackend = async (documentName: string) => {
    try {
      return await serviceManager.getHighlights(documentName);
    } catch (error) {
      return []; // Return empty array on error
    }
  };

  // Context menu actions
  const handleJustify = async () => {
    // Show loading overlay
    setIsJustifyLoading(true);

    // Close context menu
    setContextMenu({ visible: false, x: 0, y: 0, selectedText: '' });

    try {
      // Add highlight for justified text
      const position = findTextPosition(contextMenu.selectedText);
      if (position) {
        const newHighlight: HighlightedText = {
          text: contextMenu.selectedText,
          startIndex: position.startIndex,
          endIndex: position.endIndex,
          type: 'justify',
          id: Date.now().toString(),
        };

        // Update local state immediately to show the highlight
        onHighlightedTextsChange([...highlightedTexts, newHighlight]);

        // Save to backend with AI analysis
        const result = await serviceManager.saveHighlights({
          documentName: fileName,
          highlights: [newHighlight],
        });

        // Extract the highlight with grounding analysis from response
        const savedHighlight = result.highlights[0];
        if (savedHighlight && savedHighlight.grounding_analysis) {
          // Update the local highlight with the grounding analysis
          const updatedHighlight: HighlightedText = {
            ...newHighlight,
            grounding_analysis: savedHighlight.grounding_analysis,
            comment: savedHighlight.comment,
          };

          // Update local state with grounding analysis
          const updatedHighlights = highlightedTexts.map((h) =>
            h.id === newHighlight.id ? updatedHighlight : h
          );
          updatedHighlights.push(updatedHighlight);
          onHighlightedTextsChange(
            updatedHighlights.filter(
              (h, index, arr) =>
                arr.findIndex((item) => item.id === h.id) === index
            )
          );

          // Show grounding analysis modal
          setGroundingModal({
            visible: true,
            analysis: savedHighlight.grounding_analysis,
            selectedText: contextMenu.selectedText,
          });
        } else {
          // If no grounding analysis, show an error popup
          setErrorPopup({
            visible: true,
            title: 'Analysis Unavailable',
            message:
              'Text justified but AI analysis is not available. The highlight has been saved.',
          });
        }
      }
    } catch (error) {
      setErrorPopup({
        visible: true,
        title: 'Justification Failed',
        message: `Failed to justify text: ${
          error instanceof Error ? error.message : 'Unknown error occurred'
        }`,
      });
    } finally {
      setIsJustifyLoading(false);
    }
  };

  const handleThumbsUp = async () => {
    // Add highlight for thumbs up text
    const position = findTextPosition(contextMenu.selectedText);
    if (position) {
      const newHighlight: HighlightedText = {
        text: contextMenu.selectedText,
        startIndex: position.startIndex,
        endIndex: position.endIndex,
        type: 'thumbs-up',
        id: Date.now().toString(),
      };

      // Update local state
      onHighlightedTextsChange([...highlightedTexts, newHighlight]);

      // Save to backend
      await saveHighlightToBackend(newHighlight);

      // Show success popup
      setSuccessPopup({
        visible: true,
        title: 'Text Approved',
        message: `Successfully marked as factually correct: "${contextMenu.selectedText.substring(
          0,
          50
        )}${contextMenu.selectedText.length > 50 ? '...' : ''}"`,
      });
    }
  };

  const handleThumbsDown = async () => {
    // Add highlight for thumbs down text
    const position = findTextPosition(contextMenu.selectedText);
    if (position) {
      const newHighlight: HighlightedText = {
        text: contextMenu.selectedText,
        startIndex: position.startIndex,
        endIndex: position.endIndex,
        type: 'thumbs-down',
        id: Date.now().toString(),
      };

      // Update local state
      onHighlightedTextsChange([...highlightedTexts, newHighlight]);

      // Save to backend
      await saveHighlightToBackend(newHighlight);

      // Show success popup
      setSuccessPopup({
        visible: true,
        title: 'Text Flagged',
        message: `Successfully flagged as problematic: "${contextMenu.selectedText.substring(
          0,
          50
        )}${contextMenu.selectedText.length > 50 ? '...' : ''}"`,
      });
    }
  };

  const handleComment = () => {
    setCommentModal({
      visible: true,
      selectedText: contextMenu.selectedText,
    });
  };

  const submitComment = async () => {
    // Add highlight for commented text
    const position = findTextPosition(commentModal.selectedText);
    if (position) {
      const newHighlight: HighlightedText = {
        text: commentModal.selectedText,
        startIndex: position.startIndex,
        endIndex: position.endIndex,
        type: 'comment',
        id: Date.now().toString(),
        comment: comment, // Store the comment text
      };

      // Update local state
      onHighlightedTextsChange([...highlightedTexts, newHighlight]);

      // Save to backend
      await saveHighlightToBackend(newHighlight);

      // Show success popup
      setSuccessPopup({
        visible: true,
        title: 'Comment Added',
        message: `Comment successfully submitted for: "${commentModal.selectedText.substring(
          0,
          50
        )}${commentModal.selectedText.length > 50 ? '...' : ''}"`,
      });
    }

    setCommentModal({ visible: false, selectedText: '' });
    setComment('');
  };

  // Function to render content with highlights
  const renderHighlightedContent = () => {
    if (!content || highlightedTexts.length === 0) {
      return content;
    }

    // Sort highlights by start index to process them in order
    const sortedHighlights = [...highlightedTexts].sort(
      (a, b) => a.startIndex - b.startIndex
    );

    const parts = [];
    let currentIndex = 0;

    for (const highlight of sortedHighlights) {
      // Add text before the highlight
      if (currentIndex < highlight.startIndex) {
        parts.push(content.slice(currentIndex, highlight.startIndex));
      }

      // Add the highlighted text with appropriate styling
      const highlightClass = getHighlightClass(highlight.type, highlight.id);

      const highlightElement = (
        <span className={highlightClass} data-highlight-id={highlight.id}>
          {highlight.text}
        </span>
      );

      if (highlight.type === 'comment' && highlight.comment) {
        parts.push(
          <Tooltip
            key={highlight.id}
            content={highlight.comment}
            position="top"
          >
            {highlightElement}
          </Tooltip>
        );
      } else if (highlight.type === 'justify' && highlight.grounding_analysis) {
        // Create tooltip content for justify highlights
        const analysis = highlight.grounding_analysis;
        const evidenceCount = analysis.alignment_evidence.length;
        const issueCount =
          analysis.violations.length > 0 &&
          analysis.violations[0].unsupported_claim !==
            'None.  All claims in the highlighted text are supported by the provided materials.'
            ? analysis.violations.length
            : 0;

        const tooltipContent = `AI Analysis: ${analysis.reliability_rating} (${analysis.grounding_percentage}%) • Evidence: ${evidenceCount} • Issues: ${issueCount} • Click for details`;

        parts.push(
          <Tooltip key={highlight.id} content={tooltipContent} position="top">
            <span
              className={`${highlightClass} cursor-pointer hover:opacity-80`}
              data-highlight-id={highlight.id}
              onClick={() =>
                setGroundingModal({
                  visible: true,
                  analysis: analysis,
                  selectedText: highlight.text,
                })
              }
            >
              {highlight.text}
            </span>
          </Tooltip>
        );
      } else {
        parts.push(<span key={highlight.id}>{highlightElement}</span>);
      }

      currentIndex = highlight.endIndex;
    }

    // Add remaining text after the last highlight
    if (currentIndex < content.length) {
      parts.push(content.slice(currentIndex));
    }

    return parts;
  };

  // Function to get CSS class for highlight type
  const getHighlightClass = (type: string, id: string) => {
    const baseClasses = 'border-2 border-dashed';
    const pulsateClass = pulsatingHighlightId === id ? 'animate-pulse' : '';

    switch (type) {
      case 'justify':
        return `${baseClasses} bg-blue-200 text-blue-900 border-blue-700 ${pulsateClass}`.trim();
      case 'thumbs-up':
        return `${baseClasses} bg-green-200 text-green-900 border-green-700 ${pulsateClass}`.trim();
      case 'thumbs-down':
        return `${baseClasses} bg-red-200 text-red-900 border-red-700 ${pulsateClass}`.trim();
      case 'comment':
        return `${baseClasses} bg-gray-200 text-gray-900 border-gray-700 ${pulsateClass}`.trim();
      default:
        return '';
    }
  };

  // Close context menu on outside click
  useEffect(() => {
    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.visible]);

  // Also handle selection change events
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim() && contextMenu.visible) {
        // Update selected text if menu is already visible
        setContextMenu((prev) => ({
          ...prev,
          selectedText: selection.toString().trim(),
        }));
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () =>
      document.removeEventListener('selectionchange', handleSelectionChange);
  }, [contextMenu.visible]);

  // Handle scrolling to highlighted text
  useEffect(() => {
    if (scrollToHighlight && contentRef.current) {
      const highlightElement = contentRef.current.querySelector(
        `[data-highlight-id="${scrollToHighlight.id}"]`
      );
      if (highlightElement) {
        highlightElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });

        // Start pulsating effect
        setPulsatingHighlightId(scrollToHighlight.id);

        // Stop pulsating after 2 seconds and notify completion
        setTimeout(() => {
          setPulsatingHighlightId(null);
          onScrollComplete?.();
        }, 2000);
      } else {
        // If element not found, still notify completion
        onScrollComplete?.();
      }
    }
  }, [scrollToHighlight, onScrollComplete]);

  // Load highlights from backend when document changes
  useEffect(() => {
    const loadHighlights = async () => {
      if (fileName && content && !isLoading) {
        const loadedHighlights = await loadHighlightsFromBackend(fileName);
        if (loadedHighlights.length > 0) {
          onHighlightedTextsChange(loadedHighlights);
        } else {
          // Clear highlights if no highlights found for this document
          onHighlightedTextsChange([]);
        }
      }
    };

    loadHighlights();
  }, [fileName, content, isLoading, onHighlightedTextsChange]); // Load when document changes

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Document Reader
          </h1>
          {!canHighlight && (
            <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
              Read-only
            </span>
          )}
        </div>

        {fileName && (
          <p className="text-sm text-gray-600">
            Current file: <span className="font-medium">{fileName}</span>
            {!canHighlight && (
              <span className="text-amber-600 ml-2">(Supporting material)</span>
            )}
          </p>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading document...</span>
          </div>
        )}

        {!isLoading && content ? (
          <div
            className={`bg-gray-50 rounded-lg p-6 min-h-full relative ${
              !canHighlight ? 'opacity-90' : ''
            }`}
            onMouseUp={canHighlight ? handleTextSelection : undefined}
            onMouseDown={
              canHighlight
                ? () =>
                    setContextMenu({
                      visible: false,
                      x: 0,
                      y: 0,
                      selectedText: '',
                    })
                : undefined
            }
          >
            <pre
              ref={contentRef}
              className={`whitespace-pre-wrap text-gray-800 font-mono text-sm leading-relaxed ${
                canHighlight
                  ? 'select-text cursor-text'
                  : 'select-none cursor-default'
              }`}
            >
              {renderHighlightedContent()}
            </pre>

            <TextSelectionMenu
              visible={contextMenu.visible}
              x={contextMenu.x}
              y={contextMenu.y}
              selectedText={contextMenu.selectedText}
              onJustify={handleJustify}
              onThumbsUp={handleThumbsUp}
              onThumbsDown={handleThumbsDown}
              onComment={handleComment}
              onClose={() =>
                setContextMenu({ visible: false, x: 0, y: 0, selectedText: '' })
              }
            />
          </div>
        ) : (
          !isLoading && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">No document selected</p>
              <p className="text-gray-400 text-sm mt-2">
                Choose a document from the browser to view its content
              </p>
            </div>
          )
        )}
      </div>

      {/* Footer */}
      {content && (
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <p className="text-sm text-gray-600">
            Characters: {content.length} | Words:{' '}
            {content.split(/\s+/).filter((word) => word.length > 0).length}
          </p>
        </div>
      )}

      {/* Comment Modal */}
      {commentModal.visible && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4 border-2 border-gray-300 shadow-2xl">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">
              Add Comment
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Selected Text:
              </label>
              <div className="bg-gray-50 p-3 rounded-lg border-2 border-gray-300 text-sm text-gray-900">
                "{commentModal.selectedText}"
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Your Comment:
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-3 focus:ring-blue-300 focus:border-blue-600 text-gray-900 bg-white"
                rows={4}
                placeholder="Enter your feedback here..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setCommentModal({ visible: false, selectedText: '' });
                  setComment('');
                }}
                className="px-5 py-3 text-gray-800 bg-gray-100 border-2 border-gray-400 rounded-lg hover:bg-gray-200 hover:border-gray-500 focus:ring-3 focus:ring-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={submitComment}
                disabled={!comment.trim()}
                className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:text-gray-700 focus:ring-3 focus:ring-blue-300 transition-colors font-medium border-2 border-blue-600 hover:border-blue-700 disabled:border-gray-400"
              >
                Submit Comment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay for AI Analysis */}
      <LoadingOverlay
        visible={isJustifyLoading}
        message="Analyzing text against supporting documents using AI..."
      />

      {/* Grounding Analysis Modal */}
      <GroundingAnalysisModal
        visible={groundingModal.visible}
        analysis={groundingModal.analysis}
        selectedText={groundingModal.selectedText}
        onClose={() =>
          setGroundingModal({
            visible: false,
            analysis: null,
            selectedText: '',
          })
        }
      />

      {/* Error Popup */}
      <ErrorPopup
        visible={errorPopup.visible}
        title={errorPopup.title}
        message={errorPopup.message}
        onClose={() =>
          setErrorPopup({ visible: false, message: '', title: 'Error' })
        }
      />

      {/* Success Popup */}
      <SuccessPopup
        visible={successPopup.visible}
        title={successPopup.title}
        message={successPopup.message}
        onClose={() =>
          setSuccessPopup({ visible: false, message: '', title: 'Success' })
        }
      />
    </div>
  );
};

export default DocumentReader;
