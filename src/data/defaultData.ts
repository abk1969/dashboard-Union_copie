import { AdherentData } from '../types';
import { getSampleData } from './sampleData';

// Fonction pour charger les données par défaut depuis le fichier JSON
export const loadDefaultData = async (): Promise<AdherentData[]> => {
  try {
    console.log('🚀 Tentative de chargement des données depuis le fichier JSON...');
    
    // Essayer d'abord le fichier principal
    const response = await fetch('./groupementUnion_data_2025-08-26.json');
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
    }
    
    console.log('📁 Fichier trouvé, chargement en cours...');
    const jsonData = await response.json();
    
    // Vérifier la structure des données
    if (jsonData.data && Array.isArray(jsonData.data)) {
      console.log('✅ Données chargées depuis le fichier JSON:', jsonData.data.length, 'enregistrements');
      return jsonData.data;
    } else {
      throw new Error('Structure de données invalide - pas de propriété "data"');
    }
  } catch (error) {
    console.error('❌ Erreur lors du chargement des données par défaut:', error);
    
    // Essayer de charger depuis localStorage si disponible
    try {
      const localBackup = localStorage.getItem('groupementUnion_backup');
      if (localBackup) {
        const backupData = JSON.parse(localBackup);
        if (backupData.data && Array.isArray(backupData.data) && backupData.data.length > 1) {
          console.log('🔄 Restauration depuis localStorage:', backupData.data.length, 'enregistrements');
          return backupData.data;
        }
      }
    } catch (localError) {
      console.error('❌ Erreur localStorage:', localError);
    }
    
    console.log('🔄 Utilisation des données d\'exemple en fallback');
    
    // Retourner des données d'exemple plus complètes
    return getSampleData();
  }
};

// Données d'exemple en fallback
export const fallbackData: AdherentData[] = [
  {
    codeUnion: 'DEMO001',
    raisonSociale: 'Client Démo',
    groupeClient: 'Démo',
    fournisseur: 'Fournisseur Démo',
    marque: 'Marque Démo',
    famille: 'freinage',
    sousFamille: 'plaquettes de frein',
    groupeFournisseur: 'Démo',
    annee: 2025,
    ca: 1000
  }
];
