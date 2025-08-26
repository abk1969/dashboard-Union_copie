import React, { useState, useEffect } from 'react';
import { 
  RfaConfiguration, 
  ClientRfaAffectation,
  ClientRfaResume,
  AdherentData,
  TripartiteMapping
} from '../types';
import { defaultRfaConfiguration, defaultTripartiteMapping } from '../data/rfaData';
import { calculerRfaStandard, calculerRfaTripartite, getFamilleFromSousFamille, calculerRfaTripartiteParColonne } from '../data/rfaData';
import RfaConfigurationModal from './RfaConfigurationModal';
import ClientRfaAffectationModal from './ClientRfaAffectationModal';
import ClientRfaDetailModal from './ClientRfaDetailModal';
import TripartiteMappingModal from './TripartiteMappingModal';
import { formatCurrency, formatProgression } from '../utils/formatters';

interface RfaManagerProps {
  adherentsData: AdherentData[];
}

const RfaManager: React.FC<RfaManagerProps> = ({ adherentsData }) => {
  const [rfaConfig, setRfaConfig] = useState<RfaConfiguration>(defaultRfaConfiguration);
  const [clientAffectations, setClientAffectations] = useState<ClientRfaAffectation[]>([]);
  const [clientRfaResumes, setClientRfaResumes] = useState<ClientRfaResume[]>([]);
  const [tripartiteMappings, setTripartiteMappings] = useState<TripartiteMapping[]>(defaultTripartiteMapping);
  
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAffectationModal, setShowAffectationModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTripartiteModal, setShowTripartiteModal] = useState(false);
  const [selectedClientRfa, setSelectedClientRfa] = useState<ClientRfaResume | null>(null);

  // Calculer les RFA pour tous les clients
  useEffect(() => {
    if (adherentsData.length > 0 && clientAffectations.length > 0) {
      // Extraire les clients uniques
      const clientsUniques = Array.from(new Set(adherentsData.map(a => a.codeUnion)));
      
      const resumes = clientsUniques.map(codeUnion => {
        const affectation = clientAffectations.find(a => a.codeUnion === codeUnion);
        if (!affectation || !affectation.contratStandard) {
          return {
            codeUnion: codeUnion,
            contratStandard: '',
            rfaTotal: 0,
            bonusTotal: 0,
            tripartites: [],
            progressionGlobale: 0
          };
        }

        const contrat = rfaConfig.contratsStandard.find(c => c.id === affectation.contratStandard);
        if (!contrat) return null;

        // Calculer RFA par fournisseur - UNIQUEMENT sur 2025
        const fournisseurs = ['Alliance', 'DCA', 'Exadis', 'ACR'];
        const rfaCalculs = fournisseurs.map(fournisseur => {
          // Calculer CA total pour ce fournisseur - UNIQUEMENT 2025
          const caTotal = adherentsData
            .filter(f => f.codeUnion === codeUnion && f.fournisseur === fournisseur && f.annee === 2025)
            .reduce((sum, f) => sum + f.ca, 0);

          // RFA Standard
          const rfaStandard = calculerRfaStandard(caTotal, contrat.seuils);
          
          // RFA TRIPARTITE
          let rfaTripartite = null;
          const tripartiteActive = affectation.tripartites.find(t => t.fournisseur === fournisseur);
          
          if (tripartiteActive) {
            // Utiliser la nouvelle fonction basée sur les colonnes d'import
            rfaTripartite = calculerRfaTripartiteParColonne(
              adherentsData,
              codeUnion,
              fournisseur,
              tripartiteMappings, // Utiliser le mapping des colonnes configuré
              2025
            );
          }

          // Calculer le total RFA pour ce fournisseur
          let montantTotalRfa = 0;
          if (rfaStandard) {
            montantTotalRfa += rfaStandard.montantRfa + rfaStandard.montantBonus;
          }
          if (rfaTripartite) {
            montantTotalRfa += rfaTripartite.montantRfa;
          }

          return {
            fournisseur,
            caTotal,
            contratApplique: rfaTripartite ? 'tripartite' : 'standard',
            rfaStandard,
            rfaTripartite,
            montantTotalRfa
          };
        }).filter(Boolean);

        // Calculer les totaux
        const rfaTotal = rfaCalculs.reduce((sum, rfa) => {
          if (rfa?.rfaStandard) sum += rfa.rfaStandard.montantRfa;
          if (rfa?.rfaTripartite) sum += rfa.rfaTripartite.montantRfa;
          return sum;
        }, 0);

        const bonusTotal = rfaCalculs.reduce((sum, rfa) => {
          if (rfa?.rfaStandard) sum += rfa.rfaStandard.montantBonus;
          return sum;
        }, 0);

        return {
          codeUnion: codeUnion,
          contratStandard: affectation.contratStandard,
          rfaTotal,
          bonusTotal,
          tripartites: rfaCalculs,
          progressionGlobale: 0 // À calculer si nécessaire
        };
      }).filter(Boolean) as ClientRfaResume[];

      setClientRfaResumes(resumes);
    }
  }, [adherentsData, clientAffectations, rfaConfig, tripartiteMappings]);

  const handleSaveConfig = (config: RfaConfiguration) => {
    setRfaConfig(config);
    // Ici vous pourriez sauvegarder en base de données
    console.log('Configuration RFA sauvegardée:', config);
  };

  const handleSaveAffectations = (affectations: ClientRfaAffectation[]) => {
    setClientAffectations(affectations);
    // Ici vous pourriez sauvegarder en base de données
    console.log('Affectations clients sauvegardées:', affectations);
  };

  const handleSaveTripartiteMappings = (mappings: TripartiteMapping[]) => {
    setTripartiteMappings(mappings);
    // Ici vous pourriez sauvegarder en base de données
    console.log('Mappings TRIPARTITE sauvegardés:', mappings);
  };

  const handleClientClick = (clientRfa: ClientRfaResume) => {
    setSelectedClientRfa(clientRfa);
    setShowDetailModal(true);
  };

  // Statistiques RFA
  const totalRfa = clientRfaResumes.reduce((sum, rfa) => sum + rfa.rfaTotal, 0);
  const totalBonus = clientRfaResumes.reduce((sum, rfa) => sum + rfa.bonusTotal, 0);
  const clientsAvecContrat = clientRfaResumes.filter(rfa => rfa.contratStandard).length;
  const clientsAvecTripartite = clientAffectations.filter(a => a.tripartites.length > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">💰 Gestion RFA</h1>
            <p className="text-purple-100 mt-1">
              Remises de fin d'année et bonus groupement
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowConfigModal(true)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition-all"
            >
              ⚙️ Configuration
            </button>
            <button
              onClick={() => setShowTripartiteModal(true)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition-all"
            >
              🔗 Mapping TRIPARTITE
            </button>
            <button
              onClick={() => setShowAffectationModal(true)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition-all"
            >
              👥 Affectation Clients
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total RFA</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRfa)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">🎁</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bonus</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBonus)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Clients avec Contrat</p>
              <p className="text-2xl font-bold text-gray-900">{clientsAvecContrat}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <span className="text-2xl">🔗</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">TRIPARTITE Actifs</p>
              <p className="text-2xl font-bold text-gray-900">{clientsAvecTripartite}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top 10 RFA */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">🏆 Top 10 RFA Clients</h2>
          <div className="text-right">
            <p className="text-sm text-gray-500">💡 Cliquez sur une ligne pour voir le détail des calculs</p>
            <p className="text-xs text-blue-600 mt-1">📅 RFA calculés uniquement sur 2025</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contrat
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RFA Total
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bonus
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TRIPARTITE
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clientRfaResumes
                .filter(rfa => rfa.contratStandard)
                .sort((a, b) => (b.rfaTotal + b.bonusTotal) - (a.rfaTotal + a.bonusTotal))
                .slice(0, 10)
                .map((rfa, index) => {
                  const adherent = adherentsData.find(a => a.codeUnion === rfa.codeUnion);
                  const affectation = clientAffectations.find(a => a.codeUnion === rfa.codeUnion);
                  const contrat = rfaConfig.contratsStandard.find(c => c.id === rfa.contratStandard);
                  
                  return (
                    <tr 
                      key={rfa.codeUnion} 
                      className="hover:bg-blue-50 cursor-pointer transition-all duration-200 group"
                      onClick={() => handleClientClick(rfa)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                              {adherent?.raisonSociale || rfa.codeUnion}
                            </div>
                            <div className="text-sm text-gray-500">{rfa.codeUnion}</div>
                          </div>
                          <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-blue-500 text-sm">👁️ Voir détails</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 group-hover:text-blue-700 transition-colors">
                        {contrat?.nom || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right group-hover:text-blue-700 transition-colors">
                        {formatCurrency(rfa.rfaTotal)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right group-hover:text-blue-700 transition-colors">
                        {formatCurrency(rfa.bonusTotal)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-600 text-right group-hover:text-blue-700 transition-colors">
                        {formatCurrency(rfa.rfaTotal + rfa.bonusTotal)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {affectation?.tripartites.length ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 group-hover:bg-purple-200 transition-colors">
                            {affectation.tripartites.length} accord(s)
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <RfaConfigurationModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSave={handleSaveConfig}
        initialConfig={rfaConfig}
      />

      <ClientRfaAffectationModal
        isOpen={showAffectationModal}
        onClose={() => setShowAffectationModal(false)}
        onSave={handleSaveAffectations}
        clients={Array.from(new Set(adherentsData.map(a => a.codeUnion))).map(codeUnion => {
          const adherent = adherentsData.find(a => a.codeUnion === codeUnion);
          return {
            codeUnion,
            raisonSociale: adherent?.raisonSociale || codeUnion
          };
        })}
        rfaConfig={rfaConfig}
        initialAffectations={clientAffectations}
      />

      <ClientRfaDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        clientRfa={selectedClientRfa!}
        rfaConfig={rfaConfig}
        adherentsData={adherentsData}
      />

      <TripartiteMappingModal
        isOpen={showTripartiteModal}
        onClose={() => setShowTripartiteModal(false)}
        onSave={handleSaveTripartiteMappings}
        initialMappings={tripartiteMappings}
      />
    </div>
  );
};

export default RfaManager;
