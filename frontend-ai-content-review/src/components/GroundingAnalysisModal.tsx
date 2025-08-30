import React from 'react';
import type { GroundingAnalysis } from '../types';

interface GroundingAnalysisModalProps {
  visible: boolean;
  analysis: GroundingAnalysis | null;
  selectedText: string;
  onClose: () => void;
}

const GroundingAnalysisModal: React.FC<GroundingAnalysisModalProps> = ({
  visible,
  analysis,
  selectedText,
  onClose
}) => {
  if (!visible || !analysis) return null;

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'FULLY GROUNDED':
        return 'text-green-700 bg-green-100 border-green-300';
      case 'PARTIALLY GROUNDED':
        return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'NOT GROUNDED':
        return 'text-red-700 bg-red-100 border-red-300';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-gray-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">AI Grounding Analysis</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Selected Text */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Analyzed Text</h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 italic">"{selectedText}"</p>
            </div>
          </div>

          {/* Rating Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Reliability Rating</h4>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getRatingColor(analysis.reliability_rating)}`}>
                {analysis.reliability_rating}
              </span>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Grounding Percentage</h4>
              <span className={`text-2xl font-bold ${getPercentageColor(analysis.grounding_percentage)}`}>
                {analysis.grounding_percentage}%
              </span>
            </div>
          </div>

          {/* Alignment Evidence */}
          {analysis.alignment_evidence.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Supporting Evidence ({analysis.alignment_evidence.length})
              </h3>
              <div className="space-y-4">
                {analysis.alignment_evidence.map((evidence, index) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="mb-2">
                      <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                        {evidence.source_file} - {evidence.source_section}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Claim:</strong> {evidence.claim}
                    </p>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Supporting Quote:</strong> "{evidence.supporting_quote}"
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Explanation:</strong> {evidence.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Violations */}
          {analysis.violations.length > 0 && analysis.violations[0].unsupported_claim !== "None.  All claims in the highlighted text are supported by the provided materials." && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Unsupported Claims ({analysis.violations.length})
              </h3>
              <div className="space-y-4">
                {analysis.violations.map((violation, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="mb-2">
                      <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded">
                        {violation.source_file} - {violation.source_section}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Unsupported Claim:</strong> {violation.unsupported_claim}
                    </p>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Actual Evidence:</strong> {violation.actual_evidence}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Explanation:</strong> {violation.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Context */}
          {analysis.missing_context.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Missing Context
              </h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <ul className="list-disc list-inside space-y-2">
                  {analysis.missing_context.map((context, index) => (
                    <li key={index} className="text-sm text-gray-700">{context}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Recommendations
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <ul className="list-disc list-inside space-y-2">
                  {analysis.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-gray-700">{recommendation}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Full Analysis Text */}
          {analysis.full_analysis_text && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Detailed Analysis</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {analysis.full_analysis_text}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroundingAnalysisModal;
