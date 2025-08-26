import { AdherentData } from '../types';

// Données d'exemple plus complètes pour le déploiement
export const sampleData: AdherentData[] = [
  {
    codeUnion: 'UNION001',
    raisonSociale: 'Garage Union 1',
    groupeClient: 'Premium',
    fournisseur: 'BOSCH',
    marque: 'BOSCH',
    sousFamille: 'Freins',
    groupeFournisseur: 'Automobile',
    annee: 2024,
    ca: 15000
  },
  {
    codeUnion: 'UNION001',
    raisonSociale: 'Garage Union 1',
    groupeClient: 'Premium',
    fournisseur: 'BOSCH',
    marque: 'BOSCH',
    sousFamille: 'Freins',
    groupeFournisseur: 'Automobile',
    annee: 2025,
    ca: 18000
  },
  {
    codeUnion: 'UNION002',
    raisonSociale: 'Auto Service Union',
    groupeClient: 'Standard',
    fournisseur: 'LUK',
    marque: 'LUK',
    sousFamille: 'Embrayage',
    groupeFournisseur: 'Automobile',
    annee: 2024,
    ca: 8000
  },
  {
    codeUnion: 'UNION002',
    raisonSociale: 'Auto Service Union',
    groupeClient: 'Standard',
    fournisseur: 'LUK',
    marque: 'LUK',
    sousFamille: 'Embrayage',
    groupeFournisseur: 'Automobile',
    annee: 2025,
    ca: 9500
  },
  {
    codeUnion: 'UNION003',
    raisonSociale: 'Mécanique Union',
    groupeClient: 'Premium',
    fournisseur: 'ACR',
    marque: 'ACR',
    sousFamille: 'Filtres',
    groupeFournisseur: 'Automobile',
    annee: 2024,
    ca: 12000
  },
  {
    codeUnion: 'UNION003',
    raisonSociale: 'Mécanique Union',
    groupeClient: 'Premium',
    fournisseur: 'ACR',
    marque: 'ACR',
    sousFamille: 'Filtres',
    groupeFournisseur: 'Automobile',
    annee: 2025,
    ca: 14000
  }
];

// Fonction pour obtenir des données d'exemple
export const getSampleData = (): AdherentData[] => {
  return sampleData;
};
