import React, { useState, useMemo } from 'react';
import { AdherentData } from '../types';

interface MarqueDetailModalProps {
  marque: string;
  fournisseur: string;
  allAdherentData: AdherentData[];
  isOpen: boolean;
  onClose: () => void;
  onFamilleClick?: (famille: string) => void;
}

interface MarqueFamilleData {
  famille: string;
  sousFamille: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  pourcentageTotal: number;
  clients: string[];
  sousFamilles: string[];
}

interface MarqueClientData {
  codeUnion: string;
  raisonSociale: string;
  groupeClient: string;
  regionCommerciale?: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  pourcentageTotal: number;
}

const MarqueModal: React.FC<MarqueDetailModalProps> = ({
  marque, 
  fournisseur, 
  allAdherentData, 
  isOpen, 
  onClose,
  onFamilleClick
}) => {
  const [activeTab, setActiveTab] = useState<'familles' | 'clients'>('familles');
  const [selectedFamille, setSelectedFamille] = useState<string | null>(null);

  // Calculer les données détaillées de la marque
  const marqueData = useMemo(() => {
    if (!marque || !fournisseur) return null;

    const marqueData = allAdherentData.filter(item => 
      item.fournisseur === fournisseur && item.marque === marque
    );
    
    // Performance par famille (groupé par famille uniquement)
    const famillesMap = new Map<string, { ca2024: number; ca2025: number; clients: Set<string>; sousFamilles: string[] }>();
    marqueData.forEach(item => {
      if (!famillesMap.has(item.famille)) {
        famillesMap.set(item.famille, { ca2024: 0, ca2025: 0, clients: new Set(), sousFamilles: [] });
      }
      const famille = famillesMap.get(item.famille)!;
      if (item.annee === 2024) famille.ca2024 += item.ca;
      if (item.annee === 2025) famille.ca2025 += item.ca;
      famille.clients.add(item.codeUnion);
      if (!famille.sousFamilles.includes(item.sousFamille)) {
        famille.sousFamilles.push(item.sousFamille);
      }
    });

    const famillesPerformance: MarqueFamilleData[] = Array.from(famillesMap.entries())
      .map(([famille, data]) => {
        const progression = data.ca2024 > 0 ? ((data.ca2025 - data.ca2024) / data.ca2024) * 100 : 0;
        const totalCA = marqueData.reduce((sum, item) => sum + item.ca, 0);
        const pourcentageTotal = totalCA > 0 ? ((data.ca2024 + data.ca2025) / totalCA) * 100 : 0;
        
        return {
          famille,
          sousFamille: `${data.sousFamilles.length} sous-familles`, // Afficher le nombre de sous-familles
          ca2024: data.ca2024,
          ca2025: data.ca2025,
          progression: Math.round(progression * 10) / 10,
          pourcentageTotal: Math.round(pourcentageTotal * 10) / 10,
          clients: Array.from(data.clients),
          sousFamilles: data.sousFamilles
        };
      })
      .sort((a, b) => {
        const totalA = a.ca2024 + a.ca2025;
        const totalB = b.ca2024 + b.ca2025;
        console.log(`🔍 Tri: ${a.famille} = ${totalA.toLocaleString('fr-FR')}€ vs ${b.famille} = ${totalB.toLocaleString('fr-FR')}€`);
        return totalB - totalA; // Du plus grand au plus petit
      });

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
        const clientInfo = marqueData.find(item => item.codeUnion === codeUnion);
        const progression = data.ca2024 > 0 ? ((data.ca2025 - data.ca2024) / data.ca2024) * 100 : 0;
        const totalCA = marqueData.reduce((sum, item) => sum + item.ca, 0);
        const pourcentageTotal = totalCA > 0 ? ((data.ca2024 + data.ca2025) / totalCA) * 100 : 0;
        
        return {
          codeUnion,
          raisonSociale: clientInfo?.raisonSociale || '',
          groupeClient: clientInfo?.groupeClient || '',
          regionCommerciale: clientInfo?.regionCommerciale,
          ca2024: data.ca2024,
          ca2025: data.ca2025,
          progression: Math.round(progression * 10) / 10,
          pourcentageTotal: Math.round(pourcentageTotal * 10) / 10
        };
      })
      .sort((a, b) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));

    // Totaux généraux
    const totalCA2024 = marqueData.filter(item => item.annee === 2024).reduce((sum, item) => sum + item.ca, 0);
    const totalCA2025 = marqueData.filter(item => item.annee === 2025).reduce((sum, item) => sum + item.ca, 0);
    const progressionGenerale = totalCA2024 > 0 ? ((totalCA2025 - totalCA2024) / totalCA2024) * 100 : 0;
    const clientsUniques = new Set(marqueData.map(item => item.codeUnion)).size;

    return {
      famillesPerformance,
      clientsPerformance,
      totalCA2024,
      totalCA2025,
      progressionGenerale: Math.round(progressionGenerale * 10) / 10,
      clientsUniques,
      totalLignes: marqueData.length
    };
  }, [marque, fournisseur, allAdherentData]);

  if (!isOpen || !marqueData) return null;

  const getStatusIcon = (progression: number) => {
    if (progression > 5) return '📈';
    if (progression < -5) return '📉';
    return '➡️';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">🏷️ {marque}</h2>
              <p className="text-orange-100 text-sm sm:text-base">
                Analyse détaillée de la marque • {fournisseur}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-orange-200 transition-colors text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'familles', label: 'Familles', icon: '📦' },
              { id: 'clients', label: 'Clients', icon: '👥' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedFamille(null); // Reset selection when changing tabs
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Familles */}
          {activeTab === 'familles' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                  {selectedFamille ? `📦 ${selectedFamille} - Sous-familles` : `📦 Total par Famille - ${marque}`}
                </h3>
                {selectedFamille && (
                  <button
                    onClick={() => setSelectedFamille(null)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    ← Retour aux familles
                  </button>
                )}
              </div>
              
              {/* Mode Carte pour Mobile */}
              <div className="space-y-3 sm:hidden">
                {selectedFamille ? (
                  // Affichage des sous-familles
                  (() => {
                    console.log('🔍 selectedFamille:', selectedFamille);
                    console.log('🔍 famillesPerformance:', marqueData.famillesPerformance);
                    const familleData = marqueData.famillesPerformance.find(f => f.famille === selectedFamille);
                    console.log('🔍 familleData:', familleData);
                    console.log('🔍 sousFamilles:', familleData?.sousFamilles);
                    
                    if (!familleData || !familleData.sousFamilles.length) {
                      return (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-yellow-800">Aucune sous-famille trouvée pour {selectedFamille}</p>
                        </div>
                      );
                    }
                    
                    // Trier les sous-familles par CA total (2024 + 2025)
                    const sousFamillesAvecCA = familleData.sousFamilles.map(sousFamille => {
                      const sousFamilleData = allAdherentData.filter(item => 
                        item.fournisseur === fournisseur && 
                        item.marque === marque && 
                        item.famille === selectedFamille && 
                        item.sousFamille === sousFamille
                      );
                      const ca2024 = sousFamilleData.filter(item => item.annee === 2024).reduce((sum, item) => sum + item.ca, 0);
                      const ca2025 = sousFamilleData.filter(item => item.annee === 2025).reduce((sum, item) => sum + item.ca, 0);
                      return {
                        nom: sousFamille,
                        caTotal: ca2024 + ca2025,
                        ca2024,
                        ca2025,
                        data: sousFamilleData
                      };
                    }).sort((a, b) => b.caTotal - a.caTotal); // Du plus grand au plus petit

                    return sousFamillesAvecCA.map((sousFamille, index) => {
                      // Calculer les données pour cette sous-famille
                      const progression = sousFamille.ca2024 > 0 ? ((sousFamille.ca2025 - sousFamille.ca2024) / sousFamille.ca2024) * 100 : 0;
                      const totalCA = allAdherentData.filter(item => 
                        item.fournisseur === fournisseur && item.marque === marque
                      ).reduce((sum, item) => sum + item.ca, 0);
                      const pourcentageTotal = totalCA > 0 ? (sousFamille.caTotal / totalCA) * 100 : 0;
                      const clients = new Set(sousFamille.data.map(item => item.codeUnion)).size;

                      return (
                        <div 
                          key={sousFamille.nom}
                          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-bold">
                                {index + 1}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-gray-900 text-sm sm:text-base">{sousFamille.nom}</span>
                                <span className="text-xs text-gray-500">{selectedFamille}</span>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              progression > 5 ? 'bg-green-100 text-green-800' :
                              progression < -5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {progression > 0 ? '📈' : progression < 0 ? '📉' : '➡️'} {Math.abs(progression).toFixed(1)}%
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">CA 2024:</span>
                              <span className="ml-2 font-semibold text-gray-900">
                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(sousFamille.ca2024)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">CA 2025:</span>
                              <span className="ml-2 font-semibold text-gray-900">
                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(sousFamille.ca2025)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">% Total:</span>
                              <span className="ml-2 font-semibold text-gray-900">{pourcentageTotal.toFixed(1)}%</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Clients:</span>
                              <span className="ml-2 font-semibold text-gray-900">{clients}</span>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()
                ) : (
                  // Affichage des familles
                  marqueData.famillesPerformance.map((item, index) => (
                    <div 
                      key={`${item.famille}-${item.sousFamille}`} 
                      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer hover:bg-orange-50"
                      onClick={() => setSelectedFamille(item.famille)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-orange-500 text-white text-sm flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900 text-sm sm:text-base">{item.famille}</span>
                            <span className="text-xs text-gray-500">{item.sousFamille}</span>
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
                  ))
                )}
              </div>
              
              {/* Mode Tableau pour Desktop */}
              <div className="hidden sm:block">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Famille</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sous-Famille</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2024</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2025</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">% Total</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Clients</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedFamille ? (
                          // Affichage des sous-familles
                          (() => {
                            const familleData = marqueData.famillesPerformance.find(f => f.famille === selectedFamille);
                            
                            if (!familleData || !familleData.sousFamilles.length) {
                              return (
                                <tr>
                                  <td colSpan={7} className="px-6 py-4 text-center text-yellow-800 bg-yellow-50">
                                    Aucune sous-famille trouvée pour {selectedFamille}
                                  </td>
                                </tr>
                              );
                            }
                            
                            // Trier les sous-familles par CA total (2024 + 2025)
                            const sousFamillesAvecCA = familleData.sousFamilles.map(sousFamille => {
                              const sousFamilleData = allAdherentData.filter(item => 
                                item.fournisseur === fournisseur && 
                                item.marque === marque && 
                                item.famille === selectedFamille && 
                                item.sousFamille === sousFamille
                              );
                              const ca2024 = sousFamilleData.filter(item => item.annee === 2024).reduce((sum, item) => sum + item.ca, 0);
                              const ca2025 = sousFamilleData.filter(item => item.annee === 2025).reduce((sum, item) => sum + item.ca, 0);
                              return {
                                nom: sousFamille,
                                caTotal: ca2024 + ca2025,
                                ca2024,
                                ca2025,
                                data: sousFamilleData
                              };
                            }).sort((a, b) => b.caTotal - a.caTotal); // Du plus grand au plus petit

                            return sousFamillesAvecCA.map((sousFamille, index) => {
                              const progression = sousFamille.ca2024 > 0 ? ((sousFamille.ca2025 - sousFamille.ca2024) / sousFamille.ca2024) * 100 : 0;
                              const totalCA = allAdherentData.filter(item => 
                                item.fournisseur === fournisseur && item.marque === marque
                              ).reduce((sum, item) => sum + item.ca, 0);
                              const pourcentageTotal = totalCA > 0 ? (sousFamille.caTotal / totalCA) * 100 : 0;
                              const clients = new Set(sousFamille.data.map(item => item.codeUnion)).size;

                              return (
                                <tr key={sousFamille.nom} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{selectedFamille}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sousFamille.nom}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(sousFamille.ca2024)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(sousFamille.ca2025)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      progression > 5 ? 'bg-green-100 text-green-800' :
                                      progression < -5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {getStatusIcon(progression)} {progression >= 0 ? '+' : ''}{progression.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                                    {pourcentageTotal.toFixed(1)}%
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                    {clients}
                                  </td>
                                </tr>
                              );
                            });
                          })()
                        ) : (
                          // Affichage des familles
                          marqueData.famillesPerformance.map((item, index) => (
                            <tr 
                              key={`${item.famille}-${item.sousFamille}`} 
                              className="hover:bg-orange-50 cursor-pointer transition-colors"
                              onClick={() => setSelectedFamille(item.famille)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.famille}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sousFamille}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2024)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.progression > 5 ? 'bg-green-100 text-green-800' :
                                  item.progression < -5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{item.progression.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                                {item.pourcentageTotal.toFixed(1)}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                {item.clients.length}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clients */}
          {activeTab === 'clients' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">👥 Clients de {marque}</h3>
              
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code Union</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Raison Sociale</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Groupe Client</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2024</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2025</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">% Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {marqueData.clientsPerformance.map((client, index) => (
                        <tr key={client.codeUnion} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {client.codeUnion}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {client.raisonSociale}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {client.groupeClient}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2024)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2025)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              client.progression > 5 ? 'bg-green-100 text-green-800' :
                              client.progression < -5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {getStatusIcon(client.progression)} {client.progression >= 0 ? '+' : ''}{client.progression.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                            {client.pourcentageTotal.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarqueModal;
