import React, { useState } from 'react';
import { CommercialPerformance } from '../types';

interface CommercialDetailModalProps {
  commercial: CommercialPerformance | null;
  isOpen: boolean;
  onClose: () => void;
}

const CommercialDetailModal: React.FC<CommercialDetailModalProps> = ({
  commercial,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'familles' | 'marques' | 'fournisseurs' | 'regions'>('overview');

  if (!isOpen || !commercial) return null;

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-75 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center overflow-hidden">
                {commercial.photo ? (
                  <img 
                    src={commercial.photo} 
                    alt={`${commercial.prenom} ${commercial.nom}`}
                    className="w-16 h-16 rounded-full object-cover"
                    onError={(e) => {
                      console.log(`❌ Erreur chargement photo pour ${commercial.prenom}:`, commercial.photo);
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <span className={`text-2xl font-bold ${commercial.photo ? 'hidden' : ''}`}>
                  {commercial.prenom.charAt(0)}{commercial.nom.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                  {commercial.prenom} {commercial.nom}
                </h2>
                <p className="text-blue-100 text-sm sm:text-base">
                  {commercial.email || commercial.mailAgent} • {commercial.clientsUniques} clients
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
              { id: 'clients', label: 'Clients', icon: '👥' },
              { id: 'familles', label: 'Familles', icon: '📦' },
              { id: 'marques', label: 'Marques', icon: '🏷️' },
              { id: 'fournisseurs', label: 'Fournisseurs', icon: '🏢' },
              { id: 'regions', label: 'Régions', icon: '🌍' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
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
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Métriques principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                  <div className="text-blue-100 text-sm font-medium">CA 2024</div>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(commercial.ca2024)}
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
                  <div className="text-green-100 text-sm font-medium">CA 2025</div>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(commercial.ca2025)}
                  </div>
                </div>
                
                <div className={`p-6 rounded-xl text-white ${
                  commercial.progression > 0 
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
                    : commercial.progression < 0 
                    ? 'bg-gradient-to-br from-red-500 to-red-600' 
                    : 'bg-gradient-to-br from-gray-500 to-gray-600'
                }`}>
                  <div className="text-sm font-medium opacity-90">Progression</div>
                  <div className="text-2xl font-bold mb-3">
                    {getStatusIcon(commercial.progression)} {commercial.progression >= 0 ? '+' : ''}{commercial.progression}%
                  </div>
                  {/* Barre de progression */}
                  <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        commercial.progression > 0 
                          ? 'bg-gradient-to-r from-green-300 to-green-400' 
                          : commercial.progression < 0 
                          ? 'bg-gradient-to-r from-red-300 to-red-400' 
                          : 'bg-gradient-to-r from-gray-300 to-gray-400'
                      }`}
                      style={{ 
                        width: `${Math.min(Math.abs(commercial.progression), 100)}%`,
                        marginLeft: commercial.progression < 0 ? `${100 - Math.min(Math.abs(commercial.progression), 100)}%` : '0%'
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                  <div className="text-purple-100 text-sm font-medium">Clients Uniques</div>
                  <div className="text-2xl font-bold">{commercial.clientsUniques}</div>
                </div>
              </div>

              {/* Top performers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Client</h3>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Client</div>
                    <div className="font-medium">{commercial.topClient.raisonSociale}</div>
                    <div className="text-sm text-gray-600">Code Union</div>
                    <div className="font-mono text-sm">{commercial.topClient.codeUnion}</div>
                    <div className="text-sm text-gray-600">CA Total</div>
                    <div className="font-bold text-lg">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(commercial.topClient.ca)}
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📦 Top Famille</h3>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Famille</div>
                    <div className="font-medium">{commercial.topFamille.famille}</div>
                    <div className="text-sm text-gray-600">CA Total</div>
                    <div className="font-bold text-lg">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(commercial.topFamille.ca)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistiques détaillées */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Statistiques Détaillées</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{commercial.famillesUniques}</div>
                    <div className="text-sm text-gray-600">Familles</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{commercial.marquesUniques}</div>
                    <div className="text-sm text-gray-600">Marques</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{commercial.fournisseursUniques}</div>
                    <div className="text-sm text-gray-600">Fournisseurs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{commercial.regionsUniques}</div>
                    <div className="text-sm text-gray-600">Régions</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clients' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">👥 Clients ({commercial.clientsUniques})</h3>
              
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Groupe</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Région</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2024</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2025</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {commercial.clients.map((client, index) => (
                        <tr key={client.codeUnion} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{client.raisonSociale}</div>
                              <div className="text-sm text-gray-500 font-mono">{client.codeUnion}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.groupeClient}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.regionCommerciale || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2024)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2025)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              client.progression > 5 ? 'bg-green-100 text-green-800' :
                              client.progression < -5 ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {client.progression >= 0 ? '+' : ''}{client.progression}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.pourcentageTotal}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'familles' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">📦 Familles ({commercial.famillesUniques})</h3>
              
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Famille</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2024</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2025</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clients</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {commercial.familles.map((famille, index) => (
                        <tr key={famille.famille} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{famille.famille}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(famille.ca2024)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(famille.ca2025)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              famille.progression > 5 ? 'bg-green-100 text-green-800' :
                              famille.progression < -5 ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {famille.progression >= 0 ? '+' : ''}{famille.progression}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{famille.pourcentageTotal}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{famille.clients}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'marques' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">🏷️ Marques ({commercial.marquesUniques})</h3>
              
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marque</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseur</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2024</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2025</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clients</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {commercial.marques.map((marque, index) => (
                        <tr key={marque.marque} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{marque.marque}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{marque.fournisseur || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(marque.ca2024)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(marque.ca2025)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              marque.progression > 5 ? 'bg-green-100 text-green-800' :
                              marque.progression < -5 ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {marque.progression >= 0 ? '+' : ''}{marque.progression}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{marque.pourcentageTotal}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{marque.clients}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fournisseurs' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">🏢 Fournisseurs ({commercial.fournisseursUniques})</h3>
              
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseur</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2024</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2025</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clients</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {commercial.fournisseurs.map((fournisseur, index) => (
                        <tr key={fournisseur.fournisseur} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fournisseur.fournisseur}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(fournisseur.ca2024)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(fournisseur.ca2025)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              fournisseur.progression > 5 ? 'bg-green-100 text-green-800' :
                              fournisseur.progression < -5 ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {fournisseur.progression >= 0 ? '+' : ''}{fournisseur.progression}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fournisseur.pourcentageTotal}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fournisseur.clients}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'regions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">🌍 Régions ({commercial.regionsUniques})</h3>
              
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Région</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2024</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2025</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clients</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {commercial.regions.map((region, index) => (
                        <tr key={region.region} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{region.region}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(region.ca2024)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(region.ca2025)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              region.progression > 5 ? 'bg-green-100 text-green-800' :
                              region.progression < -5 ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {region.progression >= 0 ? '+' : ''}{region.progression}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{region.pourcentageTotal}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{region.clients}</td>
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

export default CommercialDetailModal;