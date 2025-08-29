import React, { useState, useMemo } from 'react';
import { AdherentData } from '../types';
import { formatCurrency, formatPercentage, formatProgression } from '../utils/formatters';
import MagasinDetailModal from './MagasinDetailModal';

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
  const [selectedMagasin, setSelectedMagasin] = useState<{
    codeUnion: string;
    raisonSociale: string;
    groupeClient: string;
    adherentsData: AdherentData[];
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'progression' | 'regression'>('all');

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

  const handleMagasinClick = (codeUnion: string, groupeClient: string) => {
    const magasinData = adherentsData.filter(item => 
      item.codeUnion === codeUnion && item.groupeClient === groupeClient
    );
    
    if (magasinData.length > 0) {
      const raisonSociale = magasinData[0].raisonSociale;
      setSelectedMagasin({
        codeUnion,
        raisonSociale,
        groupeClient,
        adherentsData: magasinData
      });
    }
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
       <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl text-white p-6 shadow-2xl">
         <div className="flex items-center justify-between">
           <div className="animate-fadeInScale">
             <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent">
               👥 Analyse par Groupe Clients
             </h1>
             <p className="text-indigo-100 mt-2 text-lg">
               Vue consolidée des performances par groupe client, fournisseur, marque et famille
             </p>
           </div>
           <div className="text-right animate-fadeInScale animation-delay-200">
             <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
               <p className="text-3xl font-bold">{formatCurrency(
                 sortedGroupes.reduce((sum, g) => sum + g.ca2025, 0)
               )}</p>
               <p className="text-indigo-100 text-sm">CA Total 2025</p>
             </div>
           </div>
         </div>
       </div>

             {/* Statistiques globales */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="group bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 animate-fadeInScale">
           <div className="flex items-center">
             <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
               <span className="text-2xl">👥</span>
             </div>
             <div className="ml-4">
               <p className="text-sm font-medium text-indigo-700">Groupes Clients</p>
               <p className="text-3xl font-bold text-indigo-900">{sortedGroupes.length}</p>
             </div>
           </div>
         </div>

         <div className="group bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 animate-fadeInScale animation-delay-100">
           <div className="flex items-center">
             <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
               <span className="text-2xl">💰</span>
             </div>
             <div className="ml-4">
               <p className="text-sm font-medium text-green-700">CA Moyen par Groupe</p>
               <p className="text-3xl font-bold text-green-900">
                 {formatCurrency(sortedGroupes.length > 0 ? 
                   sortedGroupes.reduce((sum, g) => sum + g.ca2025, 0) / sortedGroupes.length : 0
                 )}
               </p>
             </div>
           </div>
         </div>

         <div className="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 animate-fadeInScale animation-delay-200">
           <div className="flex items-center">
             <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
               <span className="text-2xl">📈</span>
             </div>
             <div className="ml-4">
               <p className="text-sm font-medium text-purple-700">Progression Moyenne</p>
               <p className="text-3xl font-bold text-purple-900">
                 {formatPercentage(sortedGroupes.length > 0 ? 
                   sortedGroupes.reduce((sum, g) => sum + g.progression, 0) / sortedGroupes.length : 0
                 )}
               </p>
             </div>
           </div>
         </div>

         <div className="group bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 animate-fadeInScale animation-delay-300">
           <div className="flex items-center">
             <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
               <span className="text-2xl">🎯</span>
             </div>
             <div className="ml-4">
               <p className="text-sm font-medium text-orange-700">Top Groupe</p>
               <p className="text-2xl font-bold text-orange-900">
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

                                                       {/* Liste des clients du groupe */}
                            <div className="mt-6">
                              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                                🏪 Clients du groupe "{selectedGroupe}" ({groupe.adherents.size} adhérents)
                              </h4>
                              
                                                             {/* Filtres et recherche */}
                               <div className="mb-4 flex flex-wrap gap-3">
                                 <div className="flex-1 min-w-64">
                                   <input
                                     type="text"
                                     placeholder="🔍 Rechercher un client..."
                                     value={searchTerm}
                                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                     onChange={(e) => setSearchTerm(e.target.value)}
                                   />
                                 </div>
                                 <select 
                                   value={filterType}
                                   onChange={(e) => setFilterType(e.target.value as 'all' | 'progression' | 'regression')}
                                   className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                 >
                                   <option value="all">Tous les clients</option>
                                   <option value="progression">Progression positive</option>
                                   <option value="regression">Progression négative</option>
                                 </select>
                               </div>

                                                             <div className="bg-white rounded-lg border border-gray-200 p-4">
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                   {Array.from(groupe.adherents)
                                     .filter(codeUnion => {
                                       // Filtre par recherche
                                       if (searchTerm) {
                                         const clientData = adherentsData.find(item => 
                                           item.codeUnion === codeUnion && 
                                           item.groupeClient === selectedGroupe
                                         );
                                         const raisonSociale = clientData?.raisonSociale || '';
                                         if (!raisonSociale.toLowerCase().includes(searchTerm.toLowerCase()) &&
                                             !codeUnion.toLowerCase().includes(searchTerm.toLowerCase())) {
                                           return false;
                                         }
                                       }
                                       
                                       // Filtre par type de progression
                                       if (filterType !== 'all') {
                                         const clientData2025 = adherentsData.filter(item => 
                                           item.codeUnion === codeUnion && 
                                           item.annee === 2025 && 
                                           item.groupeClient === selectedGroupe
                                         );
                                         const clientData2024 = adherentsData.filter(item => 
                                           item.codeUnion === codeUnion && 
                                           item.annee === 2024 && 
                                           item.groupeClient === selectedGroupe
                                         );
                                         
                                         const ca2025 = clientData2025.reduce((sum, item) => sum + item.ca, 0);
                                         const ca2024 = clientData2024.reduce((sum, item) => sum + item.ca, 0);
                                         const progression = ca2024 > 0 ? ((ca2025 - ca2024) / ca2024) * 100 : 0;
                                         
                                         if (filterType === 'progression' && progression < 0) return false;
                                         if (filterType === 'regression' && progression >= 0) return false;
                                       }
                                       
                                       return true;
                                     })
                                     .map((codeUnion, index) => {
                                       // Calculer le CA total consolidé par client pour ce groupe
                                       const clientData2025 = adherentsData.filter(item => 
                                         item.codeUnion === codeUnion && 
                                         item.annee === 2025 && 
                                         item.groupeClient === selectedGroupe
                                       );
                                       const clientData2024 = adherentsData.filter(item => 
                                         item.codeUnion === codeUnion && 
                                         item.annee === 2024 && 
                                         item.groupeClient === selectedGroupe
                                       );
                                       
                                       // Somme des CA de toutes les lignes du client dans ce groupe
                                       const ca2025 = clientData2025.reduce((sum, item) => sum + item.ca, 0);
                                       const ca2024 = clientData2024.reduce((sum, item) => sum + item.ca, 0);
                                       const progression = ca2024 > 0 ? ((ca2025 - ca2024) / ca2024) * 100 : 0;
                                       
                                       // Prendre la raison sociale du premier enregistrement trouvé
                                       const raisonSociale = clientData2025[0]?.raisonSociale || 
                                                            clientData2024[0]?.raisonSociale || 
                                                            codeUnion;
                                       
                                       return (
                                         <div 
                                           key={codeUnion} 
                                           className="group bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl border border-gray-200 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                                           onClick={() => handleMagasinClick(codeUnion, selectedGroupe!)}
                                         >
                                           {/* Header avec numéro et nom */}
                                           <div className="flex items-center justify-between mb-3">
                                             <div className="flex items-center space-x-3">
                                               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm flex items-center justify-center font-bold shadow-lg">
                                                 {index + 1}
                                               </div>
                                               <div className="min-w-0 flex-1">
                                                 <div className="text-sm font-semibold text-gray-900 truncate" title={raisonSociale}>
                                                   {raisonSociale}
                                                 </div>
                                                 <div className="text-xs text-gray-500 font-mono">{codeUnion}</div>
                                               </div>
                                             </div>
                                           </div>

                                           {/* CA et progression */}
                                           <div className="space-y-3">
                                             <div className="grid grid-cols-2 gap-3">
                                               <div className="text-center p-2 bg-blue-50 rounded-lg">
                                                 <div className="text-xs text-gray-600 mb-1">CA 2025</div>
                                                 <div className="text-sm font-bold text-blue-900">{formatCurrency(ca2025)}</div>
                                               </div>
                                               <div className="text-center p-2 bg-green-50 rounded-lg">
                                                 <div className="text-xs text-gray-600 mb-1">CA 2024</div>
                                                 <div className="text-sm font-bold text-green-900">{formatCurrency(ca2024)}</div>
                                               </div>
                                             </div>
                                             
                                             {/* Progression avec indicateur visuel */}
                                             <div className="text-center">
                                               <div className="text-xs text-gray-600 mb-2">Progression</div>
                                               <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${
                                                 progression >= 0 
                                                   ? 'bg-green-100 text-green-800 border border-green-200' 
                                                   : 'bg-red-100 text-red-800 border border-red-200'
                                               }`}>
                                                 <span className="mr-1">
                                                   {progression >= 0 ? '↗️' : '↘️'}
                                                 </span>
                                                 {progression >= 0 ? '+' : ''}{progression.toFixed(1)}%
                                               </div>
                                             </div>
                                           </div>

                                           {/* Hover effect */}
                                           <div className="mt-3 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                             <div className="text-xs text-gray-500 text-center">
                                               💡 Cliquez pour plus de détails
                                             </div>
                                           </div>
                                         </div>
                                       );
                                     })}
                                 </div>
                               </div>
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

       {/* Modal de détail du magasin */}
       <MagasinDetailModal
         isOpen={!!selectedMagasin}
         onClose={() => setSelectedMagasin(null)}
         magasinData={selectedMagasin}
       />
     </div>
   );
 };

export default GroupeClientsSection;
