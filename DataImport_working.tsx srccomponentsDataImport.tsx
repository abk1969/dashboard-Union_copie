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
    raisonSociale: 4,        // Colonne 4 : Raison Sociale
    codeUnion: 3,            // Colonne 3 : Code Union
    groupeClient: 5,         // Colonne 5 : Groupe Client
    fournisseur: 7,          // Colonne 7 : Fournisseur
    marque: 8,               // Colonne 8 : Marque
    sousFamille: 11,         // Colonne 11 : Sous Famille
    groupeFournisseur: 9,    // Colonne 9 : Groupe FRS
    annee: 2,                // Colonne 2 : Année
    ca: 12                   // Colonne 12 : CA (€) - CORRECT !
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

  // Fonction pour pousser les données vers Supabase
  const pushDataToSupabase = async (data: AdherentData[]) => {
    try {
      console.log('🔄 Poussage vers Supabase...', data.length, 'enregistrements');
      
      // Supprimer les anciennes données avant d'ajouter les nouvelles
      console.log('🗑️ Suppression des anciennes données...');
      
      const { error: deleteError } = await supabase
        .from('adherents')
        .delete()
        .neq('id', 0); // Supprimer tous les enregistrements
      
      if (deleteError) {
        throw new Error(`Erreur lors de la suppression: ${deleteError.message}`);
      }
      
      console.log('✅ Anciennes données supprimées');
      
      // Insérer les nouvelles données par lots
      const batchSize = 100;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        const { error: insertError } = await supabase
          .from('adherents')
          .insert(batch);
        
        if (insertError) {
          throw new Error(`Erreur lot ${Math.floor(i/batchSize) + 1}: ${insertError.message}`);
        }
        
        console.log(`✅ Lot ${Math.floor(i/batchSize) + 1} inséré (${batch.length} enregistrements)`);
      }
      
      console.log('🎉 Toutes les données poussées vers Supabase !');
      return true;
      
    } catch (error) {
      console.error('❌ Erreur lors du poussage vers Supabase:', error);
      throw error;
    }
  };

  const processExcelFile = async (file: File): Promise<AdherentData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Afficher l'aperçu d'abord
          setFilePreview(jsonData.slice(0, 5)); // Premières 5 lignes
          setShowPreview(true);
          
          // Convertir les données en format AdherentData avec le mapping personnalisé
          const processedData = convertToAdherentData(jsonData);
          resolve(processedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsArrayBuffer(file);
    });
  };

  const processCSVFile = async (file: File): Promise<AdherentData[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: false, // Pas d'en-tête automatique
        skipEmptyLines: true,
        complete: (results) => {
          try {
            // Afficher l'aperçu d'abord
            setFilePreview(results.data.slice(0, 5)); // Premières 5 lignes
            setShowPreview(true);
            
            // Convertir les données en format AdherentData avec le mapping personnalisé
            const processedData = convertToAdherentData(results.data);
            resolve(processedData);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => reject(error)
      });
    });
  };

  // Fonction de détection automatique des colonnes
  const detectColumnMapping = (headers: string[]): Record<string, number> => {
    const mapping: Record<string, number> = {};
    
    // Vérifier si la première ligne contient des en-têtes ou des données
    const firstRow = headers[0] || '';
    const isHeaderRow = firstRow.toLowerCase().includes('mois') || 
                       firstRow.toLowerCase().includes('année') || 
                       firstRow.toLowerCase().includes('code') ||
                       firstRow.toLowerCase().includes('raison');
    
    console.log('Détection en-têtes:', { firstRow, isHeaderRow });
    
    // Si c'est une ligne d'en-têtes, utiliser les vrais noms de colonnes
    if (isHeaderRow) {
      headers.forEach((header, index) => {
        const headerLower = header.toLowerCase().trim();
        
        // Mapping intelligent basé sur les mots-clés
        if (headerLower.includes('code') && headerLower.includes('un')) {
          mapping.codeUnion = index;
        } else if (headerLower.includes('raison') && headerLower.includes('sociale')) {
          mapping.raisonSociale = index;
        } else if (headerLower.includes('groupe') && headerLower.includes('client')) {
          mapping.groupeClient = index;
        } else if (headerLower.includes('fournisseur') && !headerLower.includes('groupe')) {
          mapping.fournisseur = index;
        } else if (headerLower.includes('marque')) {
          mapping.marque = index;
        } else if (headerLower.includes('sous') && headerLower.includes('famille')) {
          mapping.sousFamille = index;
        } else if (headerLower.includes('groupe') && (headerLower.includes('frs') || headerLower.includes('fournisseur'))) {
          mapping.groupeFournisseur = index;
        } else if (headerLower.includes('année') || headerLower.includes('annee')) {
          mapping.annee = index;
        } else if (headerLower.includes('ca') || headerLower.includes('chiffre')) {
          mapping.ca = index;
        }
      });
    } else {
      // Si ce n'est pas une ligne d'en-têtes, utiliser le mapping par position
      // Basé sur la structure que vous avez montrée
      mapping.codeUnion = 2;      // Colonne 2: Code Un
      mapping.raisonSociale = 3;  // Colonne 3: Raison Sociale
      mapping.groupeClient = 4;   // Colonne 4: Groupe Client
      mapping.fournisseur = 6;    // Colonne 6: Fournisseur
      mapping.marque = 7;         // Colonne 7: Marque
      mapping.groupeFournisseur = 8; // Colonne 8: Groupe FRS
      mapping.sousFamille = 10;   // Colonne 10: Sous Famille
      mapping.annee = 1;          // Colonne 1: Année
      mapping.ca = 11;            // Colonne 11: CA (€)
    }
    
    console.log('Détection automatique:', { headers, mapping });
    return mapping;
  };

  const convertToAdherentData = (rawData: any[]): AdherentData[] => {
    console.log('Données brutes reçues:', rawData.length, 'lignes');
    console.log('Mapping des colonnes:', columnMapping);
    
    // Détection automatique des colonnes basée sur les en-têtes
    const headers = rawData[0] || [];
    const autoMapping = detectColumnMapping(headers);
    console.log('Mapping automatique détecté:', autoMapping);
    
    // Utiliser le mapping automatique si pas de mapping manuel
    let finalMapping = Object.keys(columnMapping).length > 0 ? columnMapping : autoMapping;
    
    // Si le mapping automatique n'a pas trouvé les bonnes colonnes, forcer le mapping
    if (!finalMapping.codeUnion || !finalMapping.raisonSociale) {
      console.log('Mapping automatique incomplet, utilisation du mapping forcé');
      finalMapping = {
        codeUnion: 2,      // Colonne 2: Code Un
        raisonSociale: 3,  // Colonne 3: Raison Sociale
        groupeClient: 4,   // Colonne 4: Groupe Client
        fournisseur: 6,    // Colonne 6: Fournisseur
        marque: 7,         // Colonne 7: Marque
        groupeFournisseur: 8, // Colonne 8: Groupe FRS
        sousFamille: 10,   // Colonne 10: Sous Famille
        annee: 1,          // Colonne 1: Année
        ca: 11             // Colonne 11: CA (€)
      };
    }
    
    // Forcer le mapping basé sur votre structure Excel
    // Votre fichier commence directement par les données, pas d'en-têtes
    const dataRows = rawData;
    
    console.log('Utilisation du mapping forcé pour votre structure Excel');
    console.log('Après suppression en-tête:', dataRows.length, 'lignes');
    
    const processedData = dataRows
      .filter((row: any, index: number) => {
        // Vérifier que la ligne n'est pas vide
        if (!row || row.length === 0) {
          console.log(`Ligne ${index + 1} vide, ignorée`);
          return false;
        }
        
        // Vérifier qu'on a assez de colonnes
        const maxColumnIndex = Math.max(...Object.values(finalMapping));
        if (row.length <= maxColumnIndex) {
          console.log(`Ligne ${index + 1} pas assez de colonnes:`, row.length, 'vs', maxColumnIndex + 1);
          return false;
        }
        
        return true;
      })
      .map((row: any, index: number) => {
        try {
          // Debug pour la colonne CA
          const caValue = row[finalMapping.ca];
          const caString = String(caValue || '0');
          const caCleaned = caString.replace(',', '.').replace(/\s/g, '');
          const caParsed = parseFloat(caCleaned);
          
          console.log(`Ligne ${index + 1} CA debug:`, {
            original: caValue,
            string: caString,
            cleaned: caCleaned,
            parsed: caParsed
          });
          
          const adherentData: AdherentData = {
            raisonSociale: String(row[finalMapping.raisonSociale] || '').trim(),
            codeUnion: String(row[finalMapping.codeUnion] || '').trim(),
            groupeClient: String(row[finalMapping.groupeClient] || '').trim(),
            fournisseur: String(row[finalMapping.fournisseur] || '').trim(),
            marque: String(row[finalMapping.marque] || '').trim(),
            sousFamille: String(row[finalMapping.sousFamille] || '').trim(),
            groupeFournisseur: String(row[finalMapping.groupeFournisseur] || '').trim(),
            annee: parseInt(String(row[finalMapping.annee] || '2024')),
            ca: caParsed
          };
          
          // Validation supplémentaire
          if (adherentData.raisonSociale === '' || adherentData.codeUnion === '') {
            console.log(`Ligne ${index + 1} données essentielles manquantes:`, adherentData);
            return null;
          }
          
          return adherentData;
        } catch (error) {
          console.warn(`Erreur de conversion ligne ${index + 1}:`, error, row);
          return null;
        }
      })
      .filter((item): item is AdherentData => item !== null);
    
    console.log('Données finales traitées:', processedData.length, 'lignes');
    return processedData;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsImporting(true);
    setImportStatus('📁 Fichier sélectionné, traitement en cours...');

    await processFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        setFileName(file.name);
        setIsImporting(true);
        setImportStatus('📁 Fichier déposé, traitement en cours...');
        
        // Traiter directement le fichier déposé
        processFile(file);
      } else {
        setImportStatus('❌ Format de fichier non supporté. Utilisez Excel (.xlsx, .xls) ou CSV (.csv)');
        setTimeout(() => setImportStatus(''), 5000);
      }
    }
  };

  const processFile = async (file: File) => {
    try {
      let importedData: AdherentData[];
      
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setImportStatus('📊 Traitement du fichier Excel...');
        importedData = await processExcelFile(file);
      } else if (file.name.endsWith('.csv')) {
        setImportStatus('📄 Traitement du fichier CSV...');
        importedData = await processCSVFile(file);
      } else {
        throw new Error('Format de fichier non supporté');
      }

      if (importedData.length === 0) {
        throw new Error('Aucune donnée valide trouvée dans le fichier');
      }

      setImportStatus(`✅ ${importedData.length} lignes importées avec succès !`);
      onDataImported(importedData);
      
      // Pousser vers Supabase si activé
      if (pushToSupabase && importedData.length > 0) {
        setImportStatus(`🔄 Poussage vers Supabase...`);
        try {
          await pushDataToSupabase(importedData);
          setImportStatus(`🎉 ${importedData.length} lignes importées et remplacées dans Supabase !`);
        } catch (error) {
          setImportStatus(`⚠️ Import local réussi, mais erreur Supabase: ${error}`);
        }
      }
      
      setTimeout(() => setImportStatus(''), 5000);
    } catch (error) {
      setImportStatus(`❌ Erreur lors de l'import : ${error}`);
      setTimeout(() => setImportStatus(''), 5000);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const updateColumnMapping = (field: string, columnIndex: number) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: columnIndex
    }));
  };

  const handleImportWithMapping = async () => {
    if (!filePreview.length) return;
    
    setIsImporting(true);
    setImportStatus('🔄 Import avec le nouveau mapping...');
    
    try {
      // Re-traiter le fichier avec le nouveau mapping
      const processedData = convertToAdherentData(filePreview);
      
      if (processedData.length === 0) {
        throw new Error('Aucune donnée valide avec ce mapping');
      }

      setImportStatus(`✅ ${processedData.length} lignes importées avec le nouveau mapping !`);
      onDataImported(processedData);
      setShowPreview(false);
      
      setTimeout(() => setImportStatus(''), 5000);
    } catch (error) {
      setImportStatus(`❌ Erreur avec le nouveau mapping : ${error}`);
      setTimeout(() => setImportStatus(''), 5000);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="data-import bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">
          📥 Import de Données
        </h3>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Supporte Excel (.xlsx, .xls) et CSV (.csv)
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={pushToSupabase}
              onChange={(e) => setPushToSupabase(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Remplacer dans Supabase</span>
          </label>
        </div>
      </div>

      {/* Boutons d'import spécialisés */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-4">
          {ExcelClientImport && (
            <button
              onClick={() => setShowExcelImport(true)}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-colors font-medium shadow-md"
            >
              <span className="text-xl mr-2">👤</span>
              Import Données Clients (Excel)
            </button>
          )}
          
          {ImportedClientsList && (
            <button
              onClick={() => setShowImportedClients(true)}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors font-medium shadow-md"
            >
              <span className="text-xl mr-2">📋</span>
              Voir Clients Importés
            </button>
          )}
          <div className="text-sm text-gray-600 flex items-center">
            <span className="mr-2">📋</span>
            Import standard CA/Adhérents ci-dessous
          </div>
        </div>
      </div>

      {/* Zone de drop */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isImporting 
            ? 'border-blue-300 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {isImporting ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <div className="text-blue-600 font-medium">Traitement en cours...</div>
            <div className="text-sm text-gray-600">{fileName}</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-6xl">📁</div>
            <div className="text-xl font-medium text-gray-700">
              Glissez-déposez votre fichier ici
            </div>
            <div className="text-gray-500">
              ou cliquez pour sélectionner un fichier
            </div>
            <input
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
            >
              📂 Choisir un fichier
            </label>
          </div>
        )}
      </div>

      {/* Aperçu du fichier et mapping des colonnes */}
      {showPreview && filePreview.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-3">🔍 Aperçu du fichier et configuration des colonnes</h4>
          
          {/* Aperçu des données */}
          <div className="mb-4">
            <h5 className="font-medium text-blue-700 mb-2">Premières lignes du fichier :</h5>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    {filePreview[0]?.map((col: any, index: number) => (
                      <th key={index} className="border border-gray-300 px-2 py-1 text-center">
                        Colonne {index}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filePreview.slice(1).map((row: any, rowIndex: number) => (
                    <tr key={rowIndex}>
                      {row.map((cell: any, colIndex: number) => (
                        <td key={colIndex} className="border border-gray-300 px-2 py-1 text-center">
                          {String(cell || '').substring(0, 20)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Configuration du mapping */}
          <div className="mb-4">
            <h5 className="font-medium text-blue-700 mb-2">Configuration du mapping des colonnes :</h5>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(columnMapping).map(([field, columnIndex]) => (
                <div key={field} className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-blue-700 min-w-[120px]">
                    {field === 'raisonSociale' ? 'Raison Sociale' :
                     field === 'codeUnion' ? 'Code Union' :
                     field === 'groupeClient' ? 'Groupe Client' :
                     field === 'fournisseur' ? 'Fournisseur' :
                     field === 'marque' ? 'Marque' :
                     field === 'sousFamille' ? 'Sous Famille' :
                     field === 'groupeFournisseur' ? 'Groupe Fournisseur' :
                     field === 'annee' ? 'Année' :
                     field === 'ca' ? 'CA (€)' : field}:
                  </label>
                  <select
                    value={columnIndex}
                    onChange={(e) => updateColumnMapping(field, parseInt(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    {filePreview[0]?.map((_: any, index: number) => (
                      <option key={index} value={index}>
                        Colonne {index}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex space-x-3">
            <button
              onClick={handleImportWithMapping}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              ✅ Importer avec ce mapping
            </button>
            <button
              onClick={() => setShowPreview(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              ❌ Annuler
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2">📋 Structure de vos données :</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>• <strong>Colonne 0</strong> : Mois (cumul-annuel)</div>
          <div>• <strong>Colonne 1</strong> : Année (2024/2025)</div>
          <div>• <strong>Colonne 2</strong> : Code Union (M0114, M0109, etc.)</div>
          <div>• <strong>Colonne 3</strong> : Raison Sociale (Nom de l'entreprise)</div>
          <div>• <strong>Colonne 4</strong> : Groupe Client (GROUPE LES LYONNAIS, etc.)</div>
          <div>• <strong>Colonne 5</strong> : Région Commerciale (LYON, SUD, etc.)</div>
          <div>• <strong>Colonne 6</strong> : Fournisseur (Alliance, ACR, DCA, Exadis)</div>
          <div>• <strong>Colonne 7</strong> : Marque (GAMOTECH, AIRTEX, etc.)</div>
          <div>• <strong>Colonne 8</strong> : Groupe FRS (AIER, AIRTEX PRODUCTS, etc.)</div>
          <div>• <strong>Colonne 9</strong> : Famille (injection essence et diesel vl, etc.)</div>
          <div>• <strong>Colonne 10</strong> : Sous Famille (injecteurs cr, pompes, etc.)</div>
          <div>• <strong>Colonne 11</strong> : CA (€) (Chiffre d'affaires)</div>
        </div>
        <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
          <div className="text-sm text-green-800">
            <strong>✅ Mapping automatique :</strong> Le système a détecté votre structure et configuré automatiquement 
            le mapping des colonnes. Vous pouvez ajuster si nécessaire.
          </div>
        </div>
      </div>

      {/* Statut de l'import */}
      {importStatus && (
        <div className={`mt-4 p-3 rounded-lg ${
          importStatus.includes('✅') 
            ? 'bg-green-100 text-green-800' 
            : importStatus.includes('❌') 
            ? 'bg-red-100 text-red-800'
            : 'bg-blue-100 text-blue-800'
        }`}>
          {importStatus}
        </div>
      )}

      {/* Modal d'import Excel Clients */}
      {showExcelImport && ExcelClientImport && (
        <ExcelClientImport
          onImportComplete={(result: any) => {
            console.log('Import Excel Clients terminé:', result);
            setShowExcelImport(false);
            // TODO: Traiter les données clients importées
          }}
          onClose={() => setShowExcelImport(false)}
        />
      )}

      {/* Modal Clients Importés */}
      {showImportedClients && ImportedClientsList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Clients Importés</h2>
              <button
                onClick={() => setShowImportedClients(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <ImportedClientsList />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataImport;
