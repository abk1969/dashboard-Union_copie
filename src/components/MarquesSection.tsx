import React, { useState, useMemo } from 'react';
import { AdherentData } from '../types';
import { formatCurrency, formatPercentage, formatProgression } from '../utils/formatters';

interface MarquesSectionProps {
  adherentsData: AdherentData[];
}

interface MarquePerformance {
  marque: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  pourcentage2024: number;
  pourcentage2025: number;
  fournisseurs: {
    [fournisseur: string]: {
      ca2024: number;
      ca2025: number;
      progression: number;
    };
  };
}

const MarquesSection: React.FC<MarquesSectionProps> = ({ adherentsData }) => {
  const [selectedMarque, setSelectedMarque] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'ca' | 'progression' | 'marque'>('ca');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Calculer les performances par marque
  const marquesPerformance = useMemo(() => {
    const marquesMap = new Map<string, MarquePerformance>();

    adherentsData.forEach(adherent => {
      const marque = adherent.marque;
      if (!marque) return;

      if (!marquesMap.has(marque)) {
        marquesMap.set(marque, {
          marque,
          ca2024: 0,
          ca2025: 0,
          progression: 0,
          pourcentage2024: 0,
          pourcentage2025: 0,
          fournisseurs: {}
        });
      }

      const marqueData = marquesMap.get(marque)!;
      const fournisseur = adherent.fournisseur;

      if (adherent.annee === 2024) {
        marqueData.ca2024 += adherent.ca;
        if (!marqueData.fournisseurs[fournisseur]) {
          marqueData.fournisseurs[fournisseur] = { ca2024: 0, ca2025: 0, progression: 0 };
        }
        marqueData.fournisseurs[fournisseur].ca2024 += adherent.ca;
      } else if (adherent.annee === 2025) {
        marqueData.ca2025 += adherent.ca;
        if (!marqueData.fournisseurs[fournisseur]) {
          marqueData.fournisseurs[fournisseur] = { ca2024: 0, ca2025: 0, progression: 0 };
        }
        marqueData.fournisseurs[fournisseur].ca2025 += adherent.ca;
      }
    });

    // Calculer les progressions et pourcentages
    const totalCA2024 = Array.from(marquesMap.values()).reduce((sum, m) => sum + m.ca2024, 0);
    const totalCA2025 = Array.from(marquesMap.values()).reduce((sum, m) => sum + m.ca2025, 0);

    marquesMap.forEach(marque => {
      marque.progression = marque.ca2024 > 0 ? ((marque.ca2025 - marque.ca2024) / marque.ca2024) * 100 : 0;
      marque.pourcentage2024 = totalCA2024 > 0 ? (marque.ca2024 / totalCA2024) * 100 : 0;
      marque.pourcentage2025 = totalCA2025 > 0 ? (marque.ca2025 / totalCA2025) * 100 : 0;

      // Calculer les progressions par fournisseur
      Object.values(marque.fournisseurs).forEach(fournisseur => {
        fournisseur.progression = fournisseur.ca2024 > 0 ? 
          ((fournisseur.ca2025 - fournisseur.ca2024) / fournisseur.ca2024) * 100 : 0;
      });
    });

    return Array.from(marquesMap.values());
  }, [adherentsData]);

  // Trier les marques
  const sortedMarques = useMemo(() => {
    return [...marquesPerformance].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'ca':
          comparison = (b.ca2025 + b.ca2024) - (a.ca2025 + a.ca2024);
          break;
        case 'progression':
          comparison = b.progression - a.progression;
          break;
        case 'marque':
          comparison = a.marque.localeCompare(b.marque);
          break;
      }

      return sortOrder === 'desc' ? comparison : -comparison;
    });
  }, [marquesPerformance, sortBy, sortOrder]);

  const handleSort = (field: 'ca' | 'progression' | 'marque') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: 'ca' | 'progression' | 'marque') => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const handleMarqueClick = (marque: string) => {
    console.log('Marque cliquée:', marque); // Debug
    setSelectedMarque(selectedMarque === marque ? null : marque);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🏷️ Performance par Marques</h1>
            <p className="text-green-100 mt-1">
              Vue d'ensemble des performances par marque et par fournisseur
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatCurrency(
              sortedMarques.reduce((sum, m) => sum + m.ca2025, 0)
            )}</p>
            <p className="text-green-100">CA Total 2025</p>
          </div>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">🏷️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Marques Actives</p>
              <p className="text-2xl font-bold text-gray-900">{sortedMarques.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">CA Moyen par Marque</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(sortedMarques.length > 0 ? 
                  sortedMarques.reduce((sum, m) => sum + m.ca2025, 0) / sortedMarques.length : 0
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Progression Moyenne</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(sortedMarques.length > 0 ? 
                  sortedMarques.reduce((sum, m) => sum + m.progression, 0) / sortedMarques.length : 0
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Top Marque</p>
              <p className="text-lg font-bold text-gray-900">
                {sortedMarques[0]?.marque || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des marques */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">📋 Détail par Marque</h2>
          <div className="text-sm text-gray-500">
            💡 Cliquez sur une marque pour voir le détail par fournisseur
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('marque')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Classement</span>
                    <span className="text-xs">{getSortIcon('marque')}</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Marque
                </th>
                <th 
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('ca')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>CA 2024</span>
                    <span className="text-xs">{getSortIcon('ca')}</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CA 2025
                </th>
                <th 
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('progression')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Progression</span>
                    <span className="text-xs">{getSortIcon('progression')}</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % 2024
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % 2025
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fournisseurs
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedMarques.map((marque, index) => (
                <React.Fragment key={marque.marque}>
                  <tr 
                    className={`hover:bg-blue-50 cursor-pointer transition-all duration-200 ${
                      selectedMarque === marque.marque ? 'bg-blue-100' : ''
                    }`}
                    onClick={() => handleMarqueClick(marque.marque)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {marque.marque}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(marque.ca2024)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(marque.ca2025)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <span className={marque.progression >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatProgression(marque.progression).value}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                      {formatPercentage(marque.pourcentage2024)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                      {formatPercentage(marque.pourcentage2025)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {Object.keys(marque.fournisseurs).length}
                      </span>
                    </td>
                  </tr>
                  
                  {/* Détail par fournisseur directement sous la ligne */}
                  {selectedMarque === marque.marque && (
                    <tr>
                      <td colSpan={8} className="px-0 py-0">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-800">
                              📊 Détail par Fournisseur : {selectedMarque}
                            </h3>
                            <button 
                              onClick={() => setSelectedMarque(null)}
                              className="text-gray-500 hover:text-gray-700 text-lg font-bold"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Object.entries(marque.fournisseurs).map(([fournisseur, data]) => (
                              <div key={fournisseur} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="text-sm font-medium text-gray-600">{fournisseur}</div>
                                <div className="text-lg font-bold text-gray-900">{formatCurrency(data.ca2025)}</div>
                                <div className="text-xs text-gray-500">
                                  vs {formatCurrency(data.ca2024)} en 2024
                                </div>
                                <div className={`text-sm font-medium ${
                                  data.progression >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {formatProgression(data.progression).value}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarquesSection;
