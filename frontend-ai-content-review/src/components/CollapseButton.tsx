import React from 'react';

interface CollapseButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
  direction?: 'left' | 'right';
  variant?: 'default' | 'floating';
  className?: string;
  title?: string;
}

const CollapseButton: React.FC<CollapseButtonProps> = ({
  isCollapsed,
  onToggle,
  direction = 'right',
  variant = 'default',
  className = '',
  title
}) => {
  // Determine arrow direction based on collapse state and direction
  const getArrowPath = () => {
    // For right-side panels (like DocumentBrowser):
    // - When open: arrow points right (►) to indicate "collapse to the right"
    // - When collapsed: arrow points left (◄) to indicate "expand from the right"
    
    // For left-side panels:
    // - When open: arrow points left (◄) to indicate "collapse to the left"
    // - When collapsed: arrow points right (►) to indicate "expand from the left"
    
    if (direction === 'right') {
      return isCollapsed ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"; // Collapsed: left arrow, Open: right arrow
    } else {
      return isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"; // Collapsed: right arrow, Open: left arrow
    }
  };

  const getTitle = () => {
    if (title) return title;
    
    if (direction === 'right') {
      return isCollapsed ? 'Show panel' : 'Hide panel';
    } else {
      return isCollapsed ? 'Show panel' : 'Hide panel';
    }
  };

  const baseClasses = "p-2 rounded-full transition-colors";
  
  const variantClasses = {
    default: "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
    floating: "bg-blue-500 text-white hover:bg-blue-600 shadow-lg"
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <button
      onClick={onToggle}
      className={combinedClasses}
      title={getTitle()}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getArrowPath()} />
      </svg>
    </button>
  );
};

export default CollapseButton;
