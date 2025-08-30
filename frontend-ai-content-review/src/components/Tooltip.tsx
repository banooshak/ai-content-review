import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  position = 'top',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    setIsVisible(true);
    updatePosition();
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (containerRef.current && tooltipRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let x = 0;
      let y = 0;

      switch (position) {
        case 'top':
          x = containerRect.left + (containerRect.width / 2) - (tooltipRect.width / 2);
          y = containerRect.top - tooltipRect.height - 8;
          break;
        case 'bottom':
          x = containerRect.left + (containerRect.width / 2) - (tooltipRect.width / 2);
          y = containerRect.bottom + 8;
          break;
        case 'left':
          x = containerRect.left - tooltipRect.width - 8;
          y = containerRect.top + (containerRect.height / 2) - (tooltipRect.height / 2);
          break;
        case 'right':
          x = containerRect.right + 8;
          y = containerRect.top + (containerRect.height / 2) - (tooltipRect.height / 2);
          break;
      }

      // Keep tooltip within viewport
      const padding = 8;
      x = Math.max(padding, Math.min(x, window.innerWidth - tooltipRect.width - padding));
      y = Math.max(padding, Math.min(y, window.innerHeight - tooltipRect.height - padding));

      setTooltipPosition({ x, y });
    }
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
      
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }
  }, [isVisible]);

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-[-6px] left-1/2 transform -translate-x-1/2 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-gray-800';
      case 'bottom':
        return 'top-[-6px] left-1/2 transform -translate-x-1/2 border-l-6 border-r-6 border-b-6 border-l-transparent border-r-transparent border-b-gray-800';
      case 'left':
        return 'right-[-6px] top-1/2 transform -translate-y-1/2 border-t-6 border-b-6 border-l-6 border-t-transparent border-b-transparent border-l-gray-800';
      case 'right':
        return 'left-[-6px] top-1/2 transform -translate-y-1/2 border-t-6 border-b-6 border-r-6 border-t-transparent border-b-transparent border-r-gray-800';
      default:
        return '';
    }
  };

  if (!content.trim()) {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }}
        >
          <div className="relative bg-gray-800 text-white text-sm rounded-lg px-3 py-2 shadow-lg border border-gray-700 max-w-xs">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div className="leading-relaxed">
                {content}
              </div>
            </div>
            
            {/* Arrow */}
            <div className={`absolute w-0 h-0 ${getArrowClasses()}`}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
