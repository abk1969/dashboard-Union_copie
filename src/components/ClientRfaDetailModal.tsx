import React from 'react';
import { 
  ClientRfaResume, 
  RfaConfiguration, 
  AdherentData 
} from '../types';
import { formatCurrency, formatPercentageDirect } from '../utils/formatters';

interface ClientRfaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientRfa: ClientRfaResume;
  rfaConfig: RfaConfiguration;
  adherentsData: AdherentData[];
}

const ClientRfaDetailModal: React.FC<ClientRfaDetailModalProps> = ({
  isOpen,
  onClose,
  clientRfa,
  rfaConfig,
  adherentsData
}) => {
  if (!isOpen) return null;

  // Trouver les informations du client
  const clientData = adherentsData.find(a => a.codeUnion === clientRfa.codeUnion);
  const contrat = rfaConfig.contratsStandard.find(c => c.id === clientRfa.contratStandard);

  // Calculer les totaux par fournisseur
  const fournisseursData = ['Alliance', 'DCA', 'Exadis', 'ACR'].map(fournisseur => {
    const caTotal = adherentsData
      .filter(f => f.codeUnion === clientRfa.codeUnion && f.fournisseur === fournisseur && f.annee === 2025) // Filtrer uniquement sur 2025
      .reduce((sum, f) => sum + f.ca, 0);
    
    const rfaCalcul = clientRfa.tripartites.find(t => t.fournisseur === fournisseur);
    
    return {
      fournisseur,
      caTotal,
      rfaCalcul
    };
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">💰 Détail RFA Client</h2>
              <p className="text-blue-100 mt-1">
                {clientData?.raisonSociale || clientRfa.codeUnion} - {contrat?.nom || 'Contrat non défini'}
              </p>
              <p className="text-blue-200 text-sm mt-1">
                📅 Calculs basés uniquement sur l'année 2025
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

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          {/* Résumé global */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">📊 RFA Total</h3>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(clientRfa.rfaTotal)}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-2">🎁 Bonus Total</h3>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(clientRfa.bonusTotal)}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-800 mb-2">💎 Total Général</h3>
              <p className="text-3xl font-bold text-purple-600">{formatCurrency(clientRfa.rfaTotal + clientRfa.bonusTotal)}</p>
            </div>
          </div>

          {/* Détails par fournisseur */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">🏢 Détails par Fournisseur</h3>
            
            {fournisseursData.map(({ fournisseur, caTotal, rfaCalcul }) => (
              <div key={fournisseur} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">{fournisseur}</h4>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">CA Total</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(caTotal)}</p>
                  </div>
                </div>

                {rfaCalcul ? (
                  <div className="space-y-4">
                    {/* RFA Standard */}
                    {rfaCalcul.rfaStandard && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h5 className="font-semibold text-blue-800 mb-2">�� RFA Standard</h5>
                        
                        {/* Indicateur du palier */}
                        <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mb-4">
                          <p className="text-sm font-medium text-blue-800">
                            🎯 Palier sélectionné : {formatCurrency(rfaCalcul.rfaStandard.palier.min)}€ - {rfaCalcul.rfaStandard.palier.max ? formatCurrency(rfaCalcul.rfaStandard.palier.max) + '€' : '∞'}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            CA client : {formatCurrency(caTotal)}€ → Palier {rfaCalcul.rfaStandard.palier.min >= 100000 ? 'élevé' : rfaCalcul.rfaStandard.palier.min >= 50000 ? 'moyen' : 'débutant'}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Palier</p>
                            <p className="font-medium">
                              {formatCurrency(rfaCalcul.rfaStandard.palier.min)} - {rfaCalcul.rfaStandard.palier.max ? formatCurrency(rfaCalcul.rfaStandard.palier.max) : '∞'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Taux RFA</p>
                            <p className="font-medium">{formatPercentageDirect(rfaCalcul.rfaStandard.palier.pourcentageRfa)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Taux Bonus</p>
                            <p className="font-medium">{formatPercentageDirect(rfaCalcul.rfaStandard.palier.pourcentageBonus)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Montant RFA</p>
                            <p className="font-medium text-blue-600">{formatCurrency(rfaCalcul.rfaStandard.montantRfa)}</p>
                          </div>
                        </div>
                        
                        {/* Détail du calcul */}
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <p className="text-xs text-blue-600">
                            💡 Calcul : {formatCurrency(caTotal)} × {formatPercentageDirect(rfaCalcul.rfaStandard.palier.pourcentageRfa)}% = {formatCurrency(rfaCalcul.rfaStandard.montantRfa)}
                          </p>
                        </div>
                        
                        {rfaCalcul.rfaStandard.montantBonus > 0 && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-sm text-gray-600">Bonus Groupement: <span className="font-medium text-green-600">{formatCurrency(rfaCalcul.rfaStandard.montantBonus)}</span></p>
                            <p className="text-xs text-green-600">
                              💡 Calcul : {formatCurrency(caTotal)} × {formatPercentageDirect(rfaCalcul.rfaStandard.palier.pourcentageBonus)}% = {formatCurrency(rfaCalcul.rfaStandard.montantBonus)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* RFA TRIPARTITE */}
                    {rfaCalcul.rfaTripartite && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h5 className="font-semibold text-purple-800 mb-2">🔗 RFA TRIPARTITE</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Type</p>
                            <p className="font-medium">
                              {rfaCalcul.rfaTripartite.palier.marque ? `Marque: ${rfaCalcul.rfaTripartite.palier.marque}` : `Famille: ${rfaCalcul.rfaTripartite.palier.famille}`}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Seuil</p>
                            <p className="font-medium">≥ {formatCurrency(rfaCalcul.rfaTripartite.palier.seuilMin)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">% TRIPARTITE</p>
                            <p className="font-medium">{formatPercentageDirect(rfaCalcul.rfaTripartite.palier.pourcentage)}%</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-purple-200">
                          <p className="text-sm text-gray-600">Montant TRIPARTITE: <span className="font-medium text-purple-600">{formatCurrency(rfaCalcul.rfaTripartite.montantRfa)}</span></p>
                        </div>
                      </div>
                    )}

                    {/* Résumé du fournisseur */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <h5 className="font-semibold text-gray-800">Total {fournisseur}</h5>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(rfaCalcul?.montantTotalRfa || 0)}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Contrat appliqué: <span className="font-medium">{rfaCalcul?.contratApplique === 'tripartite' ? 'TRIPARTITE' : 'Standard'}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Aucun contrat RFA appliqué</p>
                    <p className="text-sm">CA insuffisant ou contrat non configuré</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Informations du contrat */}
          {contrat && (
            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">📋 Informations du Contrat</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-yellow-800 mb-2">Contrat: {contrat.nom}</h4>
                  <p className="text-sm text-yellow-700">{contrat.description}</p>
                </div>
                <div>
                  <h4 className="font-medium text-yellow-800 mb-2">Seuils RFA</h4>
                  <div className="space-y-2">
                    {contrat.seuils.map((seuil, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {formatCurrency(seuil.min)} - {seuil.max ? formatCurrency(seuil.max) : '∞'}
                        </span>
                        <span className="font-medium">
                          {formatPercentageDirect(seuil.pourcentageRfa)}% RFA + {formatPercentageDirect(seuil.pourcentageBonus)}% Bonus
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientRfaDetailModal;
