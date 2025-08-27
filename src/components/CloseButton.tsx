import React from 'react';

interface CloseButtonProps {
  onClose: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const CloseButton: React.FC<CloseButtonProps> = ({ 
  onClose, 
  className = '', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-10 h-10 text-2xl',
    lg: 'w-12 h-12 text-3xl'
  };

  return (
    <button
      onClick={onClose}
      className={`
        text-white hover:text-gray-200 font-bold 
        bg-black bg-opacity-20 hover:bg-opacity-30 
        rounded-full flex items-center justify-center 
        transition-all duration-200 
        shadow-lg hover:shadow-xl
        ${sizeClasses[size]}
        ${className}
      `}
      aria-label="Fermer"
    >
      ✕
    </button>
  );
};

export default CloseButton;
