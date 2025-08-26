import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  trend?: 'up' | 'down' | 'stable';
  format?: 'currency' | 'number' | 'percentage';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  color = 'primary',
  trend,
  format = 'number',
  size = 'md',
  className = ''
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600'
        };
      case 'danger':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600'
        };
      default:
        return {
          bg: 'bg-indigo-50',
          border: 'border-indigo-200',
          text: 'text-indigo-700',
          iconBg: 'bg-indigo-100',
          iconColor: 'text-indigo-600'
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          padding: 'p-4',
          iconSize: 'w-8 h-8',
          titleSize: 'text-sm',
          valueSize: 'text-xl',
          changeSize: 'text-xs'
        };
      case 'lg':
        return {
          padding: 'p-8',
          iconSize: 'w-16 h-16',
          titleSize: 'text-lg',
          valueSize: 'text-4xl',
          changeSize: 'text-sm'
        };
      default:
        return {
          padding: 'p-6',
          iconSize: 'w-12 h-12',
          titleSize: 'text-base',
          valueSize: 'text-3xl',
          changeSize: 'text-sm'
        };
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend) {
      case 'up':
        return (
          <div className="flex items-center text-green-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-xs font-medium">+{change}%</span>
          </div>
        );
      case 'down':
        return (
          <div className="flex items-center text-red-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
            <span className="text-xs font-medium">{change}%</span>
          </div>
        );
      case 'stable':
        return (
          <div className="flex items-center text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
            <span className="text-xs font-medium">Stable</span>
          </div>
        );
    }
  };

  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val);
      case 'percentage':
        return `${val}%`;
      default:
        return val.toLocaleString('fr-FR');
    }
  };

  const colors = getColorClasses();
  const sizes = getSizeClasses();

  return (
    <div className={`
      stats-card bg-white rounded-xl border-2 shadow-sm
      transition-all duration-300 ease-in-out
      hover:shadow-lg hover:-translate-y-1 hover:scale-105
      ${colors.bg} ${colors.border} ${sizes.padding} ${className}
    `}>
      <div className="flex items-start justify-between">
        {/* Icône */}
        <div className={`
          ${colors.iconBg} ${colors.iconColor} ${sizes.iconSize}
          rounded-lg flex items-center justify-center
          transition-transform duration-200 ease-in-out
          group-hover:scale-110
        `}>
          <span className="text-xl">{icon}</span>
        </div>
        
        {/* Indicateur de tendance */}
        {trend && (
          <div className="flex-shrink-0">
            {getTrendIcon()}
          </div>
        )}
      </div>
      
      {/* Contenu */}
      <div className="mt-4">
        <h3 className={`${sizes.titleSize} font-medium text-gray-600 mb-2`}>
          {title}
        </h3>
        
        <div className={`${sizes.valueSize} font-bold text-gray-900 mb-2`}>
          {formatValue(value)}
        </div>
        
        {/* Changement */}
        {change !== undefined && (
          <div className="flex items-center space-x-2">
            <div className={`
              ${change >= 0 ? 'text-green-600' : 'text-red-600'}
              ${sizes.changeSize} font-medium
            `}>
              {change >= 0 ? '+' : ''}{change}%
            </div>
            {changeLabel && (
              <span className={`${sizes.changeSize} text-gray-500`}>
                {changeLabel}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Effet de brillance au hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default StatsCard;
