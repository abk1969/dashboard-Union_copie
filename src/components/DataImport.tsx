import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { AdherentData } from '../types';
import { supabase } from '../config/supabase';

interface DataImportProps {
  onDataImported: (data: AdherentData[]) => void;
}

const DataImport: React.FC<DataImportProps> = ({ onDataImported }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [filePreview, setFilePreview] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<{[key: string]: number}>({
    raisonSociale: 3,        // Colonne 4 : Raison Sociale
    codeUnion: 2,            // Colonne 3 : Code Union
    groupeClient: 4,         // Colonne 5 : Groupe Client
    regionCommerciale: 5,    // Colonne 6 : Région Commerciale
    fournisseur: 6,          // Colonne 7 : Fournisseur
    marque: 7,               // Colonne 8 : Marque
    famille: 9,              // Colonne 10 : Famille
    sousFamille: 10,         // Colonne 11 : Sous Famille
    groupeFournisseur: 8,    // Colonne 9 : Groupe FRS
    annee: 1,                // Colonne 2 : Année
    ca: 11                   // Colonne 12 : CA (€)
  });
  const [pushToSupabase, setPushToSupabase] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [showImportedClients, setShowImportedClients] = useState(false);
  const [ExcelClientImport, setExcelClientImport] = useState<React.ComponentType<any> | null>(null);
  const [ImportedClientsList, setImportedClientsList] = useState<React.ComponentType<any> | null>(null);

  // Charger les composants dynamiquement
  React.useEffect(() => {
    const loadComponents = async () => {
      try {
        const { ExcelClientImport: ExcelImport } = await import('./ExcelClientImport');
        const { ImportedClientsList: ClientsList } = await import('./ImportedClientsList');
        setExcelClientImport(() => ExcelImport);
        setImportedClientsList(() => ClientsList);
      } catch (error) {
        console.error('Erreur lors du chargement des composants:', error);
      }
    };
    loadComponents();
  }, []);

  // Fonction de normalisation des champs (version robuste)
  const normalizeField = (value: any): string => {
    if (value === null || value === undefined) return '';
    return String(value ?? "")
      .replace(/\u00A0|\u202F/g, " ")  // remplace NBSP et autres espaces spéciaux
      .trim()
      .toUpperCase();
  };

  // Fonction de normalisation du CA (version robuste)
  const normalizeCA = (value: any): number => {
    if (typeof value === "number") return Math.round(value * 100) / 100;
    
    const s = String(value ?? "")
      .replace(/\s/g, "")    // supprime espaces (y compris NBSP)
      .replace(",", ".");    // virgule -> point

    const n = Number(s);
    if (!Number.isFinite(n)) {
      console.log(`⚠️ CA invalide détecté: "${value}" → 0`);
      return 0;
    }

    // corrige les valeurs quasi nulles comme "4.44e-16"
    return Math.abs(n) < 1e-9 ? 0 : Math.round(n * 100) / 100;
  };

  // Fonction pour créer la clé d'agrégation (SANS Groupe FRS)
  const createAggregationKey = (item: AdherentData): string => {
    return [
      item.annee,
      normalizeField(item.codeUnion),
      normalizeField(item.raisonSociale),
      normalizeField(item.groupeClient),
      normalizeField(item.regionCommerciale),
      normalizeField(item.fournisseur),
      normalizeField(item.marque),
      normalizeField(item.famille) || 'VIDE', // Gérer les familles vides
      normalizeField(item.sousFamille) || 'VIDE' // Gérer les sous-familles vides
      // NE PAS inclure groupeFournisseur (vide pour ACR/DCA/EXADIS)
    ].join('|');
  };

  // Fonction d'agrégation des données
  const aggregateData = (data: AdherentData[]): AdherentData[] => {
    console.log('🔄 Début de l\'agrégation des données...');
    console.log(`📊 Données avant agrégation: ${data.length} lignes`);
    
    const aggregatedMap = new Map<string, AdherentData>();
    const caByFournisseur: { [key: string]: number } = {};
    let totalCAProcessed = 0;
    let totalCAAggregated = 0;
    
    data.forEach((item, index) => {
      const key = createAggregationKey(item);
      const normalizedCA = normalizeCA(item.ca);
      totalCAProcessed += normalizedCA;
      
      // Compter le CA par fournisseur AVANT agrégation
      const fournisseur = normalizeField(item.fournisseur);
      caByFournisseur[fournisseur] = (caByFournisseur[fournisseur] || 0) + normalizedCA;
      
      if (aggregatedMap.has(key)) {
        // Additionner les CA pour les clés identiques
        const existing = aggregatedMap.get(key)!;
        existing.ca += normalizedCA;
        console.log(`🔄 Agrégation ligne ${index + 1}: ${normalizedCA}€ ajouté à la clé existante`);
      } else {
        // Créer une nouvelle entrée avec CA normalisé
        aggregatedMap.set(key, {
          ...item,
          ca: normalizedCA
        });
      }
    });
    
    const aggregatedData = Array.from(aggregatedMap.values());
    totalCAAggregated = aggregatedData.reduce((sum, item) => sum + item.ca, 0);
    
    console.log(`📊 Données après agrégation: ${aggregatedData.length} lignes`);
    console.log(`💰 Total CA traité: ${totalCAProcessed.toLocaleString('fr-FR')}€`);
    console.log(`💰 Total CA agrégé: ${totalCAAggregated.toLocaleString('fr-FR')}€`);
    console.log(`📊 Écart traitement: ${(totalCAAggregated - totalCAProcessed).toLocaleString('fr-FR')}€`);
    
    // Vérification de cohérence par fournisseur
    const caByFournisseurAfter: { [key: string]: number } = {};
    aggregatedData.forEach(item => {
      const fournisseur = normalizeField(item.fournisseur);
      caByFournisseurAfter[fournisseur] = (caByFournisseurAfter[fournisseur] || 0) + item.ca;
    });
    
    console.log('📊 Vérification de cohérence par fournisseur:');
    Object.keys(caByFournisseur).forEach(fournisseur => {
      const caAvant = caByFournisseur[fournisseur];
      const caApres = caByFournisseurAfter[fournisseur] || 0;
      const ecart = caApres - caAvant;
      console.log(`  ${fournisseur}: ${caAvant.toLocaleString('fr-FR')}€ → ${caApres.toLocaleString('fr-FR')}€ (écart: ${ecart.toLocaleString('fr-FR')}€)`);
    });
    
    return aggregatedData;
  };

  // Fonction pour pousser les données vers Supabase
  const pushDataToSupabase = async (data: AdherentData[]) => {
    try {
      console.log('🚀 Poussée des données vers Supabase...');
      console.log(`📊 Nombre de données à pousser: ${data.length}`);
      
      // Supprimer les données existantes
      console.log('🗑️ Suppression des anciennes données...');
      const { error: deleteError } = await supabase
        .from('adherents')
        .delete()
        .neq('id', 0);
      
      if (deleteError) {
        console.error('❌ Erreur lors de la suppression:', deleteError);
        return;
      }
      
      console.log('✅ Anciennes données supprimées');
      
      // Insérer les nouvelles données par lots
      const batchSize = 1000;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        const { error: insertError } = await supabase
          .from('adherents')
          .insert(batch);
        
        if (insertError) {
          console.error('Erreur lors de l\'insertion du lot:', insertError);
          return;
        }
        
        console.log(`✅ Lot ${Math.floor(i/batchSize) + 1} inséré (${batch.length} enregistrements)`);
      }
      
      console.log('✅ Toutes les données ont été poussées vers Supabase');
      
    } catch (error) {
      console.error('❌ Erreur lors de la poussée vers Supabase:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log(`🔍 État initial pushToSupabase: ${pushToSupabase}`);
    setIsImporting(true);
    setImportStatus('Chargement du fichier...');
    setFileName(file.name);

    try {
      const data = await file.arrayBuffer();
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
      console.log('📊 Données brutes reçues:', jsonData.length, 'lignes');
      console.log('🗂️ Mapping des colonnes:', columnMapping);

      // Détection automatique des en-têtes
      const firstRow = jsonData[0] as string[];
      const isHeaderRow = firstRow && (
        firstRow[0]?.toLowerCase().includes('mois') || 
        firstRow[1]?.toLowerCase().includes('ann') ||
        firstRow[2]?.toLowerCase().includes('code')
      );

      console.log('🔍 Détection en-têtes:', { firstRow: firstRow?.[0], isHeaderRow });

      let dataRows = jsonData;
    if (isHeaderRow) {
        dataRows = jsonData.slice(1);
        console.log('📋 Ligne d\'en-têtes supprimée, données restantes:', dataRows.length, 'lignes');
      }

      // Filtrage et conversion des données
      let lignesRejeteesColonnes = 0;
      let lignesRejeteesValidation = 0;
      let lignesRejeteesConversion = 0;
      let totalCARejete = 0;
      let lignesCAZero = 0;
      let totalCAZero = 0;
      
      console.log(`📊 Début du filtrage sur ${dataRows.length} lignes`);
      console.log(`📊 Données brutes reçues: ${jsonData.length} lignes`);
      console.log(`📊 Lignes après suppression en-têtes: ${dataRows.length} lignes`);
    
    const processedData = dataRows
      .filter((row: any, index: number) => {
          if (!row || row.length === 0) return false;
          
          // Vérifier qu'on a assez de colonnes (au moins 11 colonnes pour les champs essentiels)
          if (row.length < 11) {
            console.log(`⚠️ Ligne ${index + 1} pas assez de colonnes:`, row.length, 'vs 11 minimum');
            lignesRejeteesColonnes++;
          return false;
        }
        
          // Log pour les lignes avec moins de 12 colonnes mais au moins 11
          if (row.length < 12) {
            console.log(`⚠️ Ligne ${index + 1} colonnes insuffisantes:`, row.length, 'vs 12 (mais acceptée)');
        }
        
        return true;
      })
      .map((row: any, index: number) => {
        try {
          const adherentData: AdherentData = {
              raisonSociale: normalizeField(row[columnMapping.raisonSociale]),
              codeUnion: normalizeField(row[columnMapping.codeUnion]),
              groupeClient: normalizeField(row[columnMapping.groupeClient]),
              regionCommerciale: normalizeField(row[columnMapping.regionCommerciale]),
              fournisseur: normalizeField(row[columnMapping.fournisseur]),
              marque: normalizeField(row[columnMapping.marque]),
              famille: normalizeField(row[columnMapping.famille]), // NOUVELLE COLONNE
              sousFamille: normalizeField(row[columnMapping.sousFamille]),
              groupeFournisseur: normalizeField(row[columnMapping.groupeFournisseur]),
              annee: parseInt(String(row[columnMapping.annee] || '2024')),
              ca: normalizeCA(row[columnMapping.ca])
            };

            // Validation des champs obligatoires uniquement
            const isRequiredOk = (item: AdherentData) =>
              Number.isFinite(item.annee) &&
              item.codeUnion?.trim() &&
              item.fournisseur?.trim() &&
              Number.isFinite(item.ca);

            if (!isRequiredOk(adherentData)) {
              console.log(`⚠️ Ligne ${index + 1} champs obligatoires manquants:`, adherentData);
              totalCARejete += adherentData.ca;
              lignesRejeteesValidation++;
            return null;
          }

            // Compter les lignes avec CA = 0
            if (adherentData.ca === 0) {
              lignesCAZero++;
              totalCAZero += 0; // Pas besoin d'ajouter 0, mais pour la cohérence
            }
          
          return adherentData;
        } catch (error) {
            console.warn(`❌ Erreur de conversion ligne ${index + 1}:`, error, row);
            // Essayer de calculer le CA même en cas d'erreur
            try {
              const caRejete = normalizeCA(row[columnMapping.ca]);
              totalCARejete += caRejete;
            } catch (e) {
              // Ignorer si on ne peut pas calculer le CA
            }
            lignesRejeteesConversion++;
          return null;
        }
      })
      .filter((item): item is AdherentData => item !== null);
    
      console.log(`📊 Statistiques de filtrage:`);
      console.log(`  - Lignes rejetées (colonnes): ${lignesRejeteesColonnes}`);
      console.log(`  - Lignes rejetées (validation): ${lignesRejeteesValidation}`);
      console.log(`  - Lignes rejetées (conversion): ${lignesRejeteesConversion}`);
      console.log(`  - Lignes acceptées: ${processedData.length}`);
      console.log(`  - Lignes avec CA = 0: ${lignesCAZero}`);
      console.log(`  - CA rejeté: ${totalCARejete.toLocaleString('fr-FR')}€`);

      console.log('📊 Données après conversion:', processedData.length, 'lignes');

      if (processedData.length === 0) {
        setImportStatus('❌ Aucune donnée valide trouvée');
        return;
      }

      // Calcul du total AVANT agrégation
      const totalAvant = processedData.reduce((sum, item) => sum + item.ca, 0);
      console.log(`💰 Total AVANT agrégation: ${totalAvant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€`);

      // Agrégation des données
      const aggregatedData = aggregateData(processedData);

      // Calcul du total APRÈS agrégation
      const totalApres = aggregatedData.reduce((sum, item) => sum + item.ca, 0);
      console.log(`💰 Total APRÈS agrégation: ${totalApres.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€`);
      console.log(`📊 CONTRÔLE DE COHÉRENCE`);
      console.log(`  Total AVANT: ${totalAvant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€`);
      console.log(`  Total APRÈS: ${totalApres.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€`);
      console.log(`  Différence: ${(totalApres - totalAvant).toFixed(2)}€`);

      // Aperçu des données
      setFilePreview(aggregatedData.slice(0, 10));
      setShowPreview(true);

      // Pousser vers Supabase si demandé
      console.log(`🔍 pushToSupabase: ${pushToSupabase}`);
      // TEMPORAIRE: Forcer la poussée vers Supabase pour test
      const forcePushToSupabase = true;
      console.log(`🔍 forcePushToSupabase: ${forcePushToSupabase}`);
      if (pushToSupabase || forcePushToSupabase) {
        console.log('🚀 Début de la poussée vers Supabase...');
        setImportStatus('Poussée vers Supabase...');
        await pushDataToSupabase(aggregatedData);
        setImportStatus('✅ Données poussées vers Supabase');
        console.log('✅ Poussée vers Supabase terminée');
      } else {
        console.log('ℹ️ Poussée vers Supabase désactivée');
        setImportStatus(`✅ ${aggregatedData.length} lignes importées avec succès`);
      }

      onDataImported(aggregatedData);

    } catch (error) {
      console.error('❌ Erreur lors de l\'import:', error);
      setImportStatus('❌ Erreur lors de l\'import');
    } finally {
      setIsImporting(false);
    }
  };

  const handleColumnMappingChange = (field: string, value: number) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreviewConfirm = () => {
      setShowPreview(false);
    setImportStatus('Import terminé');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📊 Import de Données</h2>
          <p className="text-gray-600 mt-1">
            Importez vos données Excel pour analyser les performances
          </p>
        </div>
        <div className="flex space-x-3">
            <button
              onClick={() => setShowExcelImport(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
            📋 Clients Excel
            </button>
            <button
              onClick={() => setShowImportedClients(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
            👥 Clients Importés
            </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Upload de fichier */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
            accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
            disabled={isImporting}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
            className={`cursor-pointer ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="text-6xl mb-4">📁</div>
            <div className="text-xl font-semibold text-gray-700 mb-2">
              {isImporting ? 'Import en cours...' : 'Cliquez pour sélectionner un fichier'}
            </div>
            <div className="text-gray-500">
              Formats supportés: .xlsx, .xls, .csv
            </div>
            </label>
        </div>

        {/* Statut d'import */}
        {importStatus && (
          <div className={`p-4 rounded-lg ${
            importStatus.includes('✅') ? 'bg-green-50 text-green-800' :
            importStatus.includes('❌') ? 'bg-red-50 text-red-800' :
            'bg-blue-50 text-blue-800'
          }`}>
            {importStatus}
          </div>
        )}

        {/* Mapping des colonnes */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🗂️ Mapping des Colonnes</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(columnMapping).map(([field, value]) => (
              <div key={field} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    {field === 'raisonSociale' ? 'Raison Sociale' :
                     field === 'codeUnion' ? 'Code Union' :
                     field === 'groupeClient' ? 'Groupe Client' :
                   field === 'regionCommerciale' ? 'Région Commerciale' :
                     field === 'fournisseur' ? 'Fournisseur' :
                     field === 'marque' ? 'Marque' :
                   field === 'famille' ? 'Famille' :
                     field === 'sousFamille' ? 'Sous Famille' :
                     field === 'groupeFournisseur' ? 'Groupe Fournisseur' :
                     field === 'annee' ? 'Année' :
                     field === 'ca' ? 'CA (€)' : field}:
                  </label>
                  <select
                  value={value}
                  onChange={(e) => handleColumnMappingChange(field, parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 20 }, (_, i) => (
                    <option key={i} value={i}>
                      Colonne {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

        {/* Option Supabase */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="pushToSupabase"
            checked={pushToSupabase}
            onChange={(e) => setPushToSupabase(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="pushToSupabase" className="text-sm font-medium text-gray-700">
            Pousser les données vers Supabase après import
          </label>
        </div>

        {/* Aperçu des données */}
        {showPreview && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">👀 Aperçu des Données</h3>
              <button
                onClick={handlePreviewConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirmer
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Raison Sociale
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code Union
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marque
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Famille
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sous-Famille
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CA
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filePreview.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.raisonSociale}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.codeUnion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.marque}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.famille}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.sousFamille}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.ca.toLocaleString('fr-FR')}€
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Informations sur le format attendu */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">📋 Format de fichier attendu :</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <div>• <strong>Colonne 2</strong> : Année</div>
            <div>• <strong>Colonne 3</strong> : Code Union</div>
            <div>• <strong>Colonne 4</strong> : Raison Sociale</div>
            <div>• <strong>Colonne 5</strong> : Groupe Client</div>
            <div>• <strong>Colonne 6</strong> : Région Commerciale</div>
            <div>• <strong>Colonne 7</strong> : Fournisseur</div>
            <div>• <strong>Colonne 8</strong> : Marque</div>
            <div>• <strong>Colonne 9</strong> : Groupe FRS</div>
            <div>• <strong>Colonne 10</strong> : Famille (freinage, embrayage, etc.)</div>
            <div>• <strong>Colonne 11</strong> : Sous Famille (plaquettes, disques, etc.)</div>
            <div>• <strong>Colonne 12</strong> : CA (€)</div>
          </div>
        </div>
      </div>

      {/* Composants dynamiques */}
      {ExcelClientImport && showExcelImport && (
        <ExcelClientImport onClose={() => setShowExcelImport(false)} />
      )}
      
      {ImportedClientsList && showImportedClients && (
        <ImportedClientsList onClose={() => setShowImportedClients(false)} />
      )}
    </div>
  );
};

export default DataImport;