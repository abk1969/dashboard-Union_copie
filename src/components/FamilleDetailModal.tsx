import React, { useState, useMemo } from 'react';
import { FamilleProduitPerformance, AdherentData } from '../types';
import { formatCurrency, formatPercentage, formatProgression } from '../utils/formatters';
import CloseButton from './CloseButton';

interface FamilleDetailModalProps {
  famille: FamilleProduitPerformance | null;
  allAdherentData: AdherentData[];
  isOpen: boolean;
  onClose: () => void;
  onClientClick?: (client: any) => void;
}

const FamilleDetailModal: React.FC<FamilleDetailModalProps> = ({
  famille,
  allAdherentData,
  isOpen,
  onClose,
  onClientClick
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'fournisseurs' | 'marques'>('overview');

  const familleData = useMemo(() => {
    if (!famille) return null;

    const data = allAdherentData.filter(item => item.sousFamille === famille.sousFamille);
    
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">📦 {famille.sousFamille}</h2>
              <p className="text-purple-100 mt-1">
                Analyse détaillée de la famille de produits
              </p>
            </div>
            <CloseButton onClose={onClose} size="md" />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-1 p-4">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
              { id: 'clients', label: 'Clients', icon: '👥' },
              { id: 'fournisseurs', label: 'Fournisseurs', icon: '🏢' },
              { id: 'marques', label: 'Marques', icon: '🏷️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Vue d'ensemble */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Métriques principales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(famille.ca2024)}
                  </div>
                  <div className="text-blue-700">CA 2024</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(famille.ca2025)}
                  </div>
                  <div className="text-green-700">CA 2025</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                     <div className={`text-2xl font-bold ${famille.progression >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                     {formatProgression(famille.progression).value}
                   </div>
                  <div className="text-purple-700">Progression</div>
                </div>
              </div>

              {/* Répartition par fournisseur */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🏢 Répartition par Fournisseur (2025)</h3>
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
                          {formatCurrency(item.ca2025)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatPercentage((item.ca2025 / famille.ca2025) * 100)}
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
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">👥 Clients de cette famille</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Client</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">CA 2024</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">CA 2025</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">Progression</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">% 2025</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {familleData.clients.map((client) => (
                      <tr key={client.codeUnion} className="hover:bg-gray-50">
                        <td className="py-2 px-3 text-sm font-medium text-gray-900">
                          {client.codeUnion}
                        </td>
                        <td className="py-2 px-3 text-sm text-right text-gray-700">
                          {formatCurrency(client.ca2024)}
                        </td>
                        <td className="py-2 px-3 text-sm text-right text-gray-700">
                          {formatCurrency(client.ca2025)}
                        </td>
                        <td className="py-2 px-3 text-sm text-right">
                                                     <span className={`font-medium ${client.progression >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                             {formatProgression(client.progression).value}
                           </span>
                        </td>
                        <td className="py-2 px-3 text-sm text-right text-gray-700">
                          {formatPercentage((client.ca2025 / famille.ca2025) * 100)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Fournisseurs */}
          {activeTab === 'fournisseurs' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">🏢 Fournisseurs de cette famille</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Fournisseur</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">CA 2024</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">CA 2025</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">Progression</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">% 2025</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {familleData.fournisseurs.map((fournisseur) => (
                      <tr key={fournisseur.fournisseur} className="hover:bg-gray-50">
                        <td className="py-2 px-3 text-sm font-medium text-gray-900">
                          {fournisseur.fournisseur}
                        </td>
                        <td className="py-2 px-3 text-sm text-right text-gray-700">
                          {formatCurrency(fournisseur.ca2024)}
                        </td>
                        <td className="py-2 px-3 text-sm text-right text-gray-700">
                          {formatCurrency(fournisseur.ca2025)}
                        </td>
                        <td className="py-2 px-3 text-sm text-right">
                                                     <span className={`font-medium ${fournisseur.progression >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                             {formatProgression(fournisseur.progression).value}
                           </span>
                        </td>
                        <td className="py-2 px-3 text-sm text-right text-gray-700">
                          {formatPercentage((fournisseur.ca2025 / famille.ca2025) * 100)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Marques */}
          {activeTab === 'marques' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">🏷️ Marques de cette famille</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Marque</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">CA 2024</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">CA 2025</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">Progression</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">% 2025</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {familleData.marques.map((marque) => (
                      <tr key={marque.marque} className="hover:bg-gray-50">
                        <td className="py-2 px-3 text-sm font-medium text-gray-900">
                          {marque.marque}
                        </td>
                        <td className="py-2 px-3 text-sm text-right text-gray-700">
                          {formatCurrency(marque.ca2024)}
                        </td>
                        <td className="py-2 px-3 text-sm text-right text-gray-700">
                          {formatCurrency(marque.ca2025)}
                        </td>
                        <td className="py-2 px-3 text-sm text-right">
                                                     <span className={`font-medium ${marque.progression >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                             {formatProgression(marque.progression).value}
                           </span>
                        </td>
                        <td className="py-2 px-3 text-sm text-right text-gray-700">
                          {formatPercentage((marque.ca2025 / famille.ca2025) * 100)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FamilleDetailModal;
