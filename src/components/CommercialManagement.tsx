import React, { useState, useEffect } from 'react';
import { CommercialUnion, CommercialStats, ClientLocation } from '../types';

interface CommercialManagementProps {
  commercials: CommercialUnion[];
  clients: ClientLocation[];
  onCommercialUpdate?: (commercial: CommercialUnion) => void;
}

export const CommercialManagement: React.FC<CommercialManagementProps> = ({
  commercials,
  clients,
  onCommercialUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'stats'>('overview');
  const [selectedCommercial, setSelectedCommercial] = useState<CommercialUnion | null>(null);

  // Calculer les statistiques des commerciaux
  const commercialStats: CommercialStats[] = commercials.map(commercial => {
    const commercialClients = clients.filter(client => client.commercial === commercial.nom);
    const totalCA = commercialClients.reduce((sum, client) => sum + client.ca2025, 0);
    
    return {
      commercial: commercial.nom,
      region: commercial.region,
      nombreClients: commercialClients.length,
      caTotal: totalCA,
      ca2024: 0, // À calculer si on a les données 2024
      ca2025: totalCA,
      progression: 0, // À calculer
      clients: commercialClients.map(client => ({
        codeUnion: client.codeUnion,
        nomClient: client.nomClient,
        ca2025: client.ca2025,
        ville: client.ville
      })),
      topClients: commercialClients
        .sort((a, b) => b.ca2025 - a.ca2025)
        .slice(0, 5)
        .map(client => ({
          codeUnion: client.codeUnion,
          nomClient: client.nomClient,
          ca2025: client.ca2025
        }))
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">👨‍💼 Gestion des Commerciaux Union</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📊 Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'map'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🗺️ Carte
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'stats'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📈 Statistiques
          </button>
        </div>
      </div>

      {/* Vue d'ensemble */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Métriques globales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-2xl font-bold text-blue-600">{commercials.length}</div>
              <div className="text-gray-600">Commerciaux</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-2xl font-bold text-green-600">
                {commercialStats.reduce((sum, stat) => sum + stat.nombreClients, 0)}
              </div>
              <div className="text-gray-600">Clients gérés</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-2xl font-bold text-purple-600">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
                  commercialStats.reduce((sum, stat) => sum + stat.caTotal, 0)
                )}
              </div>
              <div className="text-gray-600">CA Total</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-2xl font-bold text-orange-600">
                {commercialStats.length > 0 
                  ? Math.round(commercialStats.reduce((sum, stat) => sum + stat.nombreClients, 0) / commercialStats.length)
                  : 0
                }
              </div>
              <div className="text-gray-600">Moy. clients/commercial</div>
            </div>
          </div>

          {/* Liste des commerciaux */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Liste des Commerciaux</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Commercial</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Région</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Clients</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">CA 2025</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {commercialStats.map((stat, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{stat.commercial}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{commercials[index]?.email || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{stat.region}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-700">{stat.nombreClients}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-700">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stat.caTotal)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedCommercial(commercials[index])}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Voir détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Carte (placeholder) */}
      {activeTab === 'map' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Carte de France Interactive</h3>
          <p className="text-gray-600 mb-4">
            Visualisation des clients par commercial sur une carte de France
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>🚧 En développement :</strong> Intégration d'une carte interactive avec les positions des clients
            </p>
          </div>
        </div>
      )}

      {/* Statistiques détaillées */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {commercialStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{stat.commercial}</h3>
                <span className="text-sm text-gray-500">{stat.region}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stat.nombreClients}</div>
                  <div className="text-sm text-gray-600">Clients</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stat.caTotal)}
                  </div>
                  <div className="text-sm text-gray-600">CA Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {stat.nombreClients > 0 
                      ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stat.caTotal / stat.nombreClients)
                      : '0 €'
                    }
                  </div>
                  <div className="text-sm text-gray-600">CA Moyen/Client</div>
                </div>
              </div>

              {/* Top clients */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Top 5 Clients</h4>
                <div className="space-y-2">
                  {stat.topClients.map((client, clientIndex) => (
                    <div key={clientIndex} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{client.nomClient}</span>
                      <span className="text-sm text-gray-600">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2025)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de détails commercial */}
      {selectedCommercial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Détails Commercial</h3>
              <button
                onClick={() => setSelectedCommercial(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCommercial.nom}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCommercial.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Région</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCommercial.region}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Clients gérés</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCommercial.nombreClients}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-800 mb-2">Clients assignés</h4>
                <div className="max-h-40 overflow-y-auto">
                  {selectedCommercial.clients.map((clientCode, index) => (
                    <div key={index} className="text-sm text-gray-600 py-1">
                      {clientCode}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

