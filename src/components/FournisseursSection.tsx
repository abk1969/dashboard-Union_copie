import React from 'react';
import { FournisseurPerformance } from '../types';
import RevenueChart from './RevenueChart';

interface FournisseursSectionProps {
  fournisseursPerformance: FournisseurPerformance[];
  onFournisseurClick: (fournisseur: FournisseurPerformance) => void;
}

const FournisseursSection: React.FC<FournisseursSectionProps> = ({ 
  fournisseursPerformance, 
  onFournisseurClick 
}) => {
  const getStatusColor = (progression: number) => {
    if (progression > 5) return 'text-green-600';
    if (progression < -5) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getStatusIcon = (progression: number) => {
    if (progression > 5) return '↗️';
    if (progression < -5) return '↘️';
    return '→';
  };

  return (
    <div className="fournisseurs-section space-y-6">
      {/* Titre de la section */}
      <div className="flex items-center mb-6">
        <span className="text-3xl mr-3">🏢</span>
        <h2 className="text-2xl font-bold text-gray-800">Performance des Fournisseurs</h2>
        <span className="ml-3 text-lg text-gray-600">(Vue Groupement Union)</span>
      </div>

      {/* Cartes des fournisseurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {fournisseursPerformance.map((fournisseur) => (
          <div
            key={fournisseur.fournisseur}
            onClick={() => onFournisseurClick(fournisseur)}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl hover:border-blue-300 cursor-pointer transition-all duration-200 transform hover:scale-105"
          >
            <div className="text-center">
              <div className="text-3xl mb-3">🏭</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">{fournisseur.fournisseur}</h3>
              
              <div className="space-y-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-blue-600 font-medium">CA 2024</div>
                  <div className="text-lg font-bold text-blue-800">
                    {new Intl.NumberFormat('fr-FR', { 
                      style: 'currency', 
                      currency: 'EUR',
                      minimumFractionDigits: 0 
                    }).format(fournisseur.ca2024)}
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-green-600 font-medium">CA 2025</div>
                  <div className="text-lg font-bold text-green-800">
                    {new Intl.NumberFormat('fr-FR', { 
                      style: 'currency', 
                      currency: 'EUR',
                      minimumFractionDigits: 0 
                    }).format(fournisseur.ca2025)}
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-sm text-purple-600 font-medium">Progression</div>
                  <div className={`text-lg font-bold ${getStatusColor(fournisseur.progression)}`}>
                    {getStatusIcon(fournisseur.progression)} {fournisseur.progression >= 0 ? '+' : ''}{fournisseur.progression}%
                  </div>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="text-sm text-orange-600 font-medium">% du CA Total</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center">
                      <div className="text-xs text-orange-500">2024</div>
                      <div className="text-sm font-bold text-orange-800">
                        {fournisseur.pourcentage2024}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-orange-500">2025</div>
                      <div className="text-sm font-bold text-orange-800">
                        {fournisseur.pourcentage2025}%
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-orange-500 mt-1 text-center">
                    {fournisseur.pourcentage2025 > fournisseur.pourcentage2024 ? '↗️' : fournisseur.pourcentage2025 < fournisseur.pourcentage2024 ? '↘️' : '→'} 
                    {(fournisseur.pourcentage2025 - fournisseur.pourcentage2024).toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                Cliquez pour voir les détails
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Graphiques de comparaison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique en barres - CA par fournisseur */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">CA par Fournisseur</h3>
          <RevenueChart
            data={fournisseursPerformance}
            type="bar"
            title=""
            chartType="fournisseur"
          />
        </div>

        {/* Graphique doughnut - Répartition */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Répartition du CA Total</h3>
          <RevenueChart
            data={fournisseursPerformance}
            type="doughnut"
            title=""
            chartType="fournisseur"
          />
        </div>
      </div>

      {/* Tableau récapitulatif */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Récapitulatif des Fournisseurs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseur</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2024</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2025</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% 2024</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% 2025</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fournisseursPerformance.map((fournisseur, index) => (
                <tr key={fournisseur.fournisseur} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fournisseur.fournisseur}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(fournisseur.ca2024)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(fournisseur.ca2025)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${getStatusColor(fournisseur.progression)}`}>
                    {getStatusIcon(fournisseur.progression)} {fournisseur.progression >= 0 ? '+' : ''}{fournisseur.progression}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {fournisseur.pourcentage2024}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {fournisseur.pourcentage2025}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <button
                      onClick={() => onFournisseurClick(fournisseur)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Voir Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FournisseursSection;
