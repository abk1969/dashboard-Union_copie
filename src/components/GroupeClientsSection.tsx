import React, { useState, useMemo } from 'react';
import { AdherentData } from '../types';
import { formatCurrency, formatPercentage, formatProgression } from '../utils/formatters';

interface GroupeClientsSectionProps {
  adherentsData: AdherentData[];
}

interface GroupeClientPerformance {
  groupeClient: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  pourcentage2024: number;
  pourcentage2025: number;
  adherents: Set<string>;
  fournisseurs: {
    [fournisseur: string]: {
      ca2024: number;
      ca2025: number;
      progression: number;
      pourcentage: number;
    };
  };
  marques: {
    [marque: string]: {
      ca2024: number;
      ca2025: number;
      progression: number;
      pourcentage: number;
    };
  };
  familles: {
    [famille: string]: {
      ca2024: number;
      ca2025: number;
      progression: number;
      pourcentage: number;
    };
  };
}

const GroupeClientsSection: React.FC<GroupeClientsSectionProps> = ({ adherentsData }) => {
  const [selectedGroupe, setSelectedGroupe] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'fournisseurs' | 'marques' | 'familles'>('fournisseurs');
  const [sortBy, setSortBy] = useState<'ca' | 'progression' | 'groupe'>('ca');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Calculer les performances par groupe client
  const groupesPerformance = useMemo(() => {
    const groupesMap = new Map<string, GroupeClientPerformance>();

    adherentsData.forEach(adherent => {
      const groupe = adherent.groupeClient;
      if (!groupe) return;

      if (!groupesMap.has(groupe)) {
        groupesMap.set(groupe, {
          groupeClient: groupe,
          ca2024: 0,
          ca2025: 0,
          progression: 0,
          pourcentage2024: 0,
          pourcentage2025: 0,
          adherents: new Set(),
          fournisseurs: {},
          marques: {},
          familles: {}
        });
      }

      const groupeData = groupesMap.get(groupe)!;
      const fournisseur = adherent.fournisseur;
      const marque = adherent.marque;
      const famille = adherent.sousFamille;

      // Ajouter l'adhérent
      groupeData.adherents.add(adherent.codeUnion);

      if (adherent.annee === 2024) {
        groupeData.ca2024 += adherent.ca;
        
        // Fournisseurs
        if (!groupeData.fournisseurs[fournisseur]) {
          groupeData.fournisseurs[fournisseur] = { ca2024: 0, ca2025: 0, progression: 0, pourcentage: 0 };
        }
        groupeData.fournisseurs[fournisseur].ca2024 += adherent.ca;

        // Marques
        if (!groupeData.marques[marque]) {
          groupeData.marques[marque] = { ca2024: 0, ca2025: 0, progression: 0, pourcentage: 0 };
        }
        groupeData.marques[marque].ca2024 += adherent.ca;

        // Familles
        if (!groupeData.familles[famille]) {
          groupeData.familles[famille] = { ca2024: 0, ca2025: 0, progression: 0, pourcentage: 0 };
        }
        groupeData.familles[famille].ca2024 += adherent.ca;

      } else if (adherent.annee === 2025) {
        groupeData.ca2025 += adherent.ca;
        
        // Fournisseurs
        if (!groupeData.fournisseurs[fournisseur]) {
          groupeData.fournisseurs[fournisseur] = { ca2024: 0, ca2025: 0, progression: 0, pourcentage: 0 };
        }
        groupeData.fournisseurs[fournisseur].ca2025 += adherent.ca;

        // Marques
        if (!groupeData.marques[marque]) {
          groupeData.marques[marque] = { ca2024: 0, ca2025: 0, progression: 0, pourcentage: 0 };
        }
        groupeData.marques[marque].ca2025 += adherent.ca;

        // Familles
        if (!groupeData.familles[famille]) {
          groupeData.familles[famille] = { ca2024: 0, ca2025: 0, progression: 0, pourcentage: 0 };
        }
        groupeData.familles[famille].ca2025 += adherent.ca;
      }
    });

    // Calculer les progressions et pourcentages
    const totalCA2024 = Array.from(groupesMap.values()).reduce((sum, g) => sum + g.ca2024, 0);
    const totalCA2025 = Array.from(groupesMap.values()).reduce((sum, g) => sum + g.ca2025, 0);

    groupesMap.forEach(groupe => {
      groupe.progression = groupe.ca2024 > 0 ? ((groupe.ca2025 - groupe.ca2024) / groupe.ca2024) * 100 : 0;
      groupe.pourcentage2024 = totalCA2024 > 0 ? (groupe.ca2024 / totalCA2024) * 100 : 0;
      groupe.pourcentage2025 = totalCA2025 > 0 ? (groupe.ca2025 / totalCA2025) * 100 : 0;

      // Calculer les progressions par fournisseur
      Object.values(groupe.fournisseurs).forEach(fournisseur => {
        fournisseur.progression = fournisseur.ca2024 > 0 ? 
          ((fournisseur.ca2025 - fournisseur.ca2024) / fournisseur.ca2024) * 100 : 0;
        fournisseur.pourcentage = groupe.ca2025 > 0 ? (fournisseur.ca2025 / groupe.ca2025) * 100 : 0;
      });

      // Calculer les progressions par marque
      Object.values(groupe.marques).forEach(marque => {
        marque.progression = marque.ca2024 > 0 ? 
          ((marque.ca2025 - marque.ca2024) / marque.ca2024) * 100 : 0;
        marque.pourcentage = groupe.ca2025 > 0 ? (marque.ca2025 / groupe.ca2025) * 100 : 0;
      });

      // Calculer les progressions par famille
      Object.values(groupe.familles).forEach(famille => {
        famille.progression = famille.ca2024 > 0 ? 
          ((famille.ca2025 - famille.ca2024) / famille.ca2024) * 100 : 0;
        famille.pourcentage = groupe.ca2025 > 0 ? (famille.ca2025 / groupe.ca2025) * 100 : 0;
      });
    });

    return Array.from(groupesMap.values());
  }, [adherentsData]);

  // Trier les groupes
  const sortedGroupes = useMemo(() => {
    return [...groupesPerformance].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'ca':
          comparison = (b.ca2025 + b.ca2024) - (a.ca2025 + a.ca2024);
          break;
        case 'progression':
          comparison = b.progression - a.progression;
          break;
        case 'groupe':
          comparison = a.groupeClient.localeCompare(b.groupeClient);
          break;
      }

      return sortOrder === 'desc' ? comparison : -comparison;
    });
  }, [groupesPerformance, sortBy, sortOrder]);

  const handleSort = (field: 'ca' | 'progression' | 'groupe') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: 'ca' | 'progression' | 'groupe') => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const handleGroupeClick = (groupe: string) => {
    setSelectedGroupe(selectedGroupe === groupe ? null : groupe);
  };

  const getViewData = (groupe: GroupeClientPerformance) => {
    switch (activeView) {
      case 'fournisseurs':
        return Object.entries(groupe.fournisseurs);
      case 'marques':
        return Object.entries(groupe.marques);
      case 'familles':
        return Object.entries(groupe.familles);
      default:
        return [];
    }
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'fournisseurs':
        return '🏢 Fournisseurs';
      case 'marques':
        return '🏷️ Marques';
      case 'familles':
        return '📦 Familles de Produits';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">👥 Analyse par Groupe Clients</h1>
            <p className="text-indigo-100 mt-1">
              Vue consolidée des performances par groupe client, fournisseur, marque et famille
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatCurrency(
              sortedGroupes.reduce((sum, g) => sum + g.ca2025, 0)
            )}</p>
            <p className="text-indigo-100">CA Total 2025</p>
          </div>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Groupes Clients</p>
              <p className="text-2xl font-bold text-gray-900">{sortedGroupes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">CA Moyen par Groupe</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(sortedGroupes.length > 0 ? 
                  sortedGroupes.reduce((sum, g) => sum + g.ca2025, 0) / sortedGroupes.length : 0
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
                {formatPercentage(sortedGroupes.length > 0 ? 
                  sortedGroupes.reduce((sum, g) => sum + g.progression, 0) / sortedGroupes.length : 0
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
              <p className="text-sm font-medium text-gray-600">Top Groupe</p>
              <p className="text-lg font-bold text-gray-900">
                {sortedGroupes[0]?.groupeClient || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des groupes clients */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">📋 Détail par Groupe Client</h2>
          <div className="text-sm text-gray-500">
            💡 Cliquez sur un groupe pour voir le détail par {activeView === 'fournisseurs' ? 'fournisseur' : activeView === 'marques' ? 'marque' : 'famille'}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('groupe')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Classement</span>
                    <span className="text-xs">{getSortIcon('groupe')}</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Groupe Client
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
                  Adhérents
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedGroupes.map((groupe, index) => (
                <React.Fragment key={groupe.groupeClient}>
                  <tr 
                    className={`hover:bg-indigo-50 cursor-pointer transition-all duration-200 ${
                      selectedGroupe === groupe.groupeClient ? 'bg-indigo-100' : ''
                    }`}
                    onClick={() => handleGroupeClick(groupe.groupeClient)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {groupe.groupeClient}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(groupe.ca2024)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(groupe.ca2025)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <span className={groupe.progression >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatProgression(groupe.progression).value}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                      {formatPercentage(groupe.pourcentage2024)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                      {formatPercentage(groupe.pourcentage2025)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {groupe.adherents.size}
                      </span>
                    </td>
                  </tr>
                  
                  {/* Détail par fournisseur/marque/famille directement sous la ligne */}
                  {selectedGroupe === groupe.groupeClient && (
                    <tr>
                      <td colSpan={8} className="px-0 py-0">
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-400 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-800">
                              📊 Détail par {getViewTitle()} : {selectedGroupe}
                            </h3>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setActiveView('fournisseurs')}
                                className={`px-3 py-1 rounded text-sm font-medium ${
                                  activeView === 'fournisseurs'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                🏢 Fournisseurs
                              </button>
                              <button
                                onClick={() => setActiveView('marques')}
                                className={`px-3 py-1 rounded text-sm font-medium ${
                                  activeView === 'marques'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                🏷️ Marques
                              </button>
                              <button
                                onClick={() => setActiveView('familles')}
                                className={`px-3 py-1 rounded text-sm font-medium ${
                                  activeView === 'familles'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                📦 Familles
                              </button>
                              <button 
                                onClick={() => setSelectedGroupe(null)}
                                className="text-gray-500 hover:text-gray-700 text-lg font-bold ml-4"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {getViewData(groupe).map(([key, data]) => (
                              <div key={key} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="text-sm font-medium text-gray-600">{key}</div>
                                <div className="text-lg font-bold text-gray-900">{formatCurrency(data.ca2025)}</div>
                                <div className="text-xs text-gray-500">
                                  vs {formatCurrency(data.ca2024)} en 2024
                                </div>
                                <div className={`text-sm font-medium ${
                                  data.progression >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {formatProgression(data.progression).value}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {data.pourcentage.toFixed(1)}% du CA du groupe
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

export default GroupeClientsSection;
