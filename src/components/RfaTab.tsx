import React from 'react';
import { 
  ClientRfaResume, 
  RfaCalcul, 
  RfaConfiguration,
  ClientRfaAffectation 
} from '../types';
import { formatCurrency } from '../utils/formatters';

interface RfaTabProps {
  clientCode: string;
  clientRfa: ClientRfaResume;
  rfaConfig: RfaConfiguration;
  clientAffectation: ClientRfaAffectation;
}

const RfaTab: React.FC<RfaTabProps> = ({
  clientCode,
  clientRfa,
  rfaConfig,
  clientAffectation
}) => {
  const contratStandard = rfaConfig.contratsStandard.find(c => c.id === clientAffectation.contratStandard);
  
  const getProgressionColor = (progression: number) => {
    if (progression > 0) return 'text-green-600';
    if (progression < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getProgressionIcon = (progression: number) => {
    if (progression > 0) return '↗️';
    if (progression < 0) return '↘️';
    return '→';
  };

  return (
    <div className="space-y-6">
      {/* Header avec résumé global */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(clientRfa.rfaTotal)}
            </div>
            <div className="text-sm text-gray-600">RFA Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(clientRfa.bonusTotal)}
            </div>
            <div className="text-sm text-gray-600">Bonus Groupement</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(clientRfa.rfaTotal + clientRfa.bonusTotal)}
            </div>
            <div className="text-sm text-gray-600">Total RFA + Bonus</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              📊 Progression
            </div>
            <div className="text-sm text-gray-600">Progression Globale</div>
          </div>
        </div>
      </div>

      {/* Informations du contrat */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Contrat RFA</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Contrat Standard</label>
            <div className="mt-1 text-lg font-semibold text-gray-900">
              {contratStandard?.nom || 'Aucun contrat assigné'}
            </div>
            {contratStandard?.description && (
              <div className="mt-1 text-sm text-gray-600">{contratStandard.description}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Statut</label>
            <div className="mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                contratStandard?.actif 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {contratStandard?.actif ? '✅ Actif' : '❌ Inactif'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Détail par fournisseur */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🏢 Détail par Fournisseur</h3>
        <div className="space-y-4">
          {clientRfa.tripartites.map((rfa, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-800">{rfa.fournisseur}</h4>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    CA: {formatCurrency(rfa.caTotal)}
                  </span>
                  <span className="text-sm font-medium text-gray-600">
                    CA: {formatCurrency(rfa.caTotal)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* RFA Standard */}
                {rfa.rfaStandard && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800">RFA Standard</span>
                      <span className="text-xs text-blue-600">
                        Palier: {rfa.rfaStandard.palier.min.toLocaleString()}€ - 
                        {rfa.rfaStandard.palier.max ? rfa.rfaStandard.palier.max.toLocaleString() + '€' : '∞'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">RFA ({rfa.rfaStandard.palier.pourcentageRfa}%)</span>
                        <span className="font-medium">{formatCurrency(rfa.rfaStandard.montantRfa)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Bonus ({rfa.rfaStandard.palier.pourcentageBonus}%)</span>
                        <span className="font-medium">{formatCurrency(rfa.rfaStandard.montantBonus)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(rfa.rfaStandard.progressionVersPalierSuivant, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        Progression vers palier suivant: {rfa.rfaStandard.progressionVersPalierSuivant.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}

                {/* RFA TRIPARTITE */}
                {rfa.rfaTripartite && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-800">RFA TRIPARTITE</span>
                      <span className="text-xs text-green-600">
                        Seuil: {rfa.rfaTripartite.palier.seuilMin.toLocaleString()}€
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          {rfa.rfaTripartite.palier.marque || rfa.rfaTripartite.palier.famille} 
                          ({rfa.rfaTripartite.palier.pourcentage}%)
                        </span>
                        <span className="font-medium">{formatCurrency(rfa.rfaTripartite.montantRfa)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${rfa.rfaTripartite.progressionVersPalierSuivant}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        Seuil atteint: {rfa.rfaTripartite.progressionVersPalierSuivant.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Total RFA pour ce fournisseur */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Total RFA {rfa.fournisseur}</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency(rfa.montantTotalRfa)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accords TRIPARTITE actifs */}
      {clientAffectation.tripartites.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🔗 Accords TRIPARTITE Actifs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientAffectation.tripartites.map((tripartite, index) => (
              <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-800">{tripartite.fournisseur}</span>
                  <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                    TRIPARTITE
                  </span>
                </div>
                <div className="text-sm text-gray-700">
                  {tripartite.marque && <div>Marque: <strong>{tripartite.marque}</strong></div>}
                  {tripartite.famille && <div>Famille: <strong>{tripartite.famille}</strong></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informations complémentaires */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-yellow-400 text-lg">💡</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Informations RFA</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Les RFA sont calculés sur le CA total par fournisseur de janvier à décembre</li>
                <li>Les accords TRIPARTITE s'appliquent en plus du contrat standard</li>
                <li>Le versement des RFA et bonus est effectué au plus tard le 30 juillet de l'année suivante</li>
                <li>La validation des préconisations est nécessaire pour le versement</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RfaTab;
