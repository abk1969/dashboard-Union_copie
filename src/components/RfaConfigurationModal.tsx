import React, { useState, useEffect } from 'react';
import { 
  RfaConfiguration, 
  RfaContratStandard, 
  RfaTripartite, 
  RfaSeuil 
} from '../types';
import { defaultRfaConfiguration } from '../data/rfaData';

interface RfaConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: RfaConfiguration) => void;
  initialConfig?: RfaConfiguration;
}

const RfaConfigurationModal: React.FC<RfaConfigurationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig = defaultRfaConfiguration
}) => {
  const [config, setConfig] = useState<RfaConfiguration>(initialConfig);
  const [activeTab, setActiveTab] = useState<'standard' | 'tripartite'>('standard');

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const addSeuil = (contratId: string) => {
    setConfig(prev => ({
      ...prev,
      contratsStandard: prev.contratsStandard.map(contrat => 
        contrat.id === contratId 
          ? { ...contrat, seuils: [...contrat.seuils, { min: 0, max: 0, pourcentageRfa: 0, pourcentageBonus: 0 }] }
          : contrat
      )
    }));
  };

  const updateSeuil = (contratId: string, index: number, field: keyof RfaSeuil, value: number | null) => {
    setConfig(prev => ({
      ...prev,
      contratsStandard: prev.contratsStandard.map(contrat => 
        contrat.id === contratId 
          ? {
              ...contrat,
              seuils: contrat.seuils.map((seuil, i) => 
                i === index ? { ...seuil, [field]: value } : seuil
              )
            }
          : contrat
      )
    }));
  };

  const removeSeuil = (contratId: string, index: number) => {
    setConfig(prev => ({
      ...prev,
      contratsStandard: prev.contratsStandard.map(contrat => 
        contrat.id === contratId 
          ? { ...contrat, seuils: contrat.seuils.filter((_, i) => i !== index) }
          : contrat
      )
    }));
  };

  const addTripartite = () => {
    const newTripartite: RfaTripartite = {
      fournisseur: '',
      seuilMin: 0,
      pourcentage: 0,
      actif: true
    };
    setConfig(prev => ({
      ...prev,
      tripartites: [...prev.tripartites, newTripartite]
    }));
  };

  const updateTripartite = (index: number, field: keyof RfaTripartite, value: any) => {
    setConfig(prev => ({
      ...prev,
      tripartites: prev.tripartites.map((t, i) => 
        i === index ? { ...t, [field]: value } : t
      )
    }));
  };

  const removeTripartite = (index: number) => {
    setConfig(prev => ({
      ...prev,
      tripartites: prev.tripartites.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">⚙️ Configuration RFA</h2>
              <p className="text-blue-100 mt-1">
                Gestion des contrats standards et accords TRIPARTITE
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

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('standard')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'standard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📋 Contrats Standards
            </button>
            <button
              onClick={() => setActiveTab('tripartite')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tripartite'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔗 Accords TRIPARTITE
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Contrats Standards */}
          {activeTab === 'standard' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800">📋 Contrats Standards</h3>
                <button
                  onClick={() => {
                    const newContrat: RfaContratStandard = {
                      id: `contrat-${Date.now()}`,
                      nom: 'Nouveau Contrat',
                      description: 'Description du nouveau contrat',
                      actif: true,
                      seuils: []
                    };
                    setConfig(prev => ({
                      ...prev,
                      contratsStandard: [...prev.contratsStandard, newContrat]
                    }));
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  ➕ Nouveau Contrat
                </button>
              </div>

              {config.contratsStandard.map((contrat, contratIndex) => (
                <div key={contrat.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={contrat.nom}
                        onChange={(e) => {
                          const newContrats = [...config.contratsStandard];
                          newContrats[contratIndex].nom = e.target.value;
                          setConfig(prev => ({ ...prev, contratsStandard: newContrats }));
                        }}
                        className="text-xl font-bold text-gray-900 border-b border-transparent focus:border-blue-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={contrat.description}
                        onChange={(e) => {
                          const newContrats = [...config.contratsStandard];
                          newContrats[contratIndex].description = e.target.value;
                          setConfig(prev => ({ ...prev, contratsStandard: newContrats }));
                        }}
                        className="text-gray-600 border-b border-transparent focus:border-blue-500 focus:outline-none w-full mt-1"
                      />
                    </div>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={contrat.actif}
                          onChange={(e) => {
                            const newContrats = [...config.contratsStandard];
                            newContrats[contratIndex].actif = e.target.checked;
                            setConfig(prev => ({ ...prev, contratsStandard: newContrats }));
                          }}
                          className="mr-2"
                        />
                        Actif
                      </label>
                      <button
                        onClick={() => {
                          setConfig(prev => ({
                            ...prev,
                            contratsStandard: prev.contratsStandard.filter((_, i) => i !== contratIndex)
                          }));
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>

                  {/* Seuils */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-800">Seuils et Pourcentages</h4>
                      <button
                        onClick={() => addSeuil(contrat.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        ➕ Seuil
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 border border-gray-200">Min (€)</th>
                            <th className="px-4 py-2 border border-gray-200">Max (€)</th>
                            <th className="px-4 py-2 border border-gray-200">% RFA</th>
                            <th className="px-4 py-2 border border-gray-200">% Bonus</th>
                            <th className="px-4 py-2 border border-gray-200">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contrat.seuils.map((seuil, seuilIndex) => (
                            <tr key={seuilIndex}>
                              <td className="px-4 py-2 border border-gray-200">
                                <input
                                  type="number"
                                  value={seuil.min}
                                  onChange={(e) => updateSeuil(contrat.id, seuilIndex, 'min', parseFloat(e.target.value) || 0)}
                                  className="w-full border-none focus:ring-2 focus:ring-blue-500 rounded"
                                />
                              </td>
                              <td className="px-4 py-2 border border-gray-200">
                                <input
                                  type="number"
                                  value={seuil.max || ''}
                                  onChange={(e) => updateSeuil(contrat.id, seuilIndex, 'max', e.target.value ? parseFloat(e.target.value) : null)}
                                  placeholder="∞"
                                  className="w-full border-none focus:ring-2 focus:ring-blue-500 rounded"
                                />
                              </td>
                              <td className="px-4 py-2 border border-gray-200">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={seuil.pourcentageRfa}
                                  onChange={(e) => updateSeuil(contrat.id, seuilIndex, 'pourcentageRfa', parseFloat(e.target.value) || 0)}
                                  className="w-full border-none focus:ring-2 focus:ring-blue-500 rounded"
                                />
                              </td>
                              <td className="px-4 py-2 border border-gray-200">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={seuil.pourcentageBonus}
                                  onChange={(e) => updateSeuil(contrat.id, seuilIndex, 'pourcentageBonus', parseFloat(e.target.value) || 0)}
                                  className="w-full border-none focus:ring-2 focus:ring-blue-500 rounded"
                                />
                              </td>
                              <td className="px-4 py-2 border border-gray-200">
                                <button
                                  onClick={() => removeSeuil(contrat.id, seuilIndex)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Accords TRIPARTITE */}
          {activeTab === 'tripartite' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800">🔗 Accords TRIPARTITE</h3>
                <button
                  onClick={addTripartite}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  ➕ Nouvel Accord
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 border border-gray-200">Fournisseur</th>
                      <th className="px-4 py-2 border border-gray-200">Marque</th>
                      <th className="px-4 py-2 border border-gray-200">Famille</th>
                      <th className="px-4 py-2 border border-gray-200">Seuil Min (€)</th>
                      <th className="px-4 py-2 border border-gray-200">% RFA</th>
                      <th className="px-4 py-2 border border-gray-200">Actif</th>
                      <th className="px-4 py-2 border border-gray-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.tripartites.map((tripartite, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 border border-gray-200">
                          <select
                            value={tripartite.fournisseur}
                            onChange={(e) => updateTripartite(index, 'fournisseur', e.target.value)}
                            className="w-full border-none focus:ring-2 focus:ring-blue-500 rounded"
                          >
                            <option value="">Sélectionner</option>
                            <option value="Alliance">Alliance</option>
                            <option value="DCA">DCA</option>
                            <option value="Exadis">Exadis</option>
                            <option value="ACR">ACR</option>
                          </select>
                        </td>
                        <td className="px-4 py-2 border border-gray-200">
                          <input
                            type="text"
                            value={tripartite.marque || ''}
                            onChange={(e) => updateTripartite(index, 'marque', e.target.value)}
                            placeholder="Marque (optionnel)"
                            className="w-full border-none focus:ring-2 focus:ring-blue-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-2 border border-gray-200">
                          <select
                            value={tripartite.famille || ''}
                            onChange={(e) => updateTripartite(index, 'famille', e.target.value)}
                            className="w-full border-none focus:ring-2 focus:ring-blue-500 rounded"
                          >
                            <option value="">Aucune famille</option>
                            <option value="freinage">Freinage</option>
                            <option value="embrayage">Embrayage</option>
                            <option value="filtre">Filtre</option>
                            <option value="distribution">Distribution</option>
                            <option value="etancheite moteur">Étanchéité Moteur</option>
                            <option value="thermique">Thermique</option>
                          </select>
                        </td>
                        <td className="px-4 py-2 border border-gray-200">
                          <input
                            type="number"
                            value={tripartite.seuilMin}
                            onChange={(e) => updateTripartite(index, 'seuilMin', parseFloat(e.target.value) || 0)}
                            className="w-full border-none focus:ring-2 focus:ring-blue-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-2 border border-gray-200">
                          <input
                            type="number"
                            step="0.1"
                            value={tripartite.pourcentage}
                            onChange={(e) => updateTripartite(index, 'pourcentage', parseFloat(e.target.value) || 0)}
                            className="w-full border-none focus:ring-2 focus:ring-blue-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-2 border border-gray-200">
                          <input
                            type="checkbox"
                            checked={tripartite.actif}
                            onChange={(e) => updateTripartite(index, 'actif', e.target.checked)}
                            className="mx-auto block"
                          />
                        </td>
                        <td className="px-4 py-2 border border-gray-200">
                          <button
                            onClick={() => removeTripartite(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Configuration RFA - {config.contratsStandard.length} contrat(s) standard, {config.tripartites.length} accord(s) TRIPARTITE
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
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
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

export default RfaConfigurationModal;
