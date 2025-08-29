import React, { useState, useMemo, useEffect } from 'react';
import { AdherentData, Document } from '../types';
import { formatCurrency, formatPercentage, formatProgression } from '../utils/formatters';
import CloseButton from './CloseButton';
import { DocumentService } from '../services/documentService';
import { DOCUMENT_TYPES, getDocumentTypeColor, getDocumentTypeIconColor } from '../config/documentTypes';

interface MagasinDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  magasinData: {
    codeUnion: string;
    raisonSociale: string;
    groupeClient: string;
    adherentsData: AdherentData[];
  } | null;
}

interface MagasinPerformance {
  fournisseur: string;
  marque: string;
  famille: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  pourcentage2024: number;
  pourcentage2025: number;
}

const MagasinDetailModal: React.FC<MagasinDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  magasinData 
}) => {
  const [activeView, setActiveView] = useState<'fournisseurs' | 'marques' | 'familles' | 'documents'>('fournisseurs');
  const [sortBy, setSortBy] = useState<'ca' | 'progression' | 'nom'>('ca');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // État pour les documents
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [tableExists, setTableExists] = useState<boolean | null>(null);

  // Calculer les performances du magasin
  const magasinPerformance = useMemo(() => {
    if (!magasinData) return [];

    const performanceMap = new Map<string, MagasinPerformance>();

    magasinData.adherentsData.forEach(item => {
      const key = `${item.fournisseur}|${item.marque}|${item.sousFamille}`;
      
      if (!performanceMap.has(key)) {
        performanceMap.set(key, {
          fournisseur: item.fournisseur,
          marque: item.marque,
          famille: item.sousFamille,
          ca2024: 0,
          ca2025: 0,
          progression: 0,
          pourcentage2024: 0,
          pourcentage2025: 0
        });
      }

      const perf = performanceMap.get(key)!;
      
      if (item.annee === 2024) {
        perf.ca2024 += item.ca;
      } else if (item.annee === 2025) {
        perf.ca2025 += item.ca;
      }
    });

    // Calculer les progressions et pourcentages
    const totalCA2024 = Array.from(performanceMap.values()).reduce((sum, p) => sum + p.ca2024, 0);
    const totalCA2025 = Array.from(performanceMap.values()).reduce((sum, p) => sum + p.ca2025, 0);

    performanceMap.forEach(perf => {
      perf.progression = perf.ca2024 > 0 ? ((perf.ca2025 - perf.ca2024) / perf.ca2024) * 100 : 0;
      perf.pourcentage2024 = totalCA2024 > 0 ? (perf.ca2024 / totalCA2024) * 100 : 0;
      perf.pourcentage2025 = totalCA2025 > 0 ? (perf.ca2025 / totalCA2025) * 100 : 0;
    });

    return Array.from(performanceMap.values());
  }, [magasinData]);

  // Trier les performances
  const sortedPerformance = useMemo(() => {
    return [...magasinPerformance].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'ca':
          comparison = (b.ca2025 + b.ca2024) - (a.ca2025 + a.ca2024);
          break;
        case 'progression':
          comparison = b.progression - a.progression;
          break;
        case 'nom':
          comparison = a.fournisseur.localeCompare(b.fournisseur);
          break;
      }

      return sortOrder === 'desc' ? comparison : -comparison;
    });
  }, [magasinPerformance, sortBy, sortOrder]);

  const handleSort = (field: 'ca' | 'progression' | 'nom') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: 'ca' | 'progression' | 'nom') => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getViewData = () => {
    switch (activeView) {
      case 'fournisseurs':
        return sortedPerformance.filter((item, index, array) => 
          array.findIndex(p => p.fournisseur === item.fournisseur) === index
        ).map(item => ({
          key: item.fournisseur,
          ca2024: sortedPerformance
            .filter(p => p.fournisseur === item.fournisseur)
            .reduce((sum, p) => sum + p.ca2024, 0),
          ca2025: sortedPerformance
            .filter(p => p.fournisseur === item.fournisseur)
            .reduce((sum, p) => sum + p.ca2025, 0),
          progression: 0, // Calculé plus tard
          pourcentage: 0 // Calculé plus tard
        }));
      case 'marques':
        return sortedPerformance.filter((item, index, array) => 
          array.findIndex(p => p.marque === item.marque) === index
        ).map(item => ({
          key: item.marque,
          ca2024: sortedPerformance
            .filter(p => p.marque === item.marque)
            .reduce((sum, p) => sum + p.ca2024, 0),
          ca2025: sortedPerformance
            .filter(p => p.marque === item.marque)
            .reduce((sum, p) => sum + p.ca2025, 0),
          progression: 0, // Calculé plus tard
          pourcentage: 0 // Calculé plus tard
        }));
      case 'familles':
        return sortedPerformance.filter((item, index, array) => 
          array.findIndex(p => p.famille === item.famille) === index
        ).map(item => ({
          key: item.famille,
          ca2024: sortedPerformance
            .filter(p => p.famille === item.famille)
            .reduce((sum, p) => sum + p.ca2024, 0),
          ca2025: sortedPerformance
            .filter(p => p.famille === item.famille)
            .reduce((sum, p) => sum + p.ca2025, 0),
          progression: 0, // Calculé plus tard
          pourcentage: 0 // Calculé plus tard
        }));
      default:
        return [];
    }
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'fournisseurs':
        return '🏢 Fournisseurs';
      case 'marques':
        return '🏷️ Marques';
      case 'familles':
        return '📦 Familles de Produits';
      case 'documents':
        return '📁 Documents';
      default:
        return '';
    }
  };

  // Calculer les totaux globaux
  const totalCA2024 = useMemo(() => 
    magasinPerformance.reduce((sum, p) => sum + p.ca2024, 0), 
    [magasinPerformance]
  );
  const totalCA2025 = useMemo(() => 
    magasinPerformance.reduce((sum, p) => sum + p.ca2025, 0), 
    [magasinPerformance]
  );
  const progressionGlobale = totalCA2024 > 0 ? ((totalCA2025 - totalCA2024) / totalCA2024) * 100 : 0;

  // Charger les documents quand l'onglet Documents est actif
  useEffect(() => {
    if (activeView === 'documents' && magasinData) {
      loadDocuments();
    }
  }, [activeView, magasinData]);

  // Fonction pour charger les documents
  const loadDocuments = async () => {
    if (!magasinData) return;
    
    setLoadingDocuments(true);
    try {
      // Vérifier d'abord si la table existe
      const exists = await DocumentService.checkTableExists();
      setTableExists(exists);
      
      if (exists) {
        const docs = await DocumentService.getDocumentsByCodeUnion(magasinData.codeUnion);
        setDocuments(docs);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      setTableExists(false);
    } finally {
      setLoadingDocuments(false);
    }
  };

  if (!isOpen || !magasinData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">🏪 Détail du Magasin</h2>
              <p className="text-blue-100 mt-1">{magasinData.raisonSociale}</p>
              <p className="text-blue-200 text-sm">Code Union: {magasinData.codeUnion}</p>
              <p className="text-blue-200 text-sm">Groupe: {magasinData.groupeClient}</p>
            </div>
            <CloseButton onClose={onClose} />
          </div>
        </div>

        {/* Statistiques globales */}
        <div className="p-6 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalCA2025)}</div>
                <div className="text-sm text-gray-600">CA Total 2025</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalCA2024)}</div>
                <div className="text-sm text-gray-600">CA Total 2024</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="text-center">
                <div className={`text-2xl font-bold ${progressionGlobale >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {progressionGlobale >= 0 ? '+' : ''}{progressionGlobale.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Progression</div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Navigation des vues */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setActiveView('fournisseurs')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === 'fournisseurs'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🏢 Fournisseurs
            </button>
            <button
              onClick={() => setActiveView('marques')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === 'marques'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🏷️ Marques
            </button>
            <button
              onClick={() => setActiveView('familles')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === 'familles'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📦 Familles
            </button>
            <button
              onClick={() => setActiveView('documents')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === 'documents'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📁 Documents
            </button>
          </div>

          {/* Affichage conditionnel selon la vue active */}
          {activeView === 'documents' ? (
            // Onglet Documents
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">📁 Documents du Magasin</h3>
                <p className="text-gray-600">Gestion des documents administratifs et commerciaux</p>
              </div>
              
              {/* Types de documents */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {DOCUMENT_TYPES.map((docType) => (
                  <div key={docType.type} className={`bg-gradient-to-br ${getDocumentTypeColor(docType.type)} p-4 rounded-lg border`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${getDocumentTypeIconColor(docType.type)} rounded-full flex items-center justify-center`}>
                        <span className="text-white text-lg">{docType.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{docType.label}</h4>
                        <p className="text-sm text-gray-600">{docType.description}</p>
                        {docType.required && (
                          <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            Obligatoire
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Liste des documents existants */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">📋 Documents Disponibles</h4>
                
                {loadingDocuments ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Chargement des documents...</span>
                  </div>
                ) : tableExists === false ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      <strong>⚠️ Table non trouvée :</strong> La table "documents" n'existe pas encore sur Supabase.
                    </p>
                    <p className="text-yellow-700 text-sm mt-2">
                      Exécutez le SQL fourni dans l'interface Supabase pour créer la table.
                    </p>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm">
                      <strong>📁 Aucun document :</strong> Aucun document n'a encore été ajouté pour ce magasin.
                    </p>
                    <p className="text-blue-700 text-sm mt-2">
                      Les documents seront affichés ici une fois ajoutés via l'API Google Drive.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 ${getDocumentTypeIconColor(doc.typeDocument)} rounded-full flex items-center justify-center`}>
                              <span className="text-white text-sm">
                                {DOCUMENT_TYPES.find(t => t.type === doc.typeDocument)?.icon || '📄'}
                              </span>
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-900">
                                {DOCUMENT_TYPES.find(t => t.type === doc.typeDocument)?.label || doc.typeDocument}
                              </h5>
                              <p className="text-sm text-gray-600">{doc.nomFichier}</p>
                              <p className="text-xs text-gray-500">
                                Ajouté le {doc.dateUpload.toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              doc.statut === 'actif' ? 'bg-green-100 text-green-800' :
                              doc.statut === 'archive' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {doc.statut}
                            </span>
                            {doc.urlDrive && (
                              <a
                                href={doc.urlDrive}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Voir
                              </a>
                            )}
                          </div>
                        </div>
                        {doc.notes && (
                          <div className="mt-3 p-2 bg-gray-100 rounded text-sm text-gray-700">
                            <strong>Notes :</strong> {doc.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Tableau des performances (vue existante)
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {getViewTitle()}
                    </th>
                    <th 
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('ca')}
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>CA 2024</span>
                        <span className="text-xs">{getSortIcon('ca')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CA 2025
                    </th>
                    <th 
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('progression')}
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>Progression</span>
                        <span className="text-xs">{getSortIcon('progression')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % 2024
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % 2025
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getViewData().map((item, index) => {
                    const progression = item.ca2024 > 0 ? ((item.ca2025 - item.ca2024) / item.ca2024) * 100 : 0;
                    const pourcentage2024 = totalCA2024 > 0 ? (item.ca2024 / totalCA2024) * 100 : 0;
                    const pourcentage2025 = totalCA2025 > 0 ? (item.ca2025 / totalCA2025) * 100 : 0;

                    return (
                      <tr key={item.key} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-white">{index + 1}</span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{item.key}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(item.ca2024)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(item.ca2025)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span className={`font-medium ${progression >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {progression >= 0 ? '+' : ''}{progression.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          {pourcentage2024.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          {pourcentage2025.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
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

export default MagasinDetailModal;
