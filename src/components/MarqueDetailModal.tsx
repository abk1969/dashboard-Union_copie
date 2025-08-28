import React, { useState, useMemo } from 'react';
import { AdherentData } from '../types';
import CloseButton from './CloseButton';

interface MarqueDetailModalProps {
  marque: string;
  fournisseur: string;
  allAdherentData: AdherentData[];
  isOpen: boolean;
  onClose: () => void;
  onFamilleClick?: (famille: string) => void;
}

interface MarqueFamilleData {
  sousFamille: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  pourcentageTotal: number;
  clients: string[];
}

interface MarqueClientData {
  codeUnion: string;
  raisonSociale: string;
  groupeClient: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  pourcentageTotal: number;
}

const MarqueDetailModal: React.FC<MarqueDetailModalProps> = ({ 
  marque, 
  fournisseur,
  allAdherentData, 
  isOpen, 
  onClose,
  onFamilleClick
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'familles' | 'clients'>('overview');

  // Calculer les données détaillées de la marque
  const marqueData = useMemo(() => {
    if (!marque || !fournisseur) return null;

    const marqueData = allAdherentData.filter(item => 
      item.fournisseur === fournisseur && item.marque === marque
    );
    
    // Performance par famille
    const famillesMap = new Map<string, { ca2024: number; ca2025: number; clients: Set<string> }>();
    marqueData.forEach(item => {
      if (!famillesMap.has(item.sousFamille)) {
        famillesMap.set(item.sousFamille, { ca2024: 0, ca2025: 0, clients: new Set() });
      }
      const famille = famillesMap.get(item.sousFamille)!;
      if (item.annee === 2024) famille.ca2024 += item.ca;
      if (item.annee === 2025) famille.ca2025 += item.ca;
      famille.clients.add(item.codeUnion);
    });

    const famillesPerformance: MarqueFamilleData[] = Array.from(famillesMap.entries())
      .map(([sousFamille, data]) => {
        const progression = data.ca2024 > 0 ? ((data.ca2025 - data.ca2024) / data.ca2024) * 100 : 0;
        const totalCA = marqueData.reduce((sum, item) => sum + item.ca, 0);
        const pourcentageTotal = totalCA > 0 ? ((data.ca2024 + data.ca2025) / totalCA) * 100 : 0;
        
        return {
          sousFamille,
          ca2024: data.ca2024,
          ca2025: data.ca2025,
          progression: Math.round(progression * 10) / 10,
          pourcentageTotal: Math.round(pourcentageTotal * 10) / 10,
          clients: Array.from(data.clients)
        };
      })
      .sort((a, b) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));

    // Performance par client
    const clientsMap = new Map<string, { ca2024: number; ca2025: number }>();
    marqueData.forEach(item => {
      if (!clientsMap.has(item.codeUnion)) {
        clientsMap.set(item.codeUnion, { ca2024: 0, ca2025: 0 });
      }
      const client = clientsMap.get(item.codeUnion)!;
      if (item.annee === 2024) client.ca2024 += item.ca;
      if (item.annee === 2025) client.ca2025 += item.ca;
    });

    const clientsPerformance: MarqueClientData[] = Array.from(clientsMap.entries())
      .map(([codeUnion, data]) => {
        const progression = data.ca2024 > 0 ? ((data.ca2025 - data.ca2024) / data.ca2024) * 100 : 0;
        const totalCA = marqueData.reduce((sum, item) => sum + item.ca, 0);
        const pourcentageTotal = totalCA > 0 ? ((data.ca2024 + data.ca2025) / totalCA) * 100 : 0;
        
        // Trouver la raison sociale et groupe client
        const clientInfo = marqueData.find(item => item.codeUnion === codeUnion);
        
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

    // Statistiques globales
    const totalCA2024 = marqueData.filter(item => item.annee === 2024).reduce((sum, item) => sum + item.ca, 0);
    const totalCA2025 = marqueData.filter(item => item.annee === 2025).reduce((sum, item) => sum + item.ca, 0);
    const progression = totalCA2024 > 0 ? ((totalCA2025 - totalCA2024) / totalCA2024) * 100 : 0;
    const totalClients = new Set(marqueData.map(item => item.codeUnion)).size;
    const totalFamilles = new Set(marqueData.map(item => item.sousFamille)).size;

    return {
      famillesPerformance,
      clientsPerformance,
      totalCA2024,
      totalCA2025,
      progression: Math.round(progression * 10) / 10,
      totalClients,
      totalFamilles
    };
  }, [marque, fournisseur, allAdherentData]);

  if (!isOpen || !marque || !marqueData) return null;

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
    { id: 'familles', label: 'Familles', shortLabel: 'Familles' },
    { id: 'clients', label: 'Clients', shortLabel: 'Clients' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">🏷️ {marque}</h2>
              <p className="text-purple-100 text-sm sm:text-base">
                Fournisseur: {fournisseur} • Analyse détaillée de la marque
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
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Vue d'ensemble */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">📊 Vue d'ensemble de {marque}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                  <div className="text-3xl font-bold">{marqueData.totalCA2024.toLocaleString('fr-FR')}€</div>
                  <div className="text-blue-100">CA 2024</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
                  <div className="text-3xl font-bold">{marqueData.totalCA2025.toLocaleString('fr-FR')}€</div>
                  <div className="text-green-100">CA 2025</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                  <div className="text-3xl font-bold">{marqueData.progression >= 0 ? '+' : ''}{marqueData.progression.toFixed(1)}%</div>
                  <div className="text-purple-100">Progression</div>
                </div>
                <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white p-6 rounded-xl">
                  <div className="text-3xl font-bold">{marqueData.totalClients}</div>
                  <div className="text-pink-100">Clients</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">📈 Évolution du CA</h4>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{marqueData.totalCA2024.toLocaleString('fr-FR')}€</div>
                      <div className="text-gray-500">2024</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{marqueData.totalCA2025.toLocaleString('fr-FR')}€</div>
                      <div className="text-gray-500">2025</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">🏗️ Répartition</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{marqueData.totalFamilles}</div>
                      <div className="text-gray-500">Familles</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-pink-600">{marqueData.totalClients}</div>
                      <div className="text-gray-500">Clients</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Familles */}
          {activeTab === 'familles' && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">📦 Familles de {marque}</h3>
              
              {/* Mode Carte pour Mobile */}
              <div className="space-y-3 sm:hidden">
                {marqueData.famillesPerformance.map((item, index) => (
                  <div 
                    key={item.sousFamille} 
                    className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer hover:bg-orange-50"
                    onClick={() => onFamilleClick?.(item.sousFamille)}
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
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-gray-500 text-xs">Part du CA</div>
                          <div className="font-semibold text-blue-600">{item.pourcentageTotal.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Clients</div>
                          <div className="font-semibold text-orange-600">{item.clients.length}</div>
                        </div>
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
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Clients</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {marqueData.famillesPerformance.map((item, index) => (
                          <tr 
                            key={item.sousFamille} 
                            className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-orange-50 cursor-pointer transition-colors`}
                            onClick={() => onFamilleClick?.(item.sousFamille)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.sousFamille}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2024)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${getStatusColor(item.progression)}`}>
                              {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{item.progression.toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{item.pourcentageTotal.toFixed(1)}%</td>
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

          {/* Clients */}
          {activeTab === 'clients' && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">👥 Clients de {marque}</h3>
              
              {/* Mode Carte pour Mobile */}
              <div className="space-y-3 sm:hidden">
                {marqueData.clientsPerformance.map((item, index) => (
                  <div key={item.codeUnion} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
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
                        <div className="font-semibold text-blue-600">{item.pourcentageTotal.toFixed(1)}%</div>
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
                        {marqueData.clientsPerformance.map((item, index) => (
                          <tr key={item.codeUnion} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{item.pourcentageTotal.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarqueDetailModal;
