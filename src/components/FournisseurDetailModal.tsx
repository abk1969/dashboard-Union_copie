import React, { useState, useMemo } from 'react';
import { FournisseurPerformance, AdherentData, AdherentSummary } from '../types';

interface FournisseurDetailModalProps {
  fournisseur: FournisseurPerformance | null;
  allAdherentData: AdherentData[];
  isOpen: boolean;
  onClose: () => void;
  onClientClick: (client: AdherentSummary) => void;
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
  famille: string;
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
  onClientClick 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'marques' | 'familles' | 'geographie'>('overview');

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
      .map(([famille, data]) => {
        const progression = data.ca2024 > 0 ? ((data.ca2025 - data.ca2024) / data.ca2024) * 100 : 0;
        const totalCA = fournisseur.ca2024 + fournisseur.ca2025;
        const pourcentageTotal = totalCA > 0 ? ((data.ca2024 + data.ca2025) / totalCA) * 100 : 0;
        
        return {
          famille,
          ca2024: data.ca2024,
          ca2025: data.ca2025,
          progression: Math.round(progression * 10) / 10,
          pourcentageTotal: Math.round(pourcentageTotal * 10) / 10
        };
      })
      .sort((a, b) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));

    return {
      clientsPerformance,
      marquesPerformance,
      famillesPerformance,
      totalTransactions: fournisseurData.length,
      uniqueClients: clientsMap.size,
      uniqueMarques: marquesMap.size,
      uniqueFamilles: famillesMap.size,
      totalGroupementClients
    };
  }, [fournisseur, allAdherentData]);

  if (!isOpen || !fournisseur || !fournisseurData) return null;

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
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">🏭 {fournisseur.fournisseur}</h2>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-xl">📊 Fournisseur Groupement Union</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  fournisseur.progression >= 0 ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {fournisseur.progression >= 0 ? '📈 Progression' : '📉 Régression'} {fournisseur.progression >= 0 ? '+' : ''}{Math.round(fournisseur.progression * 10) / 10}%
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: '🏠 Vue d\'ensemble', icon: '📊' },
              { id: 'clients', label: '👥 Clients', icon: '🏢' },
              { id: 'marques', label: '🏷️ Marques', icon: '🎯' },
              { id: 'familles', label: '📦 Familles', icon: '📋' },
              { id: 'geographie', label: '🌍 Géographie', icon: '🗺️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
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
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(fournisseur.ca2024)}
                  </div>
                  <div className="text-blue-600 font-medium">CA 2024 (jan-juin)</div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                  <div className="text-green-600 text-2xl mb-2">📊</div>
                  <div className="text-2xl font-bold text-green-900">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(fournisseur.ca2025)}
                  </div>
                  <div className="text-green-600 font-medium">CA 2025 (jan-juin)</div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                  <div className="text-purple-600 text-2xl mb-2">📈</div>
                  <div className={`text-2xl font-bold ${getStatusColor(fournisseur.progression)}`}>
                    {getStatusIcon(fournisseur.progression)} {fournisseur.progression >= 0 ? '+' : ''}{Math.round(fournisseur.progression * 10) / 10}%
                  </div>
                  <div className="text-purple-600 font-medium">Progression</div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                  <div className="text-orange-600 text-2xl mb-2">👥</div>
                  <div className="text-2xl font-bold text-orange-900">
                    {fournisseurData.uniqueClients} / {fournisseurData.totalGroupementClients}
                  </div>
                  <div className="text-orange-600 font-medium">Clients Actifs / Total</div>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200">
                  <div className="text-indigo-600 text-2xl mb-2">🏆</div>
                  <div className="text-2xl font-bold text-indigo-900">
                    {fournisseurData.totalTransactions}
                  </div>
                  <div className="text-indigo-600 font-medium">Transactions</div>
                </div>
              </div>

              {/* Statistiques détaillées */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">👥 Top Clients</h3>
                  <div className="space-y-3">
                    {fournisseurData.clientsPerformance.slice(0, 5).map((item, index) => (
                      <div key={item.codeUnion} className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">{item.raisonSociale}</span>
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
                    {fournisseurData.marquesPerformance.slice(0, 5).map((item, index) => (
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
                    {fournisseurData.famillesPerformance.slice(0, 5).map((item, index) => (
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

          {/* Clients */}
          {activeTab === 'clients' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">👥 Performance par Client</h3>
              
              {/* Tableau détaillé en pleine largeur */}
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
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% 2024</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% 2025</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fournisseurData.clientsPerformance.map((item, index) => (
                        <tr key={item.codeUnion} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                // Fermer d'abord le modal fournisseur
                                onClose();
                                
                                // Trouver l'AdherentSummary correspondant
                                const clientSummary = allAdherentData
                                  .filter(data => data.codeUnion === item.codeUnion)
                                  .reduce((acc, data) => {
                                    if (data.annee === 2024) acc.ca2024 += data.ca;
                                    if (data.annee === 2025) acc.ca2025 += data.ca;
                                    return acc;
                                  }, { ca2024: 0, ca2025: 0, raisonSociale: item.raisonSociale, codeUnion: item.codeUnion, groupeClient: item.groupeClient, progression: 0, statut: 'stable' as 'stable' | 'progression' | 'regression' });
                                
                                const progression = clientSummary.ca2024 > 0 ? ((clientSummary.ca2025 - clientSummary.ca2024) / clientSummary.ca2024) * 100 : 0;
                                clientSummary.progression = Math.round(progression * 10) / 10;
                                clientSummary.statut = progression > 5 ? 'progression' : progression < -5 ? 'regression' : 'stable';
                                
                                // Ouvrir le modal client
                                onClientClick(clientSummary as AdherentSummary);
                              }}
                              className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-left w-full"
                            >
                              {item.raisonSociale}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.groupeClient}</td>
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
                            {Math.round(item.ca2024 / (fournisseur.ca2024 + fournisseur.ca2025) * 100)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {Math.round(item.ca2025 / (fournisseur.ca2024 + fournisseur.ca2025) * 100)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Note d'aide */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-blue-600 text-lg mr-2">💡</span>
                  <div className="text-blue-800 text-sm">
                    <strong>Astuce :</strong> Cliquez sur le nom d'un client pour ouvrir sa fiche détaillée complète !
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Marques */}
          {activeTab === 'marques' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">🏷️ Performance par Marque</h3>
              
              {/* Tableau détaillé en pleine largeur */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marque</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2024</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2025</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clients (Marque/Fournisseur)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fournisseurData.marquesPerformance.map((item, index) => (
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
                             {item.clients.length} / {fournisseurData.uniqueClients} clients
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Familles */}
          {activeTab === 'familles' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">📦 Performance par Famille de Produits</h3>
              
              {/* Tableau détaillé en pleine largeur */}
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
          )}

          {/* Géographie */}
          {activeTab === 'geographie' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">🌍 Répartition Géographique</h3>
              
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-4">🗺️</div>
                  <div className="text-lg">Carte géographique en cours de développement</div>
                  <div className="text-sm">Visualisation par région commerciale à venir</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FournisseurDetailModal;
