import React, { useState, useMemo } from 'react';
import { AdherentData } from '../types';
import { formatCurrency, formatPercentageDirect, formatProgression } from '../utils/formatters';

interface MarquesSectionProps {
  adherentsData: AdherentData[];
  famillesPerformance?: Array<{
    famille: string;
    ca2024: number;
    ca2025: number;
    progression: number;
    pourcentageTotal: number;
  }>;
}

interface MarquePerformance {
  marque: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  pourcentage2024: number;
  pourcentage2025: number;
  classement2024: number;
  classement2025: number;
  evolutionClassement: number; // Différence de classement (négatif = amélioration)
  fournisseurs: {
    [fournisseur: string]: {
      ca2024: number;
      ca2025: number;
      progression: number;
    };
  };
}

const MarquesSection: React.FC<MarquesSectionProps> = ({ adherentsData, famillesPerformance }) => {

  const [sortBy, setSortBy] = useState<'ca' | 'progression' | 'marque'>('ca');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [expandedFamilles, setExpandedFamilles] = useState<Set<string>>(new Set());
  const [currentFamillePage, setCurrentFamillePage] = useState(1);
  const famillesPerPage = 20;
  const [selectedMarqueDetails, setSelectedMarqueDetails] = useState<string | null>(null);
  const [selectedFamilleDetails, setSelectedFamilleDetails] = useState<string | null>(null);

  // Fonction pour gérer l'expansion des familles
  const toggleFamilleExpansion = (famille: string) => {
    setExpandedFamilles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(famille)) {
        newSet.delete(famille);
      } else {
        newSet.add(famille);
      }
      return newSet;
    });
  };

  // Fonction pour gérer le clic sur une marque
  const handleMarqueClick = (marque: string) => {
    console.log('🖱️ Clic sur marque:', marque);
    setSelectedMarqueDetails(marque);
    setSelectedFamilleDetails(null); // Fermer les détails de famille
  };

  // Fonction pour gérer le clic sur une famille
  const handleFamilleClick = (famille: string) => {
    setSelectedFamilleDetails(famille);
    setSelectedMarqueDetails(null); // Fermer les détails de marque
  };

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
          classement2024: 0,
          classement2025: 0,
          evolutionClassement: 0,
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

    const marques = Array.from(marquesMap.values());

    // Calculer les classements 2024 et 2025
    const marquesByCA2024 = [...marques].sort((a, b) => b.ca2024 - a.ca2024);
    const marquesByCA2025 = [...marques].sort((a, b) => b.ca2025 - a.ca2025);

    // Attribuer les classements
    marquesByCA2024.forEach((marque, index) => {
      marque.classement2024 = index + 1;
    });

    marquesByCA2025.forEach((marque, index) => {
      marque.classement2025 = index + 1;
    });

    // Calculer l'évolution du classement (négatif = amélioration)
    marques.forEach(marque => {
      marque.evolutionClassement = marque.classement2025 - marque.classement2024;
    });

    return marques;
  }, [adherentsData]);

  // Grouper les marques par famille (vraie colonne famille) puis par sous-famille
  const marquesByFamille = useMemo(() => {
    const grouped = new Map<string, { sousFamilles: Map<string, MarquePerformance[]> }>();
    
    // Grouper par famille puis par sous-famille
    adherentsData.forEach(adherent => {
      const famille = adherent.famille;
      const sousFamille = adherent.sousFamille;
      const marque = adherent.marque;
      
      if (!famille || !sousFamille || !marque) return;
      
      if (!grouped.has(famille)) {
        grouped.set(famille, { sousFamilles: new Map() });
      }
      
      const familleData = grouped.get(famille)!;
      if (!familleData.sousFamilles.has(sousFamille)) {
        familleData.sousFamilles.set(sousFamille, []);
      }
      
      // Vérifier si cette marque existe déjà dans cette sous-famille
      const existingMarque = familleData.sousFamilles.get(sousFamille)!.find(m => m.marque === marque);
      
      if (!existingMarque) {
        // Créer une nouvelle entrée marque pour cette sous-famille
        const newMarque: MarquePerformance = {
          marque,
          ca2024: 0,
          ca2025: 0,
          progression: 0,
          pourcentage2024: 0,
          pourcentage2025: 0,
          classement2024: 0,
          classement2025: 0,
          evolutionClassement: 0,
          fournisseurs: {}
        };
        familleData.sousFamilles.get(sousFamille)!.push(newMarque);
      }
    });
    
    // Calculer les CA pour chaque marque dans chaque sous-famille
    grouped.forEach((familleData, famille) => {
      familleData.sousFamilles.forEach((marques, sousFamille) => {
        marques.forEach(marque => {
          const marqueData = adherentsData.filter(adherent => 
            adherent.famille === famille && 
            adherent.sousFamille === sousFamille && 
            adherent.marque === marque.marque
          );
          
          marqueData.forEach(adherent => {
            if (adherent.annee === 2024) {
              marque.ca2024 += adherent.ca;
            } else if (adherent.annee === 2025) {
              marque.ca2025 += adherent.ca;
            }
          });
          
          // Calculer la progression
          marque.progression = marque.ca2024 > 0 ? ((marque.ca2025 - marque.ca2024) / marque.ca2024) * 100 : 0;
        });
      });
    });
    
    return grouped;
  }, [adherentsData]);

  // Calculs de pagination pour les familles
  const totalFamilles = famillesPerformance?.length || 0;
  const totalFamillePages = Math.ceil(totalFamilles / famillesPerPage);
  const startFamilleIndex = (currentFamillePage - 1) * famillesPerPage;
  const endFamilleIndex = startFamilleIndex + famillesPerPage;
  const currentFamilles = famillesPerformance?.slice(startFamilleIndex, endFamilleIndex) || [];



  // Détails d'une famille sélectionnée (marques associées)
  const familleDetails = useMemo(() => {
    if (!selectedFamilleDetails) return null;
    
    const familleData = adherentsData.filter(adherent => adherent.sousFamille === selectedFamilleDetails);
    const marquesMap = new Map<string, { ca2024: number; ca2025: number; progression: number }>();
    
    familleData.forEach(adherent => {
      const marque = adherent.marque;
      if (!marquesMap.has(marque)) {
        marquesMap.set(marque, { ca2024: 0, ca2025: 0, progression: 0 });
      }
      
      const marqueData = marquesMap.get(marque)!;
      if (adherent.annee === 2024) {
        marqueData.ca2024 += adherent.ca;
      } else if (adherent.annee === 2025) {
        marqueData.ca2025 += adherent.ca;
      }
    });
    
    // Calculer les progressions
    marquesMap.forEach(marque => {
      marque.progression = marque.ca2024 > 0 ? ((marque.ca2025 - marque.ca2024) / marque.ca2024) * 100 : 0;
    });
    
    return {
      famille: selectedFamilleDetails,
      marques: Array.from(marquesMap.entries()).map(([marque, data]) => ({
        marque,
        ...data
      })).sort((a, b) => b.ca2025 - a.ca2025)
    };
  }, [selectedFamilleDetails, adherentsData]);

  // Trier les marques
  const sortedMarques = useMemo(() => {
    return [...marquesPerformance].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'ca':
          comparison = b.ca2025 - a.ca2025; // Tri par CA 2025 par défaut
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

  // Pagination
  const totalPages = Math.ceil(sortedMarques.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMarques = sortedMarques.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedMarqueDetails(null); // Fermer le détail lors du changement de page
  };

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



  // Fonction pour obtenir l'icône et la couleur de l'évolution du classement
  const getClassementEvolution = (evolutionClassement: number) => {
    if (evolutionClassement < 0) {
      // Amélioration (montée dans le classement)
      return {
        icon: '⬆️',
        color: 'text-green-600',
        text: `+${Math.abs(evolutionClassement)} place${Math.abs(evolutionClassement) > 1 ? 's' : ''}`
      };
    } else if (evolutionClassement > 0) {
      // Dégradation (descente dans le classement)
      return {
        icon: '⬇️',
        color: 'text-red-600',
        text: `-${evolutionClassement} place${evolutionClassement > 1 ? 's' : ''}`
      };
    } else {
      // Stable
      return {
        icon: '➡️',
        color: 'text-yellow-600',
        text: 'Stable'
      };
    }
  };

  // Fonction pour obtenir les médailles selon le classement
  const getMedaille = (classement: number) => {
    switch (classement) {
      case 1:
        return { medal: '🥇', bg: 'from-yellow-400 to-yellow-600', text: 'Or' };
      case 2:
        return { medal: '🥈', bg: 'from-gray-300 to-gray-500', text: 'Argent' };
      case 3:
        return { medal: '🥉', bg: 'from-orange-400 to-orange-600', text: 'Bronze' };
      case 4:
        return { medal: '🍫', bg: 'from-amber-600 to-amber-800', text: 'Chocolat' };
      default:
        return { medal: classement.toString(), bg: 'from-blue-400 to-blue-600', text: `${classement}ème` };
    }
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
                {(() => {
                  const totalCA2024 = sortedMarques.reduce((sum, m) => sum + m.ca2024, 0);
                  const totalCA2025 = sortedMarques.reduce((sum, m) => sum + m.ca2025, 0);
                  const globalProgression = totalCA2024 > 0 ? ((totalCA2025 - totalCA2024) / totalCA2024) * 100 : 0;
                  return formatProgression(globalProgression).value;
                })()}
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
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classement 2024
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classement 2025
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Évolution
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
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('ca')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>CA 2025</span>
                    <span className="text-xs">{getSortIcon('ca')}</span>
                  </div>
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
              {currentMarques.map((marque, index) => (
                <React.Fragment key={marque.marque}>
                  <tr 
                    className={`hover:bg-blue-50 cursor-pointer transition-all duration-200 ${
                      selectedMarqueDetails === marque.marque ? 'bg-blue-100' : ''
                    }`}
                    onClick={() => handleMarqueClick(marque.marque)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center justify-center">
                        {(() => {
                          const medaille2024 = getMedaille(marque.classement2024);
                          return (
                            <>
                              <div className={`flex-shrink-0 h-10 w-10 bg-gradient-to-br ${medaille2024.bg} rounded-full flex items-center justify-center shadow-lg`}>
                                <span className="text-lg">
                                  {medaille2024.medal}
                                </span>
                              </div>
                              <span className="text-xs text-gray-600 mt-1 font-medium">
                                {medaille2024.text}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center justify-center">
                        {(() => {
                          const medaille2025 = getMedaille(marque.classement2025);
                          return (
                            <>
                              <div className={`flex-shrink-0 h-10 w-10 bg-gradient-to-br ${medaille2025.bg} rounded-full flex items-center justify-center shadow-lg`}>
                                <span className="text-lg">
                                  {medaille2025.medal}
                                </span>
                              </div>
                              <span className="text-xs text-gray-600 mt-1 font-medium">
                                {medaille2025.text}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {(() => {
                        const evolution = getClassementEvolution(marque.evolutionClassement);
                        return (
                          <div className="flex items-center justify-center space-x-1">
                            <span className="text-lg">{evolution.icon}</span>
                            <span className={`text-sm font-medium ${evolution.color}`}>
                              {evolution.text}
                            </span>
                          </div>
                        );
                      })()}
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
                      {formatPercentageDirect(marque.pourcentage2024)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                      {formatPercentageDirect(marque.pourcentage2025)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {Object.keys(marque.fournisseurs).length}
                      </span>
                    </td>
                  </tr>
                  
                  {/* Détail par fournisseur directement sous la ligne */}
                  {selectedMarqueDetails === marque.marque && (
                    <tr>
                      <td colSpan={10} className="px-0 py-0">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-800">
                              📊 Détail par Fournisseur : {selectedMarqueDetails}
                            </h3>
                            <button 
                              onClick={() => setSelectedMarqueDetails(null)}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-700">
              Affichage de {startIndex + 1} à {Math.min(endIndex, sortedMarques.length)} sur {sortedMarques.length} marques
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        )}


      </div>

      {/* Performance par Famille de Produits - Hiérarchie à 3 niveaux */}
      {famillesPerformance && famillesPerformance.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">📦 Performance par Famille de Produits</h3>
              <p className="text-gray-600 mt-1">
                Hiérarchie: Marque → Famille → Sous-famille
              </p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
              {famillesPerformance.length} familles
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Famille / Sous-famille</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">CA 2024</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">CA 2025</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Progression</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">% 2025</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentFamilles.map((item) => {
                  const isExpanded = expandedFamilles.has(item.famille);
                  const familleData = marquesByFamille.get(item.famille);
                  
                  return (
                    <React.Fragment key={item.famille}>
                      {/* Ligne principale de la famille */}
                      <tr 
                        className="hover:bg-gray-50 cursor-pointer transition-colors duration-200 bg-gray-50"
                        onClick={() => toggleFamilleExpansion(item.famille)}
                      >
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          <div className="flex items-center space-x-2">
                            <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                              ▶️
                            </span>
                            <span className="font-bold text-lg">
                              {item.famille}
                            </span>
                            {familleData && (
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                {Array.from(familleData.sousFamilles.keys()).length} sous-famille{Array.from(familleData.sousFamilles.keys()).length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-gray-700">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2024)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-gray-700">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          <span className={`font-medium ${item.progression >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.progression >= 0 ? '+' : ''}{item.progression.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-gray-700">{item.pourcentageTotal.toFixed(1)}%</td>
                      </tr>
                      
                      {/* Lignes des sous-familles détaillées (si famille développée) */}
                      {isExpanded && familleData && (
                        <>
                          {Array.from(familleData.sousFamilles.entries()).map(([sousFamille, marques]) => {
                            const sousFamilleCA2024 = marques.reduce((sum, m) => sum + m.ca2024, 0);
                            const sousFamilleCA2025 = marques.reduce((sum, m) => sum + m.ca2025, 0);
                            const sousFamilleProgression = sousFamilleCA2024 > 0 ? ((sousFamilleCA2025 - sousFamilleCA2024) / sousFamilleCA2024) * 100 : 0;
                            
                            return (
                              <React.Fragment key={`${item.famille}-${sousFamille}`}>
                                {/* Ligne sous-famille */}
                                <tr className="bg-blue-50 hover:bg-blue-100 cursor-pointer" onClick={() => handleFamilleClick(sousFamille)}>
                                  <td className="py-2 px-8 text-sm text-gray-700">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-blue-500">📦</span>
                                      <span className="font-medium text-blue-700 hover:text-blue-900">{sousFamille}</span>
                                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                        {marques.length} marque{marques.length > 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2 px-4 text-sm text-right text-gray-600">
                                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(sousFamilleCA2024)}
                                  </td>
                                  <td className="py-2 px-4 text-sm text-right text-gray-600">
                                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(sousFamilleCA2025)}
                                  </td>
                                  <td className="py-2 px-4 text-sm text-right">
                                    <span className={`font-medium ${sousFamilleProgression >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {sousFamilleProgression >= 0 ? '+' : ''}{sousFamilleProgression.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="py-2 px-4 text-sm text-right text-gray-600">
                                    {((sousFamilleCA2025 / item.ca2025) * 100).toFixed(1)}%
                                  </td>
                                </tr>
                                
                                {/* Lignes des marques dans cette sous-famille */}
                                {marques
                                  .sort((a, b) => b.ca2025 - a.ca2025)
                                  .map((marque) => (
                                  <tr key={`${item.famille}-${sousFamille}-${marque.marque}`} className="bg-green-50 hover:bg-green-100 cursor-pointer" onClick={() => handleMarqueClick(marque.marque)}>
                                    <td className="py-1 px-12 text-sm text-gray-600">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-green-500">🏷️</span>
                                        <span className="font-medium text-green-700 hover:text-green-900">{marque.marque}</span>
                                      </div>
                                    </td>
                                    <td className="py-1 px-4 text-sm text-right text-gray-500">
                                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(marque.ca2024)}
                                    </td>
                                    <td className="py-1 px-4 text-sm text-right text-gray-500">
                                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(marque.ca2025)}
                                    </td>
                                    <td className="py-1 px-4 text-sm text-right">
                                      <span className={`font-medium ${marque.progression >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {marque.progression >= 0 ? '+' : ''}{marque.progression.toFixed(1)}%
                                      </span>
                                    </td>
                                    <td className="py-1 px-4 text-sm text-right text-gray-500">
                                      {((marque.ca2025 / sousFamilleCA2025) * 100).toFixed(1)}%
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            );
                          })}
                        </>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination pour les familles */}
          {totalFamillePages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Affichage de {startFamilleIndex + 1} à {Math.min(endFamilleIndex, totalFamilles)} sur {totalFamilles} familles
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentFamillePage(prev => Math.max(1, prev - 1))}
                  disabled={currentFamillePage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalFamillePages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalFamillePages - 4, currentFamillePage - 2)) + i;
                    if (pageNum > totalFamillePages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentFamillePage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentFamillePage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentFamillePage(prev => Math.min(totalFamillePages, prev + 1))}
                  disabled={currentFamillePage === totalFamillePages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}



      {/* Détails d'une famille sélectionnée */}
      {familleDetails && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">📦 Détails de la famille: {familleDetails.famille}</h3>
              <p className="text-gray-600 mt-1">
                Répartition par marques
              </p>
            </div>
            <button
              onClick={() => setSelectedFamilleDetails(null)}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Marque</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">CA 2024</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">CA 2025</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Progression</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {familleDetails.marques.map((marque) => (
                  <tr key={marque.marque} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{marque.marque}</td>
                    <td className="py-3 px-4 text-sm text-right text-gray-700">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(marque.ca2024)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-700">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(marque.ca2025)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span className={`font-medium ${marque.progression >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {marque.progression >= 0 ? '+' : ''}{marque.progression.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarquesSection;
