import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: string;
  format?: 'currency' | 'number' | 'percentage';
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  icon = '📊',
  format = 'number',
  color = 'primary'
}) => {
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

  const getChangeColor = (change?: number): string => {
    if (!change) return '';
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (change?: number): string => {
    if (!change) return '';
    return change >= 0 ? '↗️' : '↘️';
  };

  const getCardColor = (): string => {
    switch (color) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'danger': return 'border-red-200 bg-red-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className={`metric-card border-2 rounded-lg p-6 ${getCardColor()} shadow-sm hover:shadow-md transition-shadow`}>
      <div className="metric-header flex items-center mb-4">
        <span className="metric-icon text-2xl mr-3">{icon}</span>
        <h3 className="metric-title text-lg font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="metric-value text-3xl font-bold text-gray-900 mb-2">
        {formatValue(value)}
      </div>
      {change !== undefined && (
        <div className={`metric-change text-sm font-medium ${getChangeColor(change)}`}>
          <span className="change-icon mr-1">{getChangeIcon(change)}</span>
          <span>{Math.abs(change)}%</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
