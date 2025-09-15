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
    raisonSociale: 3,        // Colonne D : Raison Sociale (GARAGE RAVIER)
    codeUnion: 2,            // Colonne C : Code Union (J0154, M0247)
    groupeClient: 4,         // Colonne E : Groupe Client (GROUPE JUMBO)
    fournisseur: 6,          // Colonne G : Fournisseur (DCA)
    marque: 7,               // Colonne H : Marque (diframa, ALCAR, AUTOCASH)
    sousFamille: 10,         // Colonne K : Sous Famille (Divers Produit atelier, Valve)
    groupeFournisseur: 8,    // Colonne I : Groupe FRS (vide pour DCA)
    annee: 1,                // Colonne B : Année (2025)
    ca: 11                   // Colonne L : CA (€) - 20,82, 36, 138,46
  });
  const [pushToSupabase, setPushToSupabase] = useState(true); // Réactivé après création colonne
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [totalCA, setTotalCA] = useState<number>(0);
  const [statsFournisseurs, setStatsFournisseurs] = useState<Record<string, { count: number; total: number }>>({});

  // Fonction pour pousser les données vers Supabase
  const pushDataToSupabase = async (data: AdherentData[]) => {
    try {
      console.log('🔄 Poussage vers Supabase...', data.length, 'enregistrements');
      console.log('🌍 Échantillon avec régions:', data.slice(0, 3).map(d => ({ 
        codeUnion: d.codeUnion, 
        regionCommerciale: d.regionCommerciale 
      })));
      
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
          console.log('📊 Lecture du fichier Excel - Taille:', file.size, 'bytes');
          
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { 
            type: 'array',
            // Options pour les gros fichiers
            cellHTML: false,
            cellNF: false,
            cellText: false,
            cellDates: false,
            sheetStubs: false,
            // Augmenter les limites
            dense: true
          });
          
          const sheetName = workbook.SheetNames[0];
          console.log('📋 Feuille Excel:', sheetName);
          
          const worksheet = workbook.Sheets[sheetName];
          
          // Vérifier la plage de données
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
          console.log('📐 Plage de données détectée:', worksheet['!ref']);
          console.log('📊 Nombre de lignes théoriques:', range.e.r + 1);
          console.log('📊 Nombre de colonnes théoriques:', range.e.c + 1);
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            // Options pour éviter les limitations
            range: worksheet['!ref'],
            defval: '',
            blankrows: true
          });
          
          console.log('✅ Données JSON extraites:', jsonData.length, 'lignes');
          
          // Afficher l'aperçu d'abord
          setFilePreview(jsonData.slice(0, 5)); // Premières 5 lignes
          setShowPreview(true);
          
          // Convertir les données en format AdherentData avec le mapping personnalisé
          const processedData = convertToAdherentData(jsonData);
          resolve(processedData);
        } catch (error) {
          console.error('❌ Erreur lors de la lecture Excel:', error);
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsArrayBuffer(file);
    });
  };

  const processCSVFile = async (file: File): Promise<AdherentData[]> => {
    return new Promise((resolve, reject) => {
      console.log('📄 Lecture du fichier CSV - Taille:', file.size, 'bytes');
      
      Papa.parse(file, {
        header: false, // Pas d'en-tête automatique
        skipEmptyLines: true,
        // Options pour les gros fichiers
        chunk: undefined, // Pas de chunking pour garder toutes les données
        worker: false, // Pas de worker pour éviter les limitations
        complete: (results) => {
          try {
            console.log('✅ Données CSV extraites:', results.data.length, 'lignes');
            console.log('📊 Erreurs CSV:', results.errors.length);
            
            if (results.errors.length > 0) {
              console.warn('⚠️ Erreurs lors du parsing CSV:', results.errors.slice(0, 5));
            }
            
            // Afficher l'aperçu d'abord
            setFilePreview(results.data.slice(0, 5)); // Premières 5 lignes
            setShowPreview(true);
            
            // Convertir les données en format AdherentData avec le mapping personnalisé
            const processedData = convertToAdherentData(results.data);
            resolve(processedData);
          } catch (error) {
            console.error('❌ Erreur lors du traitement CSV:', error);
            reject(error);
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors de la lecture CSV:', error);
          reject(error);
        }
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

  // Fonction pour normaliser une ligne en gérant les cellules vides
  const normalizeRow = (row: any[]): any[] => {
    if (!row || row.length === 0) return [];
    
    // Créer un tableau avec une taille fixe pour éviter les décalements
    const normalizedRow = new Array(20).fill(''); // Taille suffisante pour toutes les colonnes
    
    // Copier les valeurs existantes
    row.forEach((value, index) => {
      if (index < normalizedRow.length) {
        normalizedRow[index] = value || '';
      }
    });
    
    // Gestion spéciale pour la colonne groupe_frs (colonne I = index 8)
    // Cette colonne est vide pour tous les fournisseurs sauf Alliance
    const fournisseur = String(normalizedRow[6] || '').trim().toLowerCase(); // Colonne G = fournisseur
    if (fournisseur !== 'alliance' && fournisseur !== '') {
      // S'assurer que la colonne groupe_frs est vide pour les autres fournisseurs
      normalizedRow[8] = ''; // Colonne I = groupe_frs
    }
    
    return normalizedRow;
  };

  // Fonction pour valider la cohérence des données et détecter les décalements
  const validateDataConsistency = (dataRows: any[], mapping: Record<string, number>): { isValid: boolean; warnings: string[] } => {
    const warnings: string[] = [];
    
    // Analyser les premières 20 lignes pour détecter les problèmes
    const sampleRows = dataRows.slice(0, Math.min(20, dataRows.length));
    
    // Vérifier la cohérence des colonnes critiques
    const criticalFields = ['codeUnion', 'raisonSociale', 'ca'];
    
    criticalFields.forEach(field => {
      const colIndex = mapping[field];
      if (colIndex === undefined) {
        warnings.push(`⚠️ Colonne ${field} non trouvée dans le mapping`);
        return;
      }
      
      const values = sampleRows
        .map(row => String(row[colIndex] || '').trim())
        .filter(v => v);
      
      if (values.length === 0) {
        warnings.push(`⚠️ Aucune valeur trouvée pour ${field} en colonne ${colIndex}`);
        return;
      }
      
      // Vérifier les patterns spécifiques
      if (field === 'codeUnion') {
        const validCodes = values.filter(v => /^M\d{4}$/.test(v) || /^[A-Z]\d{3,4}$/.test(v));
        if (validCodes.length < values.length * 0.8) {
          warnings.push(`⚠️ Codes Union suspects en colonne ${colIndex}: ${values.slice(0, 3).join(', ')}...`);
        }
      }
      
      if (field === 'ca') {
        const validNumbers = values.filter(v => /^\d+[,.]?\d*$/.test(v.replace(/\s/g, '')));
        if (validNumbers.length < values.length * 0.8) {
          warnings.push(`⚠️ Valeurs CA suspectes en colonne ${colIndex}: ${values.slice(0, 3).join(', ')}...`);
        }
      }
    });
    
    // Détecter les décalements potentiels
    const rowLengths = sampleRows.map(row => row.length);
    const avgLength = rowLengths.reduce((a, b) => a + b, 0) / rowLengths.length;
    const inconsistentRows = rowLengths.filter(len => Math.abs(len - avgLength) > 2);
    
    if (inconsistentRows.length > sampleRows.length * 0.1) {
      warnings.push(`⚠️ ${inconsistentRows.length} lignes avec un nombre de colonnes incohérent (décalement possible)`);
    }
    
    // Vérifier spécifiquement la colonne groupe_frs (colonne I = index 8)
    const groupeFrsValues = sampleRows
      .map(row => String(row[8] || '').trim())
      .filter(v => v);
    
    const fournisseurValues = sampleRows
      .map(row => String(row[6] || '').trim().toLowerCase()) // Colonne G = fournisseur
      .filter(v => v);
    
    // Vérifier que la colonne groupe_frs est vide pour les non-Alliance
    let groupeFrsIssues = 0;
    sampleRows.forEach((row, index) => {
      const fournisseur = String(row[6] || '').trim().toLowerCase(); // Colonne G = fournisseur
      const groupeFrs = String(row[8] || '').trim(); // Colonne I = groupe_frs
      
      if (fournisseur && fournisseur !== 'alliance' && groupeFrs !== '') {
        groupeFrsIssues++;
        console.log(`Ligne ${index + 1}: fournisseur=${fournisseur}, groupe_frs=${groupeFrs}`);
      }
    });
    
    if (groupeFrsIssues > 0) {
      warnings.push(`⚠️ ${groupeFrsIssues} lignes avec groupe_frs rempli pour des fournisseurs non-Alliance`);
    }
    
    // Vérifier les cellules vides au milieu des lignes (sauf groupe_frs)
    let emptyMiddleCells = 0;
    sampleRows.forEach((row, rowIndex) => {
      for (let i = 1; i < row.length - 1; i++) {
        if (i !== 8 && (!row[i] || String(row[i]).trim() === '')) { // Exclure la colonne groupe_frs
          emptyMiddleCells++;
        }
      }
    });
    
    if (emptyMiddleCells > sampleRows.length * 2) {
      warnings.push(`⚠️ Nombreuses cellules vides détectées (${emptyMiddleCells}), risque de décalement`);
    }
    
    return {
      isValid: warnings.length === 0,
      warnings
    };
  };

  // Fonction pour détecter la structure réelle des données
  const detectDataStructure = (dataRows: any[]): Record<string, number> => {
    console.log('🔍 Détection de la structure des données...');
    
    // Analyser les premières lignes pour détecter les patterns
    const sampleRows = dataRows.slice(0, Math.min(10, dataRows.length));
    const columnPatterns: { [key: string]: number[] } = {};
    
    // Patterns de détection pour chaque champ
    const patterns = {
      codeUnion: [/^M\d{4}$/, /^J\d{4}$/, /^[A-Z]\d{3,4}$/],
      raisonSociale: [/^[A-Z][A-Z\s&'-]+$/i],
      groupeClient: [/^GROUPE/i, /^[A-Z][A-Z\s&'-]+$/i],
      fournisseur: [/^Alliance$/i, /^ACR$/i, /^DCA$/i, /^Exadis$/i, /^EXADIS$/i],
      marque: [/^[A-Z][A-Z\s&'-]+$/i],
      annee: [/^20\d{2}$/],
      ca: [/^\d+[,.]?\d*$/, /^\d+[,.]?\d*\s*€?$/]
    };
    
    // Analyser chaque colonne
    for (let colIndex = 0; colIndex < 20; colIndex++) {
      const columnValues = sampleRows.map(row => String(row[colIndex] || '').trim()).filter(v => v);
      
      if (columnValues.length === 0) continue;
      
      // Tester chaque pattern
      Object.entries(patterns).forEach(([field, fieldPatterns]) => {
        const matches = columnValues.filter(value => 
          fieldPatterns.some(pattern => pattern.test(value))
        ).length;
        
        const matchRate = matches / columnValues.length;
        
        if (matchRate > 0.7) { // 70% de correspondance minimum
          if (!columnPatterns[field]) columnPatterns[field] = [];
          columnPatterns[field].push(colIndex);
        }
      });
    }
    
    // Choisir la meilleure colonne pour chaque champ
    const detectedMapping: Record<string, number> = {};
    Object.entries(columnPatterns).forEach(([field, columns]) => {
      if (columns.length > 0) {
        // Prendre la colonne avec le plus de correspondances
        detectedMapping[field] = columns[0];
      }
    });
    
    console.log('🎯 Structure détectée:', detectedMapping);
    return detectedMapping;
  };

  const convertToAdherentData = (rawData: any[]): AdherentData[] => {
    console.log('📄 LECTURE SIMPLE - Données reçues:', rawData.length, 'lignes');
    
    // Mapping simple et fixe
    const mapping = {
      codeUnion: 2,      // Colonne C
      raisonSociale: 3,  // Colonne D  
      groupeClient: 4,   // Colonne E
      fournisseur: 6,    // Colonne G
      marque: 7,         // Colonne H
      groupeFournisseur: 8, // Colonne I
      sousFamille: 10,   // Colonne K
      annee: 1,          // Colonne B
      ca: 11             // Colonne L
    };
    
    console.log('📊 Mapping fixe utilisé:', mapping);
    
    // Afficher les premières lignes simplement
    console.log('🔍 Premières lignes:');
    rawData.slice(0, 3).forEach((row, index) => {
      console.log(`Ligne ${index + 1}:`, {
        B_Annee: row[1],
        C_CodeUnion: row[2], 
        G_Fournisseur: row[6],
        L_CA: row[11]
      });
    });
    
    // ========================================
    // AGRÉGATION ROBUSTE AVEC CLÉ COMPLÈTE
    // ========================================
    
    // Utils de normalisation avec nettoyage agressif des guillemets Excel
    const norm = (s: unknown): string => {
      let cleaned = String(s ?? "")
        .replace(/\u00A0|\u202F/g, " ")   // NBSP -> espace normal
        .trim();
      
      // Nettoyage spécial pour les guillemets Excel mal échappés
      if (cleaned === '""' || cleaned === "''" || cleaned === '""""') {
        cleaned = ''; // Chaîne vide littérale
      } else {
        cleaned = cleaned
          .replace(/^["']+|["']+$/g, "")  // Supprime guillemets en début/fin
          .replace(/^""|""$/g, "")        // Supprime guillemets doubles échappés
          .replace(/^'|'$/g, "");         // Supprime guillemets simples
      }
      
      return cleaned.trim().toUpperCase();
    };

    const toNumber = (value: unknown): number => {
      if (typeof value === "number") return Math.round(value * 100) / 100;
      const s = String(value ?? "")
        .replace(/\s/g, "")     // supprime espaces (y compris NBSP)
        .replace(",", ".");     // virgule -> point
      
      // accepter notation scientifique valide (4.44e-16, -7.11e-15...)
      const n = Number(s);
      if (!Number.isFinite(n)) return NaN;
      
      // normaliser les valeurs très proches de 0 (notation scientifique)
      return Math.abs(n) < 1e-9 ? 0 : Math.round(n * 100) / 100;
    };

    // Type pour une ligne normalisée
    interface RowData {
      mois: string;
      annee: number;
      codeUnion: string;
      raisonSociale: string;
      groupeClient: string;
      regionCommerciale: string;
      fournisseur: string;
      marque: string;
      groupeFRS: string; // non utilisé dans la clé
      famille: string;
      sousFamille: string;
      ca: number;
    }

    // Fonction pour créer une clé d'agrégation complète
    const keyOf = (r: RowData): string => {
      return [
        r.mois,
        r.annee,
        r.codeUnion,
        r.raisonSociale,
        r.groupeClient,
        r.regionCommerciale,
        r.fournisseur,
        r.marque,
        r.famille,
        r.sousFamille
        // ❌ PAS groupeFRS - vide pour ACR/DCA/EXADIS
      ].map(norm).join("|");
    };

    // Tracking détaillé des rejets avec montants
    let droppedByRule: Record<string, {count: number, sum: number}> = {};
    
    const drop = (reason: string, row: any, ca: number = 0) => {
      const entry = droppedByRule[reason] ?? { count: 0, sum: 0 };
      droppedByRule[reason] = { 
        count: entry.count + 1, 
        sum: entry.sum + (Number.isFinite(ca) ? ca : 0) 
      };
    };
    
    // Fonction pour vérifier les champs STRICTEMENT requis (ultra-minimal)
    const isRequiredOk = (codeUnion: string, fournisseur: string, annee: number, ca: number) => {
      const yearOk = annee > 2000 && annee < 2100;
      const codeOk = codeUnion.length > 0; // Déjà normalisé par norm()
      const supplierOk = fournisseur.length > 0; // Déjà normalisé par norm()
      const caOk = Number.isFinite(ca);
      
      return yearOk && codeOk && supplierOk && caOk;
    };
    
    let montantsNegatifsTrouves = 0;
    
    console.log('🔍 DÉBUT PARSING AVEC FILTRES ASSOUPLIS:');
    
    // ========================================
    // PHASE 1: MAPPING BRUT → RowData
    // ========================================
    const mapped: RowData[] = [];
    const invalid: any[] = [];
    
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      
      // 1. Ignorer les lignes complètement vides
      if (!row || row.length < 3) {
        drop('ligne_vide', row);
        continue;
      }
      
      // 2. Ignorer UNIQUEMENT la ligne d'entête (où Année === 'Année')
      const anneeRaw = row[mapping.annee];
      if (String(anneeRaw).trim().toLowerCase() === 'année') {
        drop('entete', row);
        continue;
      }
      
      // 3. Extraction CA avec acceptation de la notation scientifique
      const ca = toNumber(row[mapping.ca]);
      
      if (isNaN(ca)) {
        drop('CA_NaN_unparseable', row);
        invalid.push({ ligne: i + 1, ca_raw: row[mapping.ca] });
        continue;
      }
      
      // 4. Extraction des champs MINIMAUX requis avec normalisation robuste
      let codeUnion = norm(row[mapping.codeUnion] || '');
      const fournisseur = norm(row[mapping.fournisseur] || '');
      const raisonSociale = norm(row[mapping.raisonSociale] || '');
      
      // Si codeUnion est vide, générer un fallback pour ne pas perdre la ligne
      if (codeUnion.length === 0 && fournisseur.length > 0) {
        codeUnion = `UNKNOWN_${fournisseur}_${i}`; // Fallback unique
      }
      
      // 5. Conversion année (ultra-permissive)
      let annee = 2024; // fallback par défaut
      if (anneeRaw) {
        const parsedAnnee = parseInt(String(anneeRaw));
        if (parsedAnnee > 2000 && parsedAnnee < 2100) {
          annee = parsedAnnee;
        } else if (parsedAnnee === 24) {
          annee = 2024; // format court "24" → 2024
        } else if (parsedAnnee === 25) {
          annee = 2025; // format court "25" → 2025
        }
        // Sinon garder le fallback 2024
      }
      
      // 6. Validation STRICTEMENT nécessaire avec logs détaillés
      if (!isRequiredOk(codeUnion, fournisseur, annee, ca)) {
        // Log détaillé des 10 premiers rejets pour diagnostic
        const rejetCount = droppedByRule['champs_requis_manquants']?.count || 0;
        if (rejetCount < 10) {
          // Logs plus détaillés avec JSON.stringify pour éviter [Object object]
          console.log(`❌ REJET ligne ${i + 1}:`);
          console.log(`  - codeUnion: "${codeUnion}" (length: ${codeUnion.length})`);
          console.log(`  - fournisseur: "${fournisseur}" (length: ${fournisseur.length})`);
          console.log(`  - raisonSociale: "${raisonSociale}" (length: ${raisonSociale.length})`);
          console.log(`  - annee: ${annee}`);
          console.log(`  - ca: ${ca}`);
          console.log(`  - raw_codeUnion: ${JSON.stringify(row[mapping.codeUnion])}`);
          console.log(`  - raw_fournisseur: ${JSON.stringify(row[mapping.fournisseur])}`);
          console.log(`  - raw_raisonSociale: ${JSON.stringify(row[mapping.raisonSociale])}`);
          
          // Test des critères individuellement
          console.log(`  - Tests individuels:`);
          console.log(`    * annee > 2000 && < 2100: ${annee > 2000 && annee < 2100}`);
          console.log(`    * codeUnion.length > 0: ${codeUnion.length > 0}`);
          console.log(`    * fournisseur.length > 0: ${fournisseur.length > 0}`);
          console.log(`    * Number.isFinite(ca): ${Number.isFinite(ca)}`);
        }
        drop('champs_requis_manquants', row, ca);
        continue;
      }
      
      // 7. Compter les négatifs (pas un rejet!)
      if (ca < 0) {
        montantsNegatifsTrouves++;
      }
      
      // 8. Créer la RowData avec TOUS les champs (même vides)
      const rowData: RowData = {
        mois: String(row[0] || 'cumul-annuel'),
        annee,
        codeUnion,
        raisonSociale,
        groupeClient: String(row[mapping.groupeClient] || ''),       // ✅ PEUT ÊTRE VIDE
        regionCommerciale: String(row[5] || ''),                      // ✅ PEUT ÊTRE VIDE
        fournisseur,
        marque: String(row[mapping.marque] || ''),                    // ✅ PEUT ÊTRE VIDE
        groupeFRS: String(row[mapping.groupeFournisseur] || ''),      // ✅ PEUT ÊTRE VIDE (par design)
        famille: String(row[9] || ''),                                // ✅ PEUT ÊTRE VIDE
        sousFamille: String(row[mapping.sousFamille] || ''),          // ✅ PEUT ÊTRE VIDE
        ca
      };
      
      mapped.push(rowData);
    }
    
    // ========================================
    // PHASE 2: CALCUL TOTAL AVANT AGRÉGATION + RÉFÉRENCE EXCEL
    // ========================================
    const totalBefore = mapped.reduce((sum, r) => sum + r.ca, 0);
    const expectedExcelTotal = 25454528.70; // Référence Excel
    
    // Totaux par fournisseur AVANT agrégation
    const sumByFournisseur = (rows: RowData[]): Record<string, number> => {
      return rows.reduce((acc, r) => {
        const fournisseur = norm(r.fournisseur);
        acc[fournisseur] = (acc[fournisseur] || 0) + r.ca;
        return acc;
      }, {} as Record<string, number>);
    };
    
    const suppliersBefore = sumByFournisseur(mapped);
    
    // ========================================
    // PHASE 3: AGRÉGATION AVEC CLÉ COMPLÈTE
    // ========================================
    const aggregationMap = new Map<string, RowData>();
    let lignesAgregees = 0;
    
    for (const r of mapped) {
      const key = keyOf(r);
      const existing = aggregationMap.get(key);
      
      if (existing) {
        // ADDITIONNER avec arrondi à 2 décimales
        existing.ca = Math.round((existing.ca + r.ca) * 100) / 100;
        lignesAgregees++;
        
        if (lignesAgregees <= 5) {
          console.log(`🔄 Agrégation: ${r.codeUnion}-${norm(r.fournisseur)} → CA: ${existing.ca.toFixed(2)} €`);
        }
      } else {
        // Nouvelle entrée (clone pour éviter les mutations)
        aggregationMap.set(key, { ...r });
      }
    }
    
    // ========================================
    // PHASE 4: CONVERSION VERS AdherentData
    // ========================================
    const processedData: AdherentData[] = Array.from(aggregationMap.values()).map(r => ({
      codeUnion: r.codeUnion,
      raisonSociale: r.raisonSociale,
      groupeClient: r.groupeClient,
      regionCommerciale: r.regionCommerciale,
      fournisseur: r.fournisseur,
      marque: r.marque,
      sousFamille: r.sousFamille,
      groupeFournisseur: r.groupeFRS,
      annee: r.annee,
      ca: r.ca
    }));
    
    // ========================================
    // PHASE 5: CONTRÔLE DE COHÉRENCE COMPLET
    // ========================================
    const totalAfter = processedData.reduce((sum, item) => sum + item.ca, 0);
    
    // Totaux par fournisseur APRÈS agrégation
    const suppliersAfter: Record<string, number> = {};
    processedData.forEach(r => {
      const fournisseur = norm(r.fournisseur);
      suppliersAfter[fournisseur] = (suppliersAfter[fournisseur] || 0) + r.ca;
    });
    
    // Calculs avec analyse des montants négatifs
    const ca2024 = processedData.filter(item => item.annee === 2024).reduce((sum, item) => sum + item.ca, 0);
    const ca2025 = processedData.filter(item => item.annee === 2025).reduce((sum, item) => sum + item.ca, 0);
    const total = ca2024 + ca2025;
    
    // Analyser les montants négatifs
    const montantsNegatifs = processedData.filter(item => item.ca < 0);
    const totalNegatif = montantsNegatifs.reduce((sum, item) => sum + item.ca, 0);
    const montantsPositifs = processedData.filter(item => item.ca > 0);
    const totalPositif = montantsPositifs.reduce((sum, item) => sum + item.ca, 0);
    
    console.log('📊 RAPPORT DE COHÉRENCE COMPLET:');
    console.log('═══════════════════════════════════════');
    console.log(`📥 LIGNES LUES: ${rawData.length}`);
    console.log(`📋 LIGNES MAPPÉES: ${mapped.length}`);
    console.log(`🔄 LIGNES AGRÉGÉES: ${lignesAgregees}`);
    console.log(`✅ LIGNES FINALES: ${processedData.length}`);
    console.log(`➖ MONTANTS NÉGATIFS TROUVÉS: ${montantsNegatifsTrouves}`);
    console.log('');
    console.log('📋 DÉTAIL DES REJETS PAR RÈGLE:');
    console.table(droppedByRule);
    console.log('');
    console.log('💰 CONTRÔLE DE COHÉRENCE TOTAUX:');
    console.log(`  Référence Excel: ${expectedExcelTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`);
    console.log(`  Total AVANT agrégation: ${Math.round(totalBefore * 100) / 100} €`);
    console.log(`  Total APRÈS agrégation: ${Math.round(totalAfter * 100) / 100} €`);
    console.log(`  Écart vs Excel: ${Math.round((totalBefore - expectedExcelTotal) * 100) / 100} €`);
    console.log(`  Différence AVANT/APRÈS: ${Math.round((totalAfter - totalBefore) * 100) / 100} €`);
    console.log('');
    console.log('🏢 TOTAUX PAR FOURNISSEUR AVANT/APRÈS:');
    
    const allSuppliers = Array.from(new Set([...Object.keys(suppliersBefore), ...Object.keys(suppliersAfter)]));
    allSuppliers.forEach(supplier => {
      const before = suppliersBefore[supplier] || 0;
      const after = suppliersAfter[supplier] || 0;
      const diff = after - before;
      console.log(`  ${supplier}:`);
      console.log(`    AVANT: ${before.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`);
      console.log(`    APRÈS: ${after.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`);
      console.log(`    DIFF: ${diff.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`);
    });
    console.log('');
    console.log('💰 TOTAUX PAR ANNÉE:');
    console.log(`  CA 2024: ${ca2024.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`);
    console.log(`  CA 2025: ${ca2025.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`);
    console.log(`  TOTAL IMPORTÉ: ${total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`);
    console.log('');
    console.log('📊 ANALYSE MONTANTS:');
    console.log(`  Montants positifs: ${montantsPositifs.length} lignes = ${totalPositif.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`);
    console.log(`  Montants négatifs: ${montantsNegatifs.length} lignes = ${totalNegatif.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`);
    
    // Contrôle de cohérence avec montant attendu
    const montantAttendu = 25454528.70;
    const ecart = total - montantAttendu;
    const ecartPourcentage = (ecart / montantAttendu * 100);
    
    console.log('');
    console.log('🎯 CONTRÔLE DE COHÉRENCE:');
    console.log(`  Montant attendu (Excel): ${montantAttendu.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`);
    console.log(`  Montant importé: ${total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`);
    console.log(`  ÉCART: ${ecart.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € (${ecartPourcentage.toFixed(3)}%)`);
    
    if (montantsNegatifs.length > 0) {
      console.log('');
      console.log('📋 EXEMPLES MONTANTS NÉGATIFS:');
      montantsNegatifs.slice(0, 5).forEach(item => {
        console.log(`  ${item.codeUnion} - ${item.fournisseur}: ${item.ca.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`);
      });
    }
    
    // Analyse par fournisseur
    const analyseParFournisseur = processedData.reduce((acc, item) => {
      const fournisseur = item.fournisseur || 'Inconnu';
      if (!acc[fournisseur]) {
        acc[fournisseur] = { count: 0, total: 0, negatifs: 0, totalNegatif: 0 };
      }
      acc[fournisseur].count++;
      acc[fournisseur].total += item.ca;
      if (item.ca < 0) {
        acc[fournisseur].negatifs++;
        acc[fournisseur].totalNegatif += item.ca;
      }
      return acc;
    }, {} as Record<string, { count: number; total: number; negatifs: number; totalNegatif: number }>);
    
    console.log('');
    console.log('🏢 ANALYSE PAR FOURNISSEUR:');
    Object.entries(analyseParFournisseur).forEach(([fournisseur, stats]) => {
      console.log(`  ${fournisseur}:`);
      console.log(`    Lignes: ${stats.count}`);
      console.log(`    Total CA: ${stats.total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`);
      if (stats.negatifs > 0) {
        console.log(`    Montants négatifs: ${stats.negatifs} lignes = ${stats.totalNegatif.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`);
      }
    });
    
    // Mise à jour des states
    setTotalCA(total);
    setImportStatus(`✅ ${processedData.length} lignes - Total: ${total.toLocaleString('fr-FR')} €`);
    
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
      console.log('🔍 Vérification sauvegarde:', { pushToSupabase, dataLength: importedData.length });
      if (pushToSupabase && importedData.length > 0) {
        setImportStatus(`🔄 Poussage vers Supabase...`);
        console.log('🚀 Début sauvegarde Supabase avec régions...');
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
                  <label className="text-sm font-medium text-blue-700 min-w-[140px]">
                    {field === 'raisonSociale' ? 'Raison Sociale' :
                     field === 'codeUnion' ? 'Code Union' :
                     field === 'groupeClient' ? 'Groupe Client' :
                     field === 'fournisseur' ? 'Fournisseur' :
                     field === 'marque' ? 'Marque' :
                     field === 'sousFamille' ? 'Sous Famille' :
                     field === 'groupeFournisseur' ? '🏢 Groupe FRS (Famille)' :
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
                  {field === 'groupeFournisseur' && (
                    <span className="text-xs text-gray-500">
                      (Vide sauf Alliance)
                    </span>
                  )}
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
        <h4 className="font-medium text-gray-700 mb-2">📋 Structure de votre nouveau tableau :</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>• <strong>Colonne A (0)</strong> : Mois (cumul-annuel)</div>
          <div>• <strong>Colonne B (1)</strong> : Année (2025)</div>
          <div>• <strong>Colonne C (2)</strong> : Code Union (J0154, M0247, etc.)</div>
          <div>• <strong>Colonne D (3)</strong> : Raison Sociale (GARAGE RAVIER, Jumbo Pneus...)</div>
          <div>• <strong>Colonne E (4)</strong> : Groupe Client (GROUPE JUMBO, etc.)</div>
          <div>• <strong>Colonne F (5)</strong> : Région Commerciale (REGION PARISIENNE, NORD, etc.)</div>
          <div>• <strong>Colonne G (6)</strong> : Fournisseur (DCA, Alliance, ACR, Exadis)</div>
          <div>• <strong>Colonne H (7)</strong> : Marque (diframa, ALCAR, AUTOCASH, etc.)</div>
          <div>• <strong>Colonne I (8)</strong> : Groupe FRS (vide pour DCA)</div>
          <div>• <strong>Colonne J (9)</strong> : Famille (ATELIER, DIVERS, FREINAGE, etc.)</div>
          <div>• <strong>Colonne K (10)</strong> : Sous Famille (Divers Produit atelier, Valve, etc.)</div>
          <div>• <strong>Colonne L (11)</strong> : CA (€) (20,82, 36, 138,46, etc.)</div>
        </div>
        <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
          <div className="text-sm text-green-800">
            <strong>✅ Mapping corrigé :</strong> Le mapping correspond maintenant exactement à la structure 
            de vos données. Plus de confusion possible !
          </div>
        </div>
        <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
          <div className="text-sm text-blue-800">
            <strong>🔧 Structure figée :</strong> Chaque colonne a une position fixe. Les cellules vides 
            ne causent plus de décalement.
          </div>
        </div>
      </div>

      {/* Statistiques d'import */}
      {totalCA > 0 && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-medium text-green-800 mb-3">💰 Statistiques d'import</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded border">
              <div className="text-lg font-semibold text-green-700">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(totalCA)}
              </div>
              <div className="text-sm text-gray-600">Montant total CA importé</div>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <div className="text-lg font-semibold text-blue-700">
                {Object.values(statsFournisseurs).reduce((sum, stats) => sum + stats.count, 0)}
              </div>
              <div className="text-sm text-gray-600">Lignes importées</div>
            </div>
          </div>
          
          {Object.keys(statsFournisseurs).length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium text-green-700 mb-2">Répartition par fournisseur :</h5>
              <div className="space-y-2">
                {Object.entries(statsFournisseurs).map(([fournisseur, stats]) => (
                  <div key={fournisseur} className="flex justify-between items-center bg-white p-2 rounded border">
                    <span className="font-medium">{fournisseur}</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'EUR'
                        }).format(stats.total)}
                      </div>
                      <div className="text-xs text-gray-500">{stats.count} lignes</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Avertissements d'import */}
      {importWarnings.length > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="font-medium text-yellow-800 mb-2">⚠️ Avertissements détectés :</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {importWarnings.map((warning, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 text-xs text-yellow-600">
            💡 Ces avertissements peuvent indiquer des décalements de colonnes. Vérifiez vos données avant de continuer.
          </div>
        </div>
      )}

      {/* Statut de l'import */}
      {importStatus && (
        <div className={`mt-4 p-3 rounded-lg ${
          importStatus.includes('✅') 
            ? 'bg-green-100 text-green-800' 
            : importStatus.includes('❌') 
            ? 'bg-red-100 text-red-800'
            : importStatus.includes('⚠️')
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-blue-100 text-blue-800'
        }`}>
          {importStatus}
        </div>
      )}
    </div>
  );
};

export default DataImport;
