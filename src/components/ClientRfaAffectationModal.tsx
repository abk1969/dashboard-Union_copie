import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClientRfaAffectation, 
  RfaConfiguration, 
  RfaContratStandard 
} from '../types';

interface ClientRfaAffectationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (affectations: ClientRfaAffectation[]) => void;
  clients: { codeUnion: string; raisonSociale: string }[];
  rfaConfig: RfaConfiguration;
  initialAffectations?: ClientRfaAffectation[];
}

const ClientRfaAffectationModal: React.FC<ClientRfaAffectationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  clients,
  rfaConfig,
  initialAffectations = []
}) => {
  const [affectations, setAffectations] = useState<ClientRfaAffectation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupe, setSelectedGroupe] = useState('');

  // Créer un Map des affectations initiales pour un accès rapide
  const initialAffectationsMap = useMemo(() => {
    return new Map(initialAffectations.map(a => [a.codeUnion, a]));
  }, [initialAffectations]);

  // Créer un Map des clients pour un accès rapide
  const clientsMap = useMemo(() => {
    return new Map(clients.map(client => [client.codeUnion, client]));
  }, [clients]);

  useEffect(() => {
    // Initialiser les affectations pour tous les clients seulement si nécessaire
    if (clients.length > 0 && rfaConfig.contratsStandard.length > 0) {
      const newAffectations = clients.map(client => {
        const existing = initialAffectationsMap.get(client.codeUnion);
        if (existing) {
          return existing;
        }
        
        // Créer une nouvelle affectation par défaut
        return {
          codeUnion: client.codeUnion,
          contratStandard: rfaConfig.contratsStandard[0]?.id || '',
          tripartites: []
        };
      });
      
      setAffectations(newAffectations);
    }
  }, [clients.length, rfaConfig.contratsStandard.length, initialAffectationsMap]);

  const handleSave = () => {
    onSave(affectations);
    onClose();
  };

  const updateClientContrat = (codeUnion: string, contratId: string) => {
    setAffectations(prev => 
      prev.map(a => 
        a.codeUnion === codeUnion 
          ? { ...a, contratStandard: contratId }
          : a
      )
    );
  };

  const toggleTripartite = (codeUnion: string, fournisseur: string, marque?: string, famille?: string) => {
    setAffectations(prev => 
      prev.map(a => {
        if (a.codeUnion !== codeUnion) return a;
        
        const existingIndex = a.tripartites.findIndex(t => 
          t.fournisseur === fournisseur && 
          t.marque === marque && 
          t.famille === famille
        );
        
        if (existingIndex >= 0) {
          // Retirer le tripartite
          return {
            ...a,
            tripartites: a.tripartites.filter((_, i) => i !== existingIndex)
          };
        } else {
          // Ajouter le tripartite
          return {
            ...a,
            tripartites: [...a.tripartites, { fournisseur, marque, famille, actif: true }]
          };
        }
      })
    );
  };

  const isTripartiteActive = (codeUnion: string, fournisseur: string, marque?: string, famille?: string) => {
    const client = affectations.find(a => a.codeUnion === codeUnion);
    return client?.tripartites.some(t => 
      t.fournisseur === fournisseur && 
      t.marque === marque && 
      t.famille === famille
    ) || false;
  };

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = client.raisonSociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.codeUnion.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [clients, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">👥 Affectation RFA Clients</h2>
              <p className="text-green-100 mt-1">
                Gestion des contrats et accords TRIPARTITE par client
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-50 p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Rechercher par nom ou code Union..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="text-sm text-gray-600">
              {filteredClients.length} client(s) trouvé(s) sur {clients.length}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">📋 Instructions</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• <strong>Contrat Standard :</strong> Sélectionnez le contrat principal pour chaque client</li>
                <li>• <strong>TRIPARTITE :</strong> Cochez les accords spéciaux applicables au client</li>
                <li>• <strong>Note :</strong> Un client ne peut avoir qu'un seul contrat standard actif</li>
              </ul>
            </div>

            {/* Clients Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 border border-gray-200 text-left text-sm font-medium text-gray-700">
                      Client
                    </th>
                    <th className="px-4 py-3 border border-gray-200 text-left text-sm font-medium text-gray-700">
                      Contrat Standard
                    </th>
                    <th className="px-4 py-3 border border-gray-200 text-center text-sm font-medium text-gray-700">
                      ALLIANCE
                    </th>
                    <th className="px-4 py-3 border border-gray-200 text-center text-sm font-medium text-gray-700">
                      DCA
                    </th>
                    <th className="px-4 py-3 border border-gray-200 text-center text-sm font-medium text-gray-700">
                      EXADIS
                    </th>
                    <th className="px-4 py-3 border border-gray-200 text-center text-sm font-medium text-gray-700">
                      ACR
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClients.map((client) => {
                    const affectation = affectations.find(a => a.codeUnion === client.codeUnion);
                    
                    return (
                      <tr key={client.codeUnion} className="hover:bg-gray-50">
                        {/* Client Info */}
                        <td className="px-4 py-3 border border-gray-200">
                          <div>
                            <div className="font-medium text-gray-900">{client.raisonSociale}</div>
                            <div className="text-sm text-gray-500">{client.codeUnion}</div>
                          </div>
                        </td>

                        {/* Contrat Standard */}
                        <td className="px-4 py-3 border border-gray-200">
                          <select
                            value={affectation?.contratStandard || ''}
                            onChange={(e) => updateClientContrat(client.codeUnion, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Sélectionner</option>
                            {rfaConfig.contratsStandard.map(contrat => (
                              <option key={contrat.id} value={contrat.id}>
                                {contrat.nom}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* ALLIANCE TRIPARTITE */}
                        <td className="px-4 py-3 border border-gray-200 text-center">
                          <div className="space-y-2">
                            {rfaConfig.tripartites
                              .filter(t => t.fournisseur === 'Alliance' && t.marque)
                              .map((tripartite, index) => (
                                <label key={index} className="flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    checked={isTripartiteActive(client.codeUnion, 'Alliance', tripartite.marque)}
                                    onChange={() => toggleTripartite(client.codeUnion, 'Alliance', tripartite.marque)}
                                    className="mr-2"
                                  />
                                  <span className="text-xs">{tripartite.marque}</span>
                                </label>
                              ))}
                          </div>
                        </td>

                        {/* DCA TRIPARTITE */}
                        <td className="px-4 py-3 border border-gray-200 text-center">
                          <div className="space-y-2">
                            {rfaConfig.tripartites
                              .filter(t => t.fournisseur === 'DCA' && t.marque)
                              .map((tripartite, index) => (
                                <label key={index} className="flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    checked={isTripartiteActive(client.codeUnion, 'DCA', tripartite.marque)}
                                    onChange={() => toggleTripartite(client.codeUnion, 'DCA', tripartite.marque)}
                                    className="mr-2"
                                  />
                                  <span className="text-xs">{tripartite.marque}</span>
                                </label>
                              ))}
                          </div>
                        </td>

                        {/* EXADIS TRIPARTITE */}
                        <td className="px-4 py-3 border border-gray-200 text-center">
                          <div className="space-y-2">
                            {rfaConfig.tripartites
                              .filter(t => t.fournisseur === 'Exadis' && t.famille)
                              .map((tripartite, index) => (
                                <label key={index} className="flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    checked={isTripartiteActive(client.codeUnion, 'Exadis', undefined, tripartite.famille)}
                                    onChange={() => toggleTripartite(client.codeUnion, 'Exadis', undefined, tripartite.famille)}
                                    className="mr-2"
                                  />
                                  <span className="text-xs">{tripartite.famille}</span>
                                </label>
                              ))}
                          </div>
                        </td>

                        {/* ACR TRIPARTITE */}
                        <td className="px-4 py-3 border border-gray-200 text-center">
                          <div className="space-y-2">
                            {rfaConfig.tripartites
                              .filter(t => t.fournisseur === 'ACR' && t.famille)
                              .map((tripartite, index) => (
                                <label key={index} className="flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    checked={isTripartiteActive(client.codeUnion, 'ACR', undefined, tripartite.famille)}
                                    onChange={() => toggleTripartite(client.codeUnion, 'ACR', undefined, tripartite.famille)}
                                    className="mr-2"
                                  />
                                  <span className="text-xs">{tripartite.famille}</span>
                                </label>
                              ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Affectation RFA - {affectations.filter(a => a.contratStandard).length} client(s) avec contrat assigné
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
              >
                💾 Sauvegarder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientRfaAffectationModal;
