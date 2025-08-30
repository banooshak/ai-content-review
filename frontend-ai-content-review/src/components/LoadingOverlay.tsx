import React from 'react';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  visible, 
  message = "Processing..." 
}) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 flex flex-col items-center shadow-2xl border-2 border-gray-300">
        {/* Spinning loader */}
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mb-4"></div>
        
        {/* Loading message */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            AI Analysis in Progress
          </h3>
          <p className="text-sm text-gray-600 max-w-xs">
            {message}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            This may take a few moments...
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
