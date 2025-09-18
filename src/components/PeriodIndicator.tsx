import React from 'react';

interface PeriodIndicatorProps {
  variant?: 'inline' | 'badge' | 'tooltip';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const PeriodIndicator: React.FC<PeriodIndicatorProps> = ({ 
  variant = 'inline', 
  size = 'md',
  showIcon = true 
}) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 0-11 -> 1-12
  
  // Période fixe : Janvier à Août pour chaque année
  const getPeriodText = () => {
    return `Janvier - Août`;
  };

  const baseClasses = {
    sm: 'text-xs',
    md: 'text-sm', 
    lg: 'text-base'
  };

  const variantClasses = {
    inline: 'text-gray-500',
    badge: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800',
    tooltip: 'text-gray-400 hover:text-gray-600 cursor-help'
  };

  const content = (
    <span className={`${baseClasses[size]} ${variantClasses[variant]}`}>
      {showIcon && variant !== 'badge' && <span className="mr-1">📅</span>}
      {variant === 'badge' ? getPeriodText() : `(${getPeriodText()})`}
    </span>
  );

  if (variant === 'tooltip') {
    return (
      <span title={`Données basées sur la période : ${getPeriodText()}`}>
        {content}
      </span>
    );
  }

  return content;
};

export default PeriodIndicator;
