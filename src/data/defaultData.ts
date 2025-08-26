import { AdherentData } from '../types';

// Fonction pour charger les données par défaut depuis le fichier JSON
export const loadDefaultData = async (): Promise<AdherentData[]> => {
  try {
    // Charger le fichier JSON depuis le dossier public
    const response = await fetch('./groupementUnion_data_2025-08-26.json');
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const jsonData = await response.json();
    
    // Vérifier la structure des données
    if (jsonData.data && Array.isArray(jsonData.data)) {
      console.log('✅ Données chargées depuis le fichier JSON:', jsonData.data.length, 'enregistrements');
      return jsonData.data;
    } else {
      throw new Error('Structure de données invalide');
    }
  } catch (error) {
    console.error('❌ Erreur lors du chargement des données par défaut:', error);
    console.log('🔄 Utilisation des données d\'exemple en fallback');
    
    // Retourner des données d'exemple en cas d'erreur
    return [
      {
        codeUnion: 'DEMO001',
        raisonSociale: 'Client Démo',
        groupeClient: 'Démo',
        fournisseur: 'Fournisseur Démo',
        marque: 'Marque Démo',
        sousFamille: 'Famille Démo',
        groupeFournisseur: 'Démo',
        annee: 2025,
        ca: 1000
      }
    ];
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
    sousFamille: 'Famille Démo',
    groupeFournisseur: 'Démo',
    annee: 2025,
    ca: 1000
  }
];
