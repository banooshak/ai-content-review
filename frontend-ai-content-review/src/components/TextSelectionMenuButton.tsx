import React from 'react';

interface TextSelectionMenuButtonProps {
  onClick: () => void;
  onClose: () => void;
  icon: React.ReactNode;
  label: string;
  colorClass?: string;
}

const TextSelectionMenuButton: React.FC<TextSelectionMenuButtonProps> = ({
  onClick,
  onClose,
  icon,
  label,
  colorClass = ''
}) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick();
        onClose();
      }}
      className={`w-full px-4 py-2 text-left hover:bg-white focus:bg-white focus:outline-none flex items-center gap-2 text-sm text-gray-800 transition-colors ${colorClass}`}
    >
      {icon}
      {label}
    </button>
  );
};

export default TextSelectionMenuButton;
