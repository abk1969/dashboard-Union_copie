import React, { useState, useMemo } from 'react';
import { AdherentSummary, AdherentData } from '../types';
import RevenueChart from './RevenueChart';
import ClientExport from './ClientExport';
import CloseButton from './CloseButton';

interface ClientDetailModalProps {
  client: AdherentSummary | null;
  allAdherentData: AdherentData[];
  isOpen: boolean;
  onClose: () => void;
}

interface ClientPerformanceData {
  fournisseur: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  pourcentageTotal: number;
  pourcentage2024: number;
  pourcentage2025: number;
}

interface ClientMarqueData {
  marque: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  fournisseurs: string[];
}

interface ClientFamilleData {
  famille: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  pourcentageTotal: number;
}

interface ClientMarqueMultiFournisseurData {
  marque: string;
  fournisseur: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  pourcentageMarque: number;
}

const ClientDetailModal: React.FC<ClientDetailModalProps> = ({ 
  client, 
  allAdherentData, 
  isOpen, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'fournisseurs' | 'marques' | 'marquesMulti' | 'familles' | 'timeline'>('overview');
  const [showExportModal, setShowExportModal] = useState(false);
  
  // États pour les filtres des Marques Multi-Fournisseurs
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarque, setSelectedMarque] = useState('');
  const [selectedFournisseur, setSelectedFournisseur] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('all');
  const [caMin, setCaMin] = useState('');
  const [caMax, setCaMax] = useState('');

  // Calculer les données détaillées du client
  const clientData = useMemo(() => {
    if (!client) return null;

    const clientData = allAdherentData.filter(item => item.codeUnion === client.codeUnion);
    
    // Performance par fournisseur
    const fournisseursMap = new Map<string, { ca2024: number; ca2025: number }>();
    clientData.forEach(item => {
      if (!fournisseursMap.has(item.fournisseur)) {
        fournisseursMap.set(item.fournisseur, { ca2024: 0, ca2025: 0 });
      }
      const fournisseur = fournisseursMap.get(item.fournisseur)!;
      if (item.annee === 2024) fournisseur.ca2024 += item.ca;
      if (item.annee === 2025) fournisseur.ca2025 += item.ca;
    });

    // Calculer le total CA 2025 du client à partir des données réelles
    const totalCA2025Client = clientData
      .filter(item => item.annee === 2025)
      .reduce((sum, item) => sum + item.ca, 0);

    const fournisseursPerformance: ClientPerformanceData[] = Array.from(fournisseursMap.entries())
      .map(([fournisseur, data]) => {
        const progression = data.ca2024 > 0 ? ((data.ca2025 - data.ca2024) / data.ca2024) * 100 : 0;
        const pourcentageTotal = client.ca2025 > 0 ? (data.ca2025 / client.ca2025) * 100 : 0;
        const pourcentage2024 = client.ca2024 > 0 ? (data.ca2024 / client.ca2024) * 100 : 0;
        const pourcentage2025 = client.ca2025 > 0 ? (data.ca2025 / client.ca2025) * 100 : 0;
        
        return {
          fournisseur,
          ca2024: data.ca2024,
          ca2025: data.ca2025,
          progression: Math.round(progression * 10) / 10,
          pourcentageTotal: Math.round(pourcentageTotal * 10) / 10,
          pourcentage2024: Math.round(pourcentage2024 * 10) / 10,
          pourcentage2025: Math.round(pourcentage2025 * 10) / 10
        };
      })
      .sort((a, b) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));

    // Performance par marque
    const marquesMap = new Map<string, { ca2024: number; ca2025: number; fournisseurs: Set<string> }>();
    clientData.forEach(item => {
      if (!marquesMap.has(item.marque)) {
        marquesMap.set(item.marque, { ca2024: 0, ca2025: 0, fournisseurs: new Set() });
      }
      const marque = marquesMap.get(item.marque)!;
      if (item.annee === 2024) marque.ca2024 += item.ca;
      if (item.annee === 2025) marque.ca2025 += item.ca;
      marque.fournisseurs.add(item.fournisseur);
    });

    const marquesPerformance: ClientMarqueData[] = Array.from(marquesMap.entries())
      .map(([marque, data]) => {
        const progression = data.ca2024 > 0 ? ((data.ca2025 - data.ca2024) / data.ca2024) * 100 : 0;
        
        return {
          marque,
          ca2024: data.ca2024,
          ca2025: data.ca2025,
          progression: Math.round(progression * 10) / 10,
          fournisseurs: Array.from(data.fournisseurs)
        };
      })
      .sort((a, b) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));

    // Performance par famille
    const famillesMap = new Map<string, { ca2024: number; ca2025: number }>();
    clientData.forEach(item => {
      if (!famillesMap.has(item.sousFamille)) {
        famillesMap.set(item.sousFamille, { ca2024: 0, ca2025: 0 });
      }
      const famille = famillesMap.get(item.sousFamille)!;
      if (item.annee === 2024) famille.ca2024 += item.ca;
      if (item.annee === 2025) famille.ca2025 += item.ca;
    });

    const famillesPerformance: ClientFamilleData[] = Array.from(famillesMap.entries())
      .map(([famille, data]) => {
        const progression = data.ca2024 > 0 ? ((data.ca2025 - data.ca2024) / data.ca2024) * 100 : 0;
        const pourcentageTotal = totalCA2025Client > 0 ? ((data.ca2025) / totalCA2025Client) * 100 : 0;
        
        return {
          famille,
          ca2024: data.ca2024,
          ca2025: data.ca2025,
          progression: Math.round(progression * 10) / 10,
          pourcentageTotal: Math.round(pourcentageTotal * 10) / 10
        };
      })
      .sort((a, b) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));

    // Marques Multi-Fournisseurs - Détail par fournisseur pour chaque marque
    const marquesMultiFournisseursMap = new Map<string, { ca2024: number; ca2025: number }>();
    
    // Grouper par marque + fournisseur
    clientData.forEach(item => {
      const key = `${item.marque}-${item.fournisseur}`;
      if (!marquesMultiFournisseursMap.has(key)) {
        marquesMultiFournisseursMap.set(key, { ca2024: 0, ca2025: 0 });
      }
      const data = marquesMultiFournisseursMap.get(key)!;
      if (item.annee === 2024) data.ca2024 += item.ca;
      if (item.annee === 2025) data.ca2025 += item.ca;
    });

    // Convertir en tableau avec calculs corrects
    const marquesMultiFournisseurs: ClientMarqueMultiFournisseurData[] = Array.from(marquesMultiFournisseursMap.entries())
      .map(([key, data]) => {
        const [marque, fournisseur] = key.split('-');
        const progression = data.ca2024 > 0 ? ((data.ca2025 - data.ca2024) / data.ca2024) * 100 : 0;
        
        // Calculer le total de la marque pour ce client (2025 uniquement)
        const totalMarque2025 = clientData
          .filter(d => d.marque === marque && d.annee === 2025)
          .reduce((sum, d) => sum + d.ca, 0);
        
        const pourcentageMarque = totalMarque2025 > 0 ? (data.ca2025 / totalMarque2025) * 100 : 0;
        
        return {
          marque,
          fournisseur,
          ca2024: data.ca2024,
          ca2025: data.ca2025,
          progression: Math.round(progression * 10) / 10,
          pourcentageMarque: Math.round(pourcentageMarque * 10) / 10
        };
      })
      .sort((a, b) => {
        if (a.marque !== b.marque) return a.marque.localeCompare(b.marque);
        return b.ca2024 + b.ca2025 - (a.ca2024 + a.ca2025);
      });

    return {
      fournisseursPerformance,
      marquesPerformance,
      famillesPerformance,
      marquesMultiFournisseurs,
      totalTransactions: clientData.length,
      uniqueFournisseurs: fournisseursMap.size,
      uniqueMarques: marquesMap.size,
      uniqueFamilles: famillesMap.size
    };
  }, [client, allAdherentData]);

  if (!isOpen || !client || !clientData) return null;

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">{client.raisonSociale}</h2>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-xl">🏢 {client.codeUnion}</span>
                <span className="text-lg">👥 {client.groupeClient}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  client.statut === 'progression' ? 'bg-green-500' : 
                  client.statut === 'regression' ? 'bg-red-500' : 'bg-yellow-500'
                }`}>
                  {client.statut === 'progression' ? '📈 Progression' : 
                   client.statut === 'regression' ? '📉 Régression' : '→ Stable'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors font-medium"
              >
                📄 Export Avancé
              </button>
                           <CloseButton onClose={onClose} size="md" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Mobile Optimized */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex flex-wrap gap-2 px-4 sm:px-6 py-2">
            {[
              { id: 'overview', label: '🏠 Vue d\'ensemble', icon: '📊', shortLabel: 'Vue' },
              { id: 'fournisseurs', label: '🏢 Fournisseurs', icon: '📈', shortLabel: 'Fourn.' },
              { id: 'marques', label: '🏷️ Marques', icon: '🎯', shortLabel: 'Marques' },
              { id: 'marquesMulti', label: '🔄 Marques Multi-Fournisseurs', icon: '🔗', shortLabel: 'Multi' },
              { id: 'familles', label: '📦 Familles', icon: '📋', shortLabel: 'Familles' },
              { id: 'timeline', label: '⏰ Timeline', icon: '📅', shortLabel: 'Timeline' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-3 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span className="hidden sm:inline">{tab.icon} {tab.label}</span>
                <span className="sm:hidden">{tab.icon} {tab.shortLabel}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Vue d'ensemble */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                  <div className="text-blue-600 text-2xl mb-2">💰</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2024)}
                  </div>
                  <div className="text-blue-600 font-medium">CA 2024 (jan-juin)</div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                  <div className="text-green-600 text-2xl mb-2">📊</div>
                  <div className="text-2xl font-bold text-green-900">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2025)}
                  </div>
                  <div className="text-green-600 font-medium">CA 2025 (jan-juin)</div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                  <div className="text-purple-600 text-2xl mb-2">📈</div>
                  <div className={`text-2xl font-bold ${getStatusColor(client.progression)}`}>
                    {getStatusIcon(client.progression)} {client.progression >= 0 ? '+' : ''}{Math.round(client.progression * 10) / 10}%
                  </div>
                  <div className="text-purple-600 font-medium">Progression</div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                  <div className="text-orange-600 text-2xl mb-2">🏆</div>
                  <div className="text-2xl font-bold text-orange-900">
                    {clientData.totalTransactions}
                  </div>
                  <div className="text-orange-600 font-medium">Transactions</div>
                </div>
              </div>

              {/* Statistiques détaillées */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🏢 Fournisseurs</h3>
                  <div className="space-y-3">
                    {clientData.fournisseursPerformance.slice(0, 5).map((item, index) => (
                      <div key={item.fournisseur} className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">{item.fournisseur}</span>
                        <span className={`font-bold ${getStatusColor(item.progression)}`}>
                          {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{Math.round(item.progression * 10) / 10}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🏷️ Top Marques</h3>
                  <div className="space-y-3">
                    {clientData.marquesPerformance.slice(0, 5).map((item, index) => (
                      <div key={item.marque} className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">{item.marque}</span>
                        <span className={`font-bold ${getStatusColor(item.progression)}`}>
                          {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{Math.round(item.progression * 10) / 10}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">📦 Top Familles</h3>
                  <div className="space-y-3">
                    {clientData.famillesPerformance.slice(0, 5).map((item, index) => (
                      <div key={item.famille} className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">{item.famille}</span>
                        <span className={`font-bold ${getStatusColor(item.progression)}`}>
                          {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{Math.round(item.progression * 10) / 10}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fournisseurs - Mobile Optimized */}
          {activeTab === 'fournisseurs' && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">🏢 Performance par Fournisseur</h3>
              
              {/* Mode Carte pour Mobile */}
              <div className="space-y-3 sm:hidden">
                {clientData.fournisseursPerformance.map((item, index) => (
                  <div key={item.fournisseur} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">{item.fournisseur}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.progression > 5 ? 'bg-green-100 text-green-800' :
                        item.progression < -5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{item.progression.toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
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
                    
                    <div className="mt-3 pt-3 border-t border-gray-100">
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseur</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2024</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2025</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% 2025</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {clientData.fournisseursPerformance.map((item, index) => (
                          <tr key={item.fournisseur} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.fournisseur}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2024)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${getStatusColor(item.progression)}`}>
                              {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{Math.round(item.progression * 10) / 10}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{item.pourcentage2025}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Graphique */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Répartition par Fournisseur (2025)</h4>
                  {(() => {
                    const chartData = clientData.fournisseursPerformance.map(item => ({
                      fournisseur: item.fournisseur,
                      ca2024: item.ca2024,
                      ca2025: item.ca2025,
                      pourcentageTotal: item.pourcentage2025,
                      progression: item.progression,
                      pourcentage2024: item.pourcentage2024,
                      pourcentage2025: item.pourcentage2025
                    }));
                    return (
                      <RevenueChart
                        data={chartData}
                        type="doughnut"
                        title=""
                        chartType="fournisseur"
                      />
                    );
                  })()}
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
                {clientData.marquesPerformance.map((item, index) => (
                  <div key={item.marque} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
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
                        <div className="text-gray-500 text-xs">Fournisseurs</div>
                        <div className="font-medium text-gray-700 text-xs">
                          {item.fournisseurs.join(', ')}
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marque</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2024</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2025</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseurs</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {clientData.marquesPerformance.map((item, index) => (
                          <tr key={item.marque} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.marque}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2024)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${getStatusColor(item.progression)}`}>
                              {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{Math.round(item.progression * 10) / 10}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.fournisseurs.join(', ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Marques Multi-Fournisseurs */}
          {activeTab === 'marquesMulti' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">🔄 Marques Multi-Fournisseurs</h3>
                  <p className="text-gray-600 mt-1">
                    Analyse stratégique par marque - Identifiez vos fournisseurs dominants et optimisez vos achats
                  </p>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  {(() => {
                    // Grouper par marque pour le compteur
                    const marquesGrouped = new Map<string, typeof clientData.marquesMultiFournisseurs>();
                    clientData.marquesMultiFournisseurs.forEach(item => {
                      if (!marquesGrouped.has(item.marque)) {
                        marquesGrouped.set(item.marque, []);
                      }
                      marquesGrouped.get(item.marque)!.push(item);
                    });
                    return `${marquesGrouped.size} marques`;
                  })()} combinaisons
                </div>
              </div>

              {/* Filtres de recherche - Mobile Optimized */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                {/* Filtres simplifiés pour Mobile */}
                <div className="space-y-3 sm:hidden">
                  {/* Recherche globale */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🔍 Recherche</label>
                    <input
                      type="text"
                      placeholder="Marque ou fournisseur..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Filtre par marque */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🏷️ Marque</label>
                    <select
                      value={selectedMarque}
                      onChange={(e) => setSelectedMarque(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Toutes les marques</option>
                      {(() => {
                        const marquesUniques = Array.from(new Set(clientData.marquesMultiFournisseurs.map(item => item.marque))).sort();
                        return marquesUniques.map(marque => (
                          <option key={marque} value={marque}>{marque}</option>
                        ));
                      })()}
                    </select>
                  </div>
                </div>
                
                {/* Filtres complets pour Desktop */}
                <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Recherche globale */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🔍 Recherche</label>
                    <input
                      type="text"
                      placeholder="Marque ou fournisseur..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Filtre par marque */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🏷️ Marque</label>
                    <select
                      value={selectedMarque}
                      onChange={(e) => setSelectedMarque(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Toutes les marques</option>
                      {(() => {
                        const marquesUniques = Array.from(new Set(clientData.marquesMultiFournisseurs.map(item => item.marque))).sort();
                        return marquesUniques.map(marque => (
                          <option key={marque} value={marque}>{marque}</option>
                        ));
                      })()}
                    </select>
                  </div>

                  {/* Filtre par fournisseur */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🏢 Fournisseur</label>
                    <select
                      value={selectedFournisseur}
                      onChange={(e) => setSelectedFournisseur(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Tous les fournisseurs</option>
                      {(() => {
                        const fournisseursUniques = Array.from(new Set(clientData.marquesMultiFournisseurs.map(item => item.fournisseur))).sort();
                        return fournisseursUniques.map(fournisseur => (
                          <option key={fournisseur} value={fournisseur}>{fournisseur}</option>
                        ));
                      })()}
                    </select>
                  </div>

                  {/* Filtre par performance */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📈 Performance</label>
                    <select
                      value={performanceFilter}
                      onChange={(e) => setPerformanceFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">Toutes les performances</option>
                      <option value="positive">↗️ Progression</option>
                      <option value="negative">↘️ Régression</option>
                      <option value="stable">→ Stable</option>
                    </select>
                  </div>

                  {/* Filtre CA minimum */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">💰 CA Min (€)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={caMin}
                      onChange={(e) => setCaMin(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Filtre CA maximum */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">💰 CA Max (€)</label>
                    <input
                      type="number"
                      placeholder="1000000"
                      value={caMax}
                      onChange={(e) => setCaMax(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Résumé des filtres actifs */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Filtres actifs:</span>
                    {searchTerm && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        🔍 "{searchTerm}"
                      </span>
                    )}
                    {selectedMarque && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        🏷️ {selectedMarque}
                      </span>
                    )}
                    {selectedFournisseur && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        🏢 {selectedFournisseur}
                      </span>
                    )}
                    {performanceFilter !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        📈 {performanceFilter === 'positive' ? 'Progression' : performanceFilter === 'negative' ? 'Régression' : 'Stable'}
                      </span>
                    )}
                    {(caMin || caMax) && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        💰 {caMin || '0'}€ - {caMax || '∞'}€
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {(() => {
                      // Appliquer les filtres
                      const filteredData = clientData.marquesMultiFournisseurs.filter(item => {
                        const matchesSearch = searchTerm === '' || 
                          item.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.fournisseur.toLowerCase().includes(searchTerm.toLowerCase());
                        
                        const matchesMarque = selectedMarque === '' || item.marque === selectedMarque;
                        const matchesFournisseur = selectedFournisseur === '' || item.fournisseur === selectedFournisseur;
                        
                        const matchesPerformance = performanceFilter === 'all' ||
                          (performanceFilter === 'positive' && item.progression > 0) ||
                          (performanceFilter === 'negative' && item.progression < 0) ||
                          (performanceFilter === 'stable' && item.progression === 0);
                        
                        const totalCA = item.ca2024 + item.ca2025;
                        const matchesCaMin = caMin === '' || totalCA >= parseFloat(caMin);
                        const matchesCaMax = caMax === '' || totalCA <= parseFloat(caMax);
                        
                        return matchesSearch && matchesMarque && matchesFournisseur && matchesPerformance && matchesCaMin && matchesCaMax;
                      });
                      return `${filteredData.length} résultat${filteredData.length !== 1 ? 's' : ''} sur ${clientData.marquesMultiFournisseurs.length}`;
                    })()}
                  </div>
                </div>

                {/* Bouton reset des filtres */}
                {(searchTerm || selectedMarque || selectedFournisseur || performanceFilter !== 'all' || caMin || caMax) && (
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedMarque('');
                        setSelectedFournisseur('');
                        setPerformanceFilter('all');
                        setCaMin('');
                        setCaMax('');
                      }}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      🔄 Réinitialiser tous les filtres
                    </button>
                  </div>
                )}
              </div>

              {/* Vue par marque avec regroupement visuel (utilise les filtres) */}
              {(() => {
                // Appliquer les filtres
                const filteredData = clientData.marquesMultiFournisseurs.filter(item => {
                  const matchesSearch = searchTerm === '' || 
                    item.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.fournisseur.toLowerCase().includes(searchTerm.toLowerCase());
                  
                  const matchesMarque = selectedMarque === '' || item.marque === selectedMarque;
                  const matchesFournisseur = selectedFournisseur === '' || item.fournisseur === selectedFournisseur;
                  
                  const matchesPerformance = performanceFilter === 'all' ||
                    (performanceFilter === 'positive' && item.progression > 0) ||
                    (performanceFilter === 'negative' && item.progression < 0) ||
                    (performanceFilter === 'stable' && item.progression === 0);
                  
                  const totalCA = item.ca2024 + item.ca2025;
                  const matchesCaMin = caMin === '' || totalCA >= parseFloat(caMin);
                  const matchesCaMax = caMax === '' || totalCA <= parseFloat(caMax);
                  
                  return matchesSearch && matchesMarque && matchesFournisseur && matchesPerformance && matchesCaMin && matchesCaMax;
                });

                // Grouper par marque
                const marquesGrouped = new Map<string, typeof filteredData>();
                filteredData.forEach(item => {
                  if (!marquesGrouped.has(item.marque)) {
                    marquesGrouped.set(item.marque, []);
                  }
                  marquesGrouped.get(item.marque)!.push(item);
                });

                return Array.from(marquesGrouped.entries()).map(([marque, fournisseurs]) => {
                  // Calculer le total de la marque
                  // const totalMarque = fournisseurs.reduce((sum, f) => sum + f.ca2024 + f.ca2025, 0);
                  const total2024 = fournisseurs.reduce((sum, f) => sum + f.ca2024, 0);
                  const total2025 = fournisseurs.reduce((sum, f) => sum + f.ca2025, 0);
                  const progressionMarque = total2024 > 0 ? ((total2025 - total2024) / total2024) * 100 : 0;
                  
                  // Trier par CA total décroissant
                  const fournisseursSorted = [...fournisseurs].sort((a, b) => 
                    (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025)
                  );

                  return (
                    <div key={marque} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      {/* Header de la marque */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-lg">{marque.charAt(0)}</span>
                            </div>
                            <div>
                              <h4 className="text-xl font-bold text-gray-900">{marque}</h4>
                              <div className="text-sm text-gray-600">
                                {fournisseurs.length} fournisseur{fournisseurs.length > 1 ? 's' : ''} • 
                                Total: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(total2025)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${getStatusColor(progressionMarque)}`}>
                              {getStatusIcon(progressionMarque)} {progressionMarque >= 0 ? '+' : ''}{Math.round(progressionMarque * 10) / 10}%
                            </div>
                            <div className="text-sm text-gray-600">Progression marque</div>
                          </div>
                        </div>
                      </div>

                      {/* Résumé des fournisseurs */}
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {fournisseursSorted.map((fournisseur, index) => (
                            <div key={fournisseur.fournisseur} className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                    index === 0 ? 'bg-green-500' : 
                                    index === 1 ? 'bg-blue-500' : 
                                    index === 2 ? 'bg-yellow-500' : 'bg-gray-500'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <span className="font-medium text-gray-900">{fournisseur.fournisseur}</span>
                                </div>
                                <span className="text-sm font-bold text-blue-600">{fournisseur.pourcentageMarque}%</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                CA: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(fournisseur.ca2025)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tableau détaillé */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseur</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2024</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2025</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Marque</th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rang</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {fournisseursSorted.map((item, index) => (
                              <tr key={`${item.marque}-${item.fournisseur}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                                      index === 0 ? 'bg-green-500' : 
                                      index === 1 ? 'bg-blue-500' : 
                                      index === 2 ? 'bg-yellow-500' : 'bg-gray-500'
                                    }`}>
                                      {index + 1}
                                    </div>
                                    <span className="font-medium text-gray-900">{item.fournisseur}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2024)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${getStatusColor(item.progression)}`}>
                                  {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{Math.round(item.progression * 10) / 10}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  <span className="font-bold text-blue-600">{item.pourcentageMarque}%</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    index === 0 ? 'bg-green-100 text-green-800' : 
                                    index === 1 ? 'bg-blue-100 text-blue-800' : 
                                    index === 2 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {index === 0 ? '🥇 1er' : 
                                     index === 1 ? '🥈 2ème' : 
                                     index === 2 ? '🥉 3ème' : `${index + 1}ème`}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                });
              })()}

              {/* Vue par marque avec regroupement visuel */}
              {(() => {
                // Grouper par marque
                const marquesGrouped = new Map<string, typeof clientData.marquesMultiFournisseurs>();
                clientData.marquesMultiFournisseurs.forEach(item => {
                  if (!marquesGrouped.has(item.marque)) {
                    marquesGrouped.set(item.marque, []);
                  }
                  marquesGrouped.get(item.marque)!.push(item);
                });

                return Array.from(marquesGrouped.entries()).map(([marque, fournisseurs]) => {
                  // Calculer le total de la marque
                  // const totalMarque = fournisseurs.reduce((sum, f) => sum + f.ca2024 + f.ca2025, 0);
                  const total2024 = fournisseurs.reduce((sum, f) => sum + f.ca2024, 0);
                  const total2025 = fournisseurs.reduce((sum, f) => sum + f.ca2025, 0);
                  const progressionMarque = total2024 > 0 ? ((total2025 - total2024) / total2024) * 100 : 0;
                  
                  // Trier par CA total décroissant
                  const fournisseursSorted = [...fournisseurs].sort((a, b) => 
                    (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025)
                  );

                  return (
                    <div key={marque} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      {/* Header de la marque */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-lg">{marque.charAt(0)}</span>
                            </div>
                            <div>
                              <h4 className="text-xl font-bold text-gray-900">{marque}</h4>
                              <div className="text-sm text-gray-600">
                                {fournisseurs.length} fournisseur{fournisseurs.length > 1 ? 's' : ''} • 
                                Total: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(total2025)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${getStatusColor(progressionMarque)}`}>
                              {getStatusIcon(progressionMarque)} {progressionMarque >= 0 ? '+' : ''}{Math.round(progressionMarque * 10) / 10}%
                            </div>
                            <div className="text-sm text-gray-600">Progression marque</div>
                          </div>
                        </div>
                      </div>

                      {/* Résumé des fournisseurs */}
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {fournisseursSorted.map((fournisseur, index) => (
                            <div key={fournisseur.fournisseur} className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                    index === 0 ? 'bg-green-500' : 
                                    index === 1 ? 'bg-blue-500' : 
                                    index === 2 ? 'bg-yellow-500' : 'bg-gray-500'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <span className="font-medium text-gray-900">{fournisseur.fournisseur}</span>
                                </div>
                                <span className="text-sm font-bold text-blue-600">{fournisseur.pourcentageMarque}%</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                CA: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(fournisseur.ca2025)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tableau détaillé */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseur</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2024</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2025</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Marque</th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rang</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {fournisseursSorted.map((item, index) => (
                              <tr key={`${item.marque}-${item.fournisseur}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                                      index === 0 ? 'bg-green-500' : 
                                      index === 1 ? 'bg-blue-500' : 
                                      index === 2 ? 'bg-yellow-500' : 'bg-gray-500'
                                    }`}>
                                      {index + 1}
                                    </div>
                                    <span className="font-medium text-gray-900">{item.fournisseur}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2024)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${getStatusColor(item.progression)}`}>
                                  {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{Math.round(item.progression * 10) / 10}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  <span className="font-bold text-blue-600">{item.pourcentageMarque}%</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    index === 0 ? 'bg-green-100 text-green-800' : 
                                    index === 1 ? 'bg-blue-100 text-blue-800' : 
                                    index === 2 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {index === 0 ? '🥇 1er' : 
                                     index === 1 ? '🥈 2ème' : 
                                     index === 2 ? '🥉 3ème' : `${index + 1}ème`}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                });
              })()}

              {/* Insights business */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <span className="text-green-600 text-2xl mr-3">💡</span>
                    <div>
                      <h4 className="text-lg font-semibold text-green-800">Stratégie d'Achat</h4>
                      <p className="text-green-700 text-sm mt-1">
                        Concentrez vos achats sur les fournisseurs #1 et #2 pour chaque marque afin d'obtenir de meilleures conditions commerciales.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <span className="text-blue-600 text-2xl mr-3">🎯</span>
                    <div>
                      <h4 className="text-lg font-semibold text-blue-800">Négociation</h4>
                      <p className="text-blue-700 text-sm mt-1">
                        Utilisez ces données pour négocier des remises volume avec vos fournisseurs principaux et optimiser vos marges.
                      </p>
                    </div>
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
                {clientData.famillesPerformance.map((item, index) => (
                  <div key={item.famille} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-orange-500 text-white text-sm flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">{item.famille}</span>
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
                        <div className="font-semibold text-orange-600">{item.pourcentageTotal}%</div>
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
                        {clientData.famillesPerformance.map((item, index) => (
                          <tr key={item.famille} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.famille}</td>
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

          {/* Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">⏰ Évolution Temporelle</h3>
              
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-4">📅</div>
                  <div className="text-lg">Timeline en cours de développement</div>
                  <div className="text-sm">Graphique d'évolution mensuelle à venir</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Modal d'export client */}
      {showExportModal && (
        <ClientExport
          client={client!}
          clientData={clientData!}
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
};

export default ClientDetailModal;
