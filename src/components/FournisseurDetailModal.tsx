import React, { useState, useMemo } from 'react';
import { FournisseurPerformance, AdherentData, AdherentSummary } from '../types';
import CloseButton from './CloseButton';
import InteractionTracker from './InteractionTracker';
import MarqueModal from './MarqueModal';
import FamilleDetailModal from './FamilleDetailModal';
import MarqueAutocomplete from './MarqueAutocomplete';
import FamilleAutocomplete from './FamilleAutocomplete';

interface FournisseurDetailModalProps {
  fournisseur: FournisseurPerformance | null;
  allAdherentData: AdherentData[];
  isOpen: boolean;
  onClose: () => void;
  onClientClick: (client: AdherentSummary) => void;
  onMarqueClick?: (marque: string) => void;
}

interface FournisseurClientData {
  codeUnion: string;
  raisonSociale: string;
  groupeClient: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  pourcentageTotal: number;
}

interface FournisseurMarqueData {
  marque: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  clients: string[];
}

interface FournisseurFamilleData {
  sousFamille: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  pourcentageTotal: number;
}

const FournisseurDetailModal: React.FC<FournisseurDetailModalProps> = ({ 
  fournisseur, 
  allAdherentData, 
  isOpen, 
  onClose, 
  onClientClick,
  onMarqueClick
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'marques' | 'familles' | 'geographie' | 'interactions'>('overview');
  const [marqueFilter, setMarqueFilter] = useState<string>('');
  const [familleFilter, setFamilleFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMarque, setSelectedMarque] = useState<string | null>(null);
  const [selectedFamille, setSelectedFamille] = useState<string | null>(null);

  // Calculer les données détaillées du fournisseur
  const fournisseurData = useMemo(() => {
    if (!fournisseur) return null;

    const fournisseurData = allAdherentData.filter(item => item.fournisseur === fournisseur.fournisseur);
    
    // Calculer le nombre total de clients du Groupement Union
    const totalGroupementClients = new Set(allAdherentData.map(item => item.codeUnion)).size;
    
    // Performance par client
    const clientsMap = new Map<string, { ca2024: number; ca2025: number }>();
    fournisseurData.forEach(item => {
      if (!clientsMap.has(item.codeUnion)) {
        clientsMap.set(item.codeUnion, { ca2024: 0, ca2025: 0 });
      }
      const client = clientsMap.get(item.codeUnion)!;
      if (item.annee === 2024) client.ca2024 += item.ca;
      if (item.annee === 2025) client.ca2025 += item.ca;
    });

    const clientsPerformance: FournisseurClientData[] = Array.from(clientsMap.entries())
      .map(([codeUnion, data]) => {
        const progression = data.ca2024 > 0 ? ((data.ca2025 - data.ca2024) / data.ca2024) * 100 : 0;
        const totalCA = fournisseur.ca2024 + fournisseur.ca2025;
        const pourcentageTotal = totalCA > 0 ? ((data.ca2024 + data.ca2025) / totalCA) * 100 : 0;
        
        // Trouver la raison sociale et groupe client
        const clientInfo = fournisseurData.find(item => item.codeUnion === codeUnion);
        
        return {
          codeUnion,
          raisonSociale: clientInfo?.raisonSociale || 'N/A',
          groupeClient: clientInfo?.groupeClient || 'N/A',
          ca2024: data.ca2024,
          ca2025: data.ca2025,
          progression: Math.round(progression * 10) / 10,
          pourcentageTotal: Math.round(pourcentageTotal * 10) / 10
        };
      })
      .sort((a, b) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));

    // Performance par marque
    const marquesMap = new Map<string, { ca2024: number; ca2025: number; clients: Set<string> }>();
    fournisseurData.forEach(item => {
      if (!marquesMap.has(item.marque)) {
        marquesMap.set(item.marque, { ca2024: 0, ca2025: 0, clients: new Set() });
      }
      const marque = marquesMap.get(item.marque)!;
      if (item.annee === 2024) marque.ca2024 += item.ca;
      if (item.annee === 2025) marque.ca2025 += item.ca;
      marque.clients.add(item.codeUnion);
    });

    const marquesPerformance: FournisseurMarqueData[] = Array.from(marquesMap.entries())
      .map(([marque, data]) => {
        const progression = data.ca2024 > 0 ? ((data.ca2025 - data.ca2024) / data.ca2024) * 100 : 0;
        return {
          marque,
          ca2024: data.ca2024,
          ca2025: data.ca2025,
          progression: Math.round(progression * 10) / 10,
          clients: Array.from(data.clients)
        };
      })
      .sort((a, b) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));

    // Performance par famille
    const famillesMap = new Map<string, { ca2024: number; ca2025: number }>();
    fournisseurData.forEach(item => {
      if (!famillesMap.has(item.sousFamille)) {
        famillesMap.set(item.sousFamille, { ca2024: 0, ca2025: 0 });
      }
      const famille = famillesMap.get(item.sousFamille)!;
      if (item.annee === 2024) famille.ca2024 += item.ca;
      if (item.annee === 2025) famille.ca2025 += item.ca;
    });

    const famillesPerformance: FournisseurFamilleData[] = Array.from(famillesMap.entries())
      .map(([sousFamille, data]) => {
        const progression = data.ca2024 > 0 ? ((data.ca2025 - data.ca2024) / data.ca2024) * 100 : 0;
        const totalCA = fournisseur.ca2024 + fournisseur.ca2025;
        const pourcentageTotal = totalCA > 0 ? ((data.ca2024 + data.ca2025) / totalCA) * 100 : 0;
        
        return {
          sousFamille,
          ca2024: data.ca2024,
          ca2025: data.ca2025,
          progression: Math.round(progression * 10) / 10,
          pourcentageTotal: Math.round(pourcentageTotal * 10) / 10
        };
      })
      .sort((a, b) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));

    // Calculer le nombre de clients du fournisseur
    const fournisseurClients = clientsMap.size;

    // Calculer les pourcentages de cotation globale
    const totalCA2024 = allAdherentData
      .filter(item => item.annee === 2024)
      .reduce((sum, item) => sum + item.ca, 0);
    
    const totalCA2025 = allAdherentData
      .filter(item => item.annee === 2025)
      .reduce((sum, item) => sum + item.ca, 0);
    
    const pourcentageCA2024 = totalCA2024 > 0 ? (fournisseur.ca2024 / totalCA2024) * 100 : 0;
    const pourcentageCA2025 = totalCA2025 > 0 ? (fournisseur.ca2025 / totalCA2025) * 100 : 0;

    return {
      clientsPerformance,
      marquesPerformance,
      famillesPerformance,
      totalGroupementClients,
      fournisseurClients,
      pourcentageCA2024: Math.round(pourcentageCA2024 * 10) / 10,
      pourcentageCA2025: Math.round(pourcentageCA2025 * 10) / 10
    };
  }, [fournisseur, allAdherentData]);

  if (!isOpen || !fournisseur || !fournisseurData) return null;

  const getStatusIcon = (progression: number) => {
    if (progression > 5) return '📈';
    if (progression < -5) return '📉';
    return '➡️';
  };

  const getStatusColor = (progression: number) => {
    if (progression > 5) return 'text-green-600';
    if (progression < -5) return 'text-red-600';
    return 'text-yellow-600';
  };

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', shortLabel: 'Vue' },
    { id: 'clients', label: 'Clients', shortLabel: 'Clients' },
    { id: 'marques', label: 'Marques', shortLabel: 'Marques' },
    { id: 'familles', label: 'Familles', shortLabel: 'Familles' },
    { id: 'geographie', label: 'Géographie', shortLabel: 'Géo' },
    { id: 'interactions', label: 'Interactions', shortLabel: 'Int' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">🏢 {fournisseur.fournisseur}</h2>
              <p className="text-purple-100 text-sm sm:text-base">
                Performance détaillée et analyse client
              </p>
            </div>
            <CloseButton onClose={onClose} size="md" />
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap gap-2 px-4 sm:px-6 py-2 bg-gray-50 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-3 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          ))}
        </nav>

        {/* Filtres de recherche */}
        <div className="bg-white border-b border-gray-200 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Recherche globale */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🔍 Recherche</label>
              <input
                type="text"
                placeholder="Client, marque ou famille..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtre par marque */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🏷️ Marque</label>
              <MarqueAutocomplete
                value={marqueFilter}
                onChange={setMarqueFilter}
                onSelect={setMarqueFilter}
                adherentData={allAdherentData}
                placeholder="Rechercher une marque..."
                className="w-full"
              />
            </div>

            {/* Filtre par famille */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">📦 Famille</label>
              <FamilleAutocomplete
                value={familleFilter}
                onChange={setFamilleFilter}
                onSelect={setFamilleFilter}
                adherentData={allAdherentData}
                placeholder="Rechercher une famille..."
                className="w-full"
              />
            </div>
          </div>

          {/* Boutons de réinitialisation */}
          {(searchTerm || marqueFilter || familleFilter) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  ✕ Recherche
                </button>
              )}
              {marqueFilter && (
                <button
                  onClick={() => setMarqueFilter('')}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  ✕ Marque
                </button>
              )}
              {familleFilter && (
                <button
                  onClick={() => setFamilleFilter('')}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  ✕ Famille
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Vue d'ensemble */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">📊 Vue d'ensemble</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                  <div className="text-3xl font-bold">{fournisseur.ca2024.toLocaleString('fr-FR')}€</div>
                  <div className="text-blue-100">CA 2024</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
                  <div className="text-3xl font-bold">{fournisseur.ca2025.toLocaleString('fr-FR')}€</div>
                  <div className="text-green-100">CA 2025</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                  <div className="text-3xl font-bold">{fournisseur.progression >= 0 ? '+' : ''}{fournisseur.progression.toFixed(1)}%</div>
                  <div className="text-purple-100">Progression</div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl">
                  <div className="text-3xl font-bold">{fournisseurData.fournisseurClients}</div>
                  <div className="text-orange-100">Clients Fournisseur</div>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-xl">
                  <div className="text-3xl font-bold">{fournisseurData.totalGroupementClients}</div>
                  <div className="text-indigo-100">Clients Groupement</div>
                </div>
                <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white p-6 rounded-xl">
                  <div className="text-3xl font-bold">{fournisseurData.pourcentageCA2024}%</div>
                  <div className="text-teal-100">Cotation 2024</div>
                </div>
                <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white p-6 rounded-xl">
                  <div className="text-3xl font-bold">{fournisseurData.pourcentageCA2025}%</div>
                  <div className="text-pink-100">Cotation 2025</div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">📈 Évolution du CA</h4>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{fournisseur.ca2024.toLocaleString('fr-FR')}€</div>
                    <div className="text-gray-500">2024</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{fournisseur.ca2025.toLocaleString('fr-FR')}€</div>
                    <div className="text-gray-500">2025</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clients - Mobile Optimized */}
          {activeTab === 'clients' && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">👥 Performance par Client</h3>
              
                             {/* Mode Carte pour Mobile */}
               <div className="space-y-3 sm:hidden">
                 {fournisseurData.clientsPerformance.map((item, index) => (
                   <div 
                     key={item.codeUnion} 
                     className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer hover:bg-blue-50"
                     onClick={() => {
                       const statut: 'progression' | 'regression' | 'stable' = 
                         item.progression > 5 ? 'progression' : 
                         item.progression < -5 ? 'regression' : 'stable';
                       
                       const clientSummary: AdherentSummary = {
                         codeUnion: item.codeUnion,
                         raisonSociale: item.raisonSociale,
                         groupeClient: item.groupeClient,
                         ca2024: item.ca2024,
                         ca2025: item.ca2025,
                         progression: item.progression,
                         statut
                       };
                       onClientClick(clientSummary);
                     }}
                   >
                     <div className="flex items-center justify-between mb-3">
                       <div className="flex items-center space-x-3">
                         <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-bold">
                           {index + 1}
                         </div>
                         <div>
                           <div className="font-semibold text-gray-900 text-sm">{item.raisonSociale}</div>
                           <div className="text-gray-500 text-xs">{item.groupeClient}</div>
                         </div>
                       </div>
                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                         item.progression > 5 ? 'bg-green-100 text-green-800' :
                         item.progression < -5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                       }`}>
                         {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{item.progression.toFixed(1)}%
                       </span>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                       <div className="text-center">
                         <div className="text-gray-500 text-xs">CA 2024</div>
                         <div className="font-semibold text-gray-900">
                           {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2024)}
                         </div>
                       </div>
                       <div className="text-center">
                         <div className="text-gray-500 text-xs">CA 2025</div>
                         <div className="font-semibold text-gray-900">
                           {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                         </div>
                       </div>
                     </div>
                     
                     <div className="pt-3 border-t border-gray-100">
                       <div className="text-center">
                         <div className="text-gray-500 text-xs">Part du CA total</div>
                         <div className="font-semibold text-blue-600">{item.pourcentageTotal}%</div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
              
              {/* Mode Tableau pour Desktop */}
              <div className="hidden sm:block">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Groupe</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2024</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2025</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Total</th>
                        </tr>
                      </thead>
                                             <tbody className="bg-white divide-y divide-gray-200">
                         {fournisseurData.clientsPerformance.map((item, index) => (
                           <tr 
                             key={item.codeUnion} 
                             className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 cursor-pointer transition-colors`}
                             onClick={() => {
                               const statut: 'progression' | 'regression' | 'stable' = 
                                 item.progression > 5 ? 'progression' : 
                                 item.progression < -5 ? 'regression' : 'stable';
                               
                               const clientSummary: AdherentSummary = {
                                 codeUnion: item.codeUnion,
                                 raisonSociale: item.raisonSociale,
                                 groupeClient: item.groupeClient,
                                 ca2024: item.ca2024,
                                 ca2025: item.ca2025,
                                 progression: item.progression,
                                 statut
                               };
                               onClientClick(clientSummary);
                             }}
                           >
                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.raisonSociale}</td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.groupeClient}</td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                               {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2024)}
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                               {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                             </td>
                             <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${getStatusColor(item.progression)}`}>
                               {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{item.progression.toFixed(1)}%
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{item.pourcentageTotal}%</td>
                           </tr>
                         ))}
                       </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Marques - Mobile Optimized */}
          {activeTab === 'marques' && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">🏷️ Performance par Marque</h3>
              
                             {/* Mode Carte pour Mobile */}
               <div className="space-y-3 sm:hidden">
                 {fournisseurData.marquesPerformance.map((item, index) => (
                   <div 
                     key={item.marque} 
                     className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer hover:bg-purple-50"
                     onClick={() => setSelectedMarque(item.marque)}
                   >
                     <div className="flex items-center justify-between mb-3">
                       <div className="flex items-center space-x-3">
                         <div className="w-8 h-8 rounded-full bg-purple-500 text-white text-sm flex items-center justify-center font-bold">
                           {index + 1}
                         </div>
                         <span className="font-semibold text-gray-900 text-sm sm:text-base">{item.marque}</span>
                       </div>
                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                         item.progression > 5 ? 'bg-green-100 text-green-800' :
                         item.progression < -5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                       }`}>
                         {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{item.progression.toFixed(1)}%
                       </span>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                       <div className="text-center">
                         <div className="text-gray-500 text-xs">CA 2024</div>
                         <div className="font-semibold text-gray-900">
                           {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2024)}
                         </div>
                       </div>
                       <div className="text-center">
                         <div className="text-gray-500 text-xs">CA 2025</div>
                         <div className="font-semibold text-gray-900">
                           {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                         </div>
                       </div>
                     </div>
                     
                     <div className="pt-3 border-t border-gray-100">
                       <div className="text-center">
                         <div className="text-gray-500 text-xs">Clients associés</div>
                         <div className="font-semibold text-purple-600">{item.clients.length}</div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
              
              {/* Mode Tableau pour Desktop */}
              <div className="hidden sm:block">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marque</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2024</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2025</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Clients</th>
                        </tr>
                      </thead>
                                             <tbody className="bg-white divide-y divide-gray-200">
                         {fournisseurData.marquesPerformance.map((item, index) => (
                           <tr 
                             key={item.marque} 
                             className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-purple-50 cursor-pointer transition-colors`}
                             onClick={() => setSelectedMarque(item.marque)}
                           >
                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.marque}</td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                               {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2024)}
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                               {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                             </td>
                             <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${getStatusColor(item.progression)}`}>
                               {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{item.progression.toFixed(1)}%
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{item.clients.length}</td>
                           </tr>
                         ))}
                       </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Familles - Mobile Optimized */}
          {activeTab === 'familles' && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">📦 Performance par Famille de Produits</h3>
              
              {/* Mode Carte pour Mobile */}
              <div className="space-y-3 sm:hidden">
                {fournisseurData.famillesPerformance.map((item, index) => (
                  <div 
                    key={item.sousFamille} 
                    className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer hover:bg-orange-50"
                    onClick={() => setSelectedFamille(item.sousFamille)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-orange-500 text-white text-sm flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">{item.sousFamille}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.progression > 5 ? 'bg-green-100 text-green-800' :
                        item.progression < -5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{item.progression.toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">CA 2024</div>
                        <div className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2024)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">CA 2025</div>
                        <div className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-100">
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">Part du CA total</div>
                        <div className="font-semibold text-blue-600">{item.pourcentageTotal}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Mode Tableau pour Desktop */}
              <div className="hidden sm:block">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Famille</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2024</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2025</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {fournisseurData.famillesPerformance.map((item, index) => (
                          <tr 
                           key={item.sousFamille} 
                           className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-orange-50 cursor-pointer transition-colors`}
                           onClick={() => setSelectedFamille(item.sousFamille)}
                         >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.sousFamille}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2024)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${getStatusColor(item.progression)}`}>
                              {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{Math.round(item.progression * 10) / 10}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{item.pourcentageTotal}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Géographie - Mobile Optimized */}
          {activeTab === 'geographie' && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">🌍 Répartition Géographique</h3>
              
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                <div className="text-center text-gray-500 py-6 sm:py-8">
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🗺️</div>
                  <div className="text-base sm:text-lg">Carte géographique en cours de développement</div>
                  <div className="text-xs sm:text-sm">Visualisation par région commerciale à venir</div>
                </div>
              </div>
            </div>
          )}

          {/* Interactions - CRM Module */}
          {activeTab === 'interactions' && (
            <div className="space-y-4 sm:space-y-6">
              <InteractionTracker fournisseur={fournisseur.fournisseur} />
            </div>
          )}
        </div>
      </div>

      {/* Modal Marque Detail */}
      {selectedMarque && (
        <MarqueModal
          marque={selectedMarque}
          fournisseur={fournisseur.fournisseur}
          allAdherentData={allAdherentData}
          isOpen={!!selectedMarque}
          onClose={() => setSelectedMarque(null)}
          onFamilleClick={(famille: string) => {
            setSelectedMarque(null);
            setSelectedFamille(famille);
          }}
        />
      )}

      {/* Modal Famille Detail */}
      {selectedFamille && (
        <FamilleDetailModal
          famille={selectedFamille}
          fournisseur={fournisseur.fournisseur}
          allAdherentData={allAdherentData}
          isOpen={!!selectedFamille}
          onClose={() => setSelectedFamille(null)}
          onMarqueClick={(marque) => {
            setSelectedFamille(null);
            setSelectedMarque(marque);
          }}
        />
      )}
    </div>
  );
};

export default FournisseurDetailModal;
