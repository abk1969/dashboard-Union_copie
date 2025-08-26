import React from 'react';
import { TopFlopClient } from '../types';

interface TopFlopSectionProps {
  top10ByCA: TopFlopClient[];
  top10Progression: TopFlopClient[];
  top10Regression: TopFlopClient[];
  onClientClick: (client: TopFlopClient) => void;
}

const TopFlopSection: React.FC<TopFlopSectionProps> = ({ top10ByCA, top10Progression, top10Regression, onClientClick }) => {
  return (
    <div className="top-flop-section grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* TOP 10 PAR CA 2025 */}
      <div className="top-performers bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-2">🏆</span>
          <h3 className="text-lg font-semibold text-gray-700">TOP 10 CA 2025</h3>
        </div>
        
        <div className="space-y-3">
          {top10ByCA.map((client, index) => (
            <div 
              key={client.codeUnion} 
              className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 cursor-pointer transition-colors"
              onClick={() => onClientClick(client)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg font-bold text-green-600">#{index + 1}</span>
                <div>
                  <div className="font-medium text-gray-900">{client.raisonSociale}</div>
                  <div className="text-sm text-gray-600">{client.codeUnion}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                  }).format(client.ca2025)}
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>2024: {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                  }).format(client.ca2024)}</div>
                  <div className={`font-medium ${client.progression >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {client.progression >= 0 ? '↗️' : '↘️'} {client.progression >= 0 ? '+' : ''}{client.progression}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TOP 10 PROGRESSION */}
      <div className="top-progression bg-white rounded-lg shadow-sm border border-blue-200 p-6">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-2">📈</span>
          <h3 className="text-lg font-semibold text-gray-700">TOP 10 PROGRESSION</h3>
        </div>
        
        <div className="space-y-3">
          {top10Progression.map((client, index) => (
            <div 
              key={client.codeUnion} 
              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors"
              onClick={() => onClientClick(client)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg font-bold text-blue-600">#{index + 1}</span>
                <div>
                  <div className="font-medium text-gray-900">{client.raisonSociale}</div>
                  <div className="text-sm text-gray-600">{client.codeUnion}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">
                  ↗️ +{client.progression}%
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>2024: {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                  }).format(client.ca2024)}</div>
                  <div>2025: {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                  }).format(client.ca2025)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TOP 10 RÉGRESSION */}
      <div className="top-regression bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-2">📉</span>
          <h3 className="text-lg font-semibold text-gray-700">TOP 10 RÉGRESSION</h3>
        </div>
        
        <div className="space-y-3">
          {top10Regression.map((client, index) => (
            <div 
              key={client.codeUnion} 
              className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 cursor-pointer transition-colors"
              onClick={() => onClientClick(client)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg font-bold text-red-600">#{index + 1}</span>
                <div>
                  <div className="font-medium text-gray-900">{client.raisonSociale}</div>
                  <div className="text-sm text-gray-600">{client.codeUnion}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-red-600">
                  ↘️ {client.progression}%
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>2024: {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                  }).format(client.ca2024)}</div>
                  <div>2025: {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                  }).format(client.ca2025)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopFlopSection;
