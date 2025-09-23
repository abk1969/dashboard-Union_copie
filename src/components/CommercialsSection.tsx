import React, { useState } from 'react';
import { CommercialPerformance } from '../types';
import CommercialDetailModal from './CommercialDetailModal';

interface CommercialsSectionProps {
  commercialsPerformance: CommercialPerformance[];
}

const CommercialsSection: React.FC<CommercialsSectionProps> = ({
  commercialsPerformance
}) => {
  const [selectedCommercial, setSelectedCommercial] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'ca' | 'progression' | 'clients'>('ca');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">💼 Commerciaux</h2>
          <p className="text-gray-600 mt-1">
            Performance et analyse des commerciaux Union
          </p>
        </div>
        
        {/* Contrôles de tri */}
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ca">Trier par CA</option>
            <option value="progression">Trier par Progression</option>
            <option value="clients">Trier par Clients</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
          >
            {sortOrder === 'desc' ? '↓ Décroissant' : '↑ Croissant'}
          </button>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
          <div className="text-blue-100 text-sm font-medium">Total Commerciaux</div>
          <div className="text-2xl font-bold">{commercialsPerformance.length}</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
          <div className="text-green-100 text-sm font-medium">CA Total 2025</div>
          <div className="text-2xl font-bold">
            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
              commercialsPerformance.reduce((sum, c) => sum + c.ca2025, 0)
            )}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
          <div className="text-purple-100 text-sm font-medium">Clients Uniques</div>
          <div className="text-2xl font-bold">
            {commercialsPerformance.reduce((sum, c) => sum + c.clientsUniques, 0)}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl">
          <div className="text-orange-100 text-sm font-medium">Progression Moyenne</div>
          <div className="text-2xl font-bold">
            {commercialsPerformance.length > 0 
              ? `${(commercialsPerformance.reduce((sum, c) => sum + c.progression, 0) / commercialsPerformance.length).toFixed(1)}%`
              : '0%'
            }
          </div>
        </div>
      </div>

      {/* Liste des commerciaux */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commercial</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2024</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2025</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">% Total</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Clients</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {commercialsPerformance.map((commercial, index) => (
                <tr 
                  key={commercial.agentUnion} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedCommercial(commercial.agentUnion)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {commercial.photo ? (
                          <img 
                            className="h-10 w-10 rounded-full object-cover" 
                            src={commercial.photo} 
                            alt={`${commercial.prenom} ${commercial.nom}`}
                            onError={(e) => {
                              console.log(`❌ Erreur chargement photo pour ${commercial.prenom}:`, commercial.photo);
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm ${commercial.photo ? 'hidden' : ''}`}>
                          {commercial.prenom.charAt(0)}{commercial.nom.charAt(0)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {commercial.prenom} {commercial.nom}
                        </div>
                        <div className="text-sm text-gray-500">
                          {commercial.email || commercial.mailAgent}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(commercial.ca2024)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(commercial.ca2025)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      commercial.progression > 5 ? 'bg-green-100 text-green-800' :
                      commercial.progression < -5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {getStatusIcon(commercial.progression)} {commercial.progression >= 0 ? '+' : ''}{commercial.progression.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                    {commercial.pourcentageTotal.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                    {commercial.clientsUniques}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCommercial(commercial.agentUnion);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium"
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

      {/* Modal de détail du commercial */}
      {selectedCommercial && (
        <CommercialDetailModal
          commercial={commercialsPerformance.find(c => c.agentUnion === selectedCommercial) || null}
          isOpen={!!selectedCommercial}
          onClose={() => setSelectedCommercial(null)}
        />
      )}
    </div>
  );
};

export default CommercialsSection;