import React, { useState, useMemo } from 'react';
import { FamilleProduitPerformance, AdherentData } from '../types';
import CloseButton from './CloseButton';

interface FamilleDetailModalLegacyProps {
  famille: FamilleProduitPerformance | null;
  allAdherentData: AdherentData[];
  isOpen: boolean;
  onClose: () => void;
  onClientClick?: (client: any) => void;
}

const FamilleDetailModalLegacy: React.FC<FamilleDetailModalLegacyProps> = ({
  famille,
  allAdherentData,
  isOpen,
  onClose,
  onClientClick
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'fournisseurs' | 'marques'>('overview');

  // Calculer les données détaillées de la famille
  const familleData = useMemo(() => {
    if (!famille) return null;

    const data = allAdherentData.filter(item => item.famille === famille.famille);
    
    // Clients par famille
    const clientsMap = new Map<string, { ca2024: number; ca2025: number; progression: number }>();
    data.forEach(item => {
      const key = item.codeUnion;
      if (!clientsMap.has(key)) {
        clientsMap.set(key, { ca2024: 0, ca2025: 0, progression: 0 });
      }
      const client = clientsMap.get(key)!;
      if (item.annee === 2024) client.ca2024 += item.ca;
      if (item.annee === 2025) client.ca2025 += item.ca;
    });

    // Calculer la progression pour chaque client
    clientsMap.forEach(client => {
      if (client.ca2024 > 0) {
        client.progression = ((client.ca2025 - client.ca2024) / client.ca2024) * 100;
      }
    });

    // Fournisseurs par famille
    const fournisseursMap = new Map<string, { ca2024: number; ca2025: number; progression: number }>();
    data.forEach(item => {
      if (!fournisseursMap.has(item.fournisseur)) {
        fournisseursMap.set(item.fournisseur, { ca2024: 0, ca2025: 0, progression: 0 });
      }
      const fournisseur = fournisseursMap.get(item.fournisseur)!;
      if (item.annee === 2024) fournisseur.ca2024 += item.ca;
      if (item.annee === 2025) fournisseur.ca2025 += item.ca;
    });

    // Calculer la progression pour chaque fournisseur
    fournisseursMap.forEach(fournisseur => {
      if (fournisseur.ca2024 > 0) {
        fournisseur.progression = ((fournisseur.ca2025 - fournisseur.ca2024) / fournisseur.ca2024) * 100;
      }
    });

    // Marques par famille
    const marquesMap = new Map<string, { ca2024: number; ca2025: number; progression: number }>();
    data.forEach(item => {
      if (!marquesMap.has(item.marque)) {
        marquesMap.set(item.marque, { ca2024: 0, ca2025: 0, progression: 0 });
      }
      const marque = marquesMap.get(item.marque)!;
      if (item.annee === 2024) marque.ca2024 += item.ca;
      if (item.annee === 2025) marque.ca2025 += item.ca;
    });

    // Calculer la progression pour chaque marque
    marquesMap.forEach(marque => {
      if (marque.ca2024 > 0) {
        marque.progression = ((marque.ca2025 - marque.ca2024) / marque.ca2024) * 100;
      }
    });

    return {
      clients: Array.from(clientsMap.entries()).map(([codeUnion, data]) => ({
        codeUnion,
        raisonSociale: allAdherentData.find(item => item.codeUnion === codeUnion)?.raisonSociale || '',
        ...data
      })).sort((a, b) => b.ca2025 - a.ca2025),
      fournisseurs: Array.from(fournisseursMap.entries()).map(([fournisseur, data]) => ({
        fournisseur,
        ...data
      })).sort((a, b) => b.ca2025 - a.ca2025),
      marques: Array.from(marquesMap.entries()).map(([marque, data]) => ({
        marque,
        ...data
      })).sort((a, b) => b.ca2025 - a.ca2025)
    };
  }, [famille, allAdherentData]);

  if (!isOpen || !famille || !familleData) return null;

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
    { id: 'fournisseurs', label: 'Fournisseurs', shortLabel: 'Fourn' },
    { id: 'marques', label: 'Marques', shortLabel: 'Marques' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">📦 {famille.famille}</h2>
              <p className="text-purple-100 text-sm sm:text-base">
                Analyse détaillée de la famille de produits
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
              <h3 className="text-2xl font-bold text-gray-800 mb-6">📊 Vue d'ensemble de {famille.famille}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                  <div className="text-3xl font-bold">{famille.ca2024.toLocaleString('fr-FR')}€</div>
                  <div className="text-blue-100">CA 2024</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
                  <div className="text-3xl font-bold">{famille.ca2025.toLocaleString('fr-FR')}€</div>
                  <div className="text-green-100">CA 2025</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                  <div className="text-3xl font-bold">{famille.progression >= 0 ? '+' : ''}{famille.progression.toFixed(1)}%</div>
                  <div className="text-purple-100">Progression</div>
                </div>
                <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white p-6 rounded-xl">
                  <div className="text-3xl font-bold">{familleData.clients.length}</div>
                  <div className="text-pink-100">Clients</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">📈 Évolution du CA</h4>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{famille.ca2024.toLocaleString('fr-FR')}€</div>
                      <div className="text-gray-500">2024</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{famille.ca2025.toLocaleString('fr-FR')}€</div>
                      <div className="text-gray-500">2025</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">🏗️ Répartition</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{familleData.marques.length}</div>
                      <div className="text-gray-500">Marques</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-pink-600">{familleData.fournisseurs.length}</div>
                      <div className="text-gray-500">Fournisseurs</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Répartition par fournisseur */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">🏢 Répartition par Fournisseur (2025)</h4>
                <div className="space-y-2">
                  {familleData.fournisseurs.slice(0, 10).map((item, index) => (
                    <div key={item.fournisseur} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-700">{item.fournisseur}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {((item.ca2025 / famille.ca2025) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Clients */}
          {activeTab === 'clients' && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">👥 Clients de cette famille</h3>
              
              {/* Mode Carte pour Mobile */}
              <div className="space-y-3 sm:hidden">
                {familleData.clients.map((client, index) => (
                  <div key={client.codeUnion} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{client.raisonSociale || client.codeUnion}</div>
                          <div className="text-gray-500 text-xs">{client.codeUnion}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        client.progression > 5 ? 'bg-green-100 text-green-800' :
                        client.progression < -5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getStatusIcon(client.progression)} {client.progression >= 0 ? '+' : ''}{client.progression.toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">CA 2024</div>
                        <div className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2024)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">CA 2025</div>
                        <div className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2025)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-100">
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">Part du CA total</div>
                        <div className="font-semibold text-blue-600">{((client.ca2025 / famille.ca2025) * 100).toFixed(1)}%</div>
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
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2024</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2025</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% 2025</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {familleData.clients.map((client) => (
                          <tr key={client.codeUnion} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {client.raisonSociale || client.codeUnion}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2024)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2025)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              <span className={`font-medium ${getStatusColor(client.progression)}`}>
                                {getStatusIcon(client.progression)} {client.progression >= 0 ? '+' : ''}{client.progression.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                              {((client.ca2025 / famille.ca2025) * 100).toFixed(1)}%
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

          {/* Fournisseurs */}
          {activeTab === 'fournisseurs' && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">🏢 Fournisseurs de cette famille</h3>
              
              {/* Mode Carte pour Mobile */}
              <div className="space-y-3 sm:hidden">
                {familleData.fournisseurs.map((fournisseur, index) => (
                  <div key={fournisseur.fournisseur} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500 text-white text-sm flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">{fournisseur.fournisseur}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        fournisseur.progression > 5 ? 'bg-green-100 text-green-800' :
                        fournisseur.progression < -5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getStatusIcon(fournisseur.progression)} {fournisseur.progression >= 0 ? '+' : ''}{fournisseur.progression.toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">CA 2024</div>
                        <div className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(fournisseur.ca2024)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">CA 2025</div>
                        <div className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(fournisseur.ca2025)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-100">
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">Part du CA total</div>
                        <div className="font-semibold text-blue-600">{((fournisseur.ca2025 / famille.ca2025) * 100).toFixed(1)}%</div>
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
                        {familleData.fournisseurs.map((fournisseur) => (
                          <tr key={fournisseur.fournisseur} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fournisseur.fournisseur}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(fournisseur.ca2024)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(fournisseur.ca2025)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              <span className={`font-medium ${getStatusColor(fournisseur.progression)}`}>
                                {getStatusIcon(fournisseur.progression)} {fournisseur.progression >= 0 ? '+' : ''}{fournisseur.progression.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                              {((fournisseur.ca2025 / famille.ca2025) * 100).toFixed(1)}%
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

          {/* Marques */}
          {activeTab === 'marques' && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">🏷️ Marques de cette famille</h3>
              
              {/* Mode Carte pour Mobile */}
              <div className="space-y-3 sm:hidden">
                {familleData.marques.map((marque, index) => (
                  <div key={marque.marque} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-pink-500 text-white text-sm flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">{marque.marque}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        marque.progression > 5 ? 'bg-green-100 text-green-800' :
                        marque.progression < -5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getStatusIcon(marque.progression)} {marque.progression >= 0 ? '+' : ''}{marque.progression.toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">CA 2024</div>
                        <div className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(marque.ca2024)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">CA 2025</div>
                        <div className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(marque.ca2025)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-100">
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">Part du CA total</div>
                        <div className="font-semibold text-blue-600">{((marque.ca2025 / famille.ca2025) * 100).toFixed(1)}%</div>
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
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% 2025</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {familleData.marques.map((marque) => (
                          <tr key={marque.marque} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{marque.marque}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(marque.ca2024)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(marque.ca2025)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              <span className={`font-medium ${getStatusColor(marque.progression)}`}>
                                {getStatusIcon(marque.progression)} {marque.progression >= 0 ? '+' : ''}{marque.progression.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                              {((marque.ca2025 / famille.ca2025) * 100).toFixed(1)}%
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
        </div>
      </div>
    </div>
  );
};

export default FamilleDetailModalLegacy;
