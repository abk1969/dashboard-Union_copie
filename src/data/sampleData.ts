import { AdherentData, AdherentSummary, FournisseurPerformance, FamilleProduitPerformance, TopFlopClient } from '../types';

// Données d'exemple basées sur la structure fournie
export const sampleAdherentData: AdherentData[] = [
  {
    raisonSociale: 'ACD GENNEVILLIERS',
    codeUnion: 'M0002',
    groupeClient: 'INDEPENDANT UNION',
    fournisseur: 'Alliance',
    marque: 'VERNET',
    sousFamille: 'PIECES ELECTRIQUES',
    groupeFournisseur: 'VERNET',
    annee: 2024,
    ca: 14.58
  },
  {
    raisonSociale: 'ACD GENNEVILLIERS',
    codeUnion: 'M0002',
    groupeClient: 'INDEPENDANT UNION',
    fournisseur: 'Alliance',
    marque: 'VERNET',
    sousFamille: 'THERMOSTATS',
    groupeFournisseur: 'VERNET',
    annee: 2024,
    ca: 27.26
  },
  {
    raisonSociale: 'ACD GENNEVILLIERS',
    codeUnion: 'M0002',
    groupeClient: 'INDEPENDANT UNION',
    fournisseur: 'Alliance',
    marque: 'CEVAM',
    sousFamille: 'ALTERNATEURS VL E/S',
    groupeFournisseur: 'CEVAM',
    annee: 2024,
    ca: 133.12
  },
  {
    raisonSociale: 'ALLO PIECES AUTO VIENNE',
    codeUnion: 'M0114',
    groupeClient: 'GROUPE LES LYONNAIS',
    fournisseur: 'Alliance',
    marque: 'PAVI',
    sousFamille: 'AMORTISSEURS',
    groupeFournisseur: 'PAVI (PFR Partenaire)',
    annee: 2024,
    ca: 50.1
  },
  {
    raisonSociale: 'ALLO PIECES AUTO VIENNE',
    codeUnion: 'M0114',
    groupeClient: 'GROUPE LES LYONNAIS',
    fournisseur: 'Alliance',
    marque: 'PAVI',
    sousFamille: 'AUTRES PIECES MOTEURS (PISTONS',
    groupeFournisseur: 'PAVI (PFR Partenaire)',
    annee: 2024,
    ca: 493.92
  }
];

// Données 2025 (6 mois cumulés)
export const sampleAdherentData2025: AdherentData[] = [
  {
    raisonSociale: 'ACD GENNEVILLIERS',
    codeUnion: 'M0002',
    groupeClient: 'INDEPENDANT UNION',
    fournisseur: 'Alliance',
    marque: 'VERNET',
    sousFamille: 'PIECES ELECTRIQUES',
    groupeFournisseur: 'VERNET',
    annee: 2025,
    ca: 8.75
  },
  {
    raisonSociale: 'ACD GENNEVILLIERS',
    codeUnion: 'M0002',
    groupeClient: 'INDEPENDANT UNION',
    fournisseur: 'Alliance',
    marque: 'VERNET',
    sousFamille: 'THERMOSTATS',
    groupeFournisseur: 'VERNET',
    annee: 2025,
    ca: 16.36
  },
  {
    raisonSociale: 'ALLO PIECES AUTO VIENNE',
    codeUnion: 'M0114',
    groupeClient: 'GROUPE LES LYONNAIS',
    fournisseur: 'Alliance',
    marque: 'PAVI',
    sousFamille: 'AMORTISSEURS',
    groupeFournisseur: 'PAVI (PFR Partenaire)',
    annee: 2025,
    ca: 30.06
  }
];

// Résumé des adhérents
export const adherentsSummary: AdherentSummary[] = [
  {
    raisonSociale: 'ACD GENNEVILLIERS',
    codeUnion: 'M0002',
    groupeClient: 'INDEPENDANT UNION',
    ca2024: 8456.78,
    ca2025: 4228.39,
    progression: 15.2,
    statut: 'progression'
  },
  {
    raisonSociale: 'ALLO PIECES AUTO VIENNE',
    codeUnion: 'M0114',
    groupeClient: 'GROUPE LES LYONNAIS',
    ca2024: 12847.65,
    ca2025: 6423.83,
    progression: -8.7,
    statut: 'regression'
  }
];

// Performance par fournisseur
export const fournisseursPerformance: FournisseurPerformance[] = [
  {
    fournisseur: 'Alliance',
    ca2024: 2847650,
    ca2025: 1423825,
    pourcentageTotal: 45.2,
    progression: 12.5,
    pourcentage2024: 42.0,
    pourcentage2025: 44.0
  },
  {
    fournisseur: 'ACR',
    ca2024: 1800000,
    ca2025: 900000,
    pourcentageTotal: 28.7,
    progression: 8.3,
    pourcentage2024: 26.5,
    pourcentage2025: 27.8
  },
  {
    fournisseur: 'DCA',
    ca2024: 1150000,
    ca2025: 575000,
    pourcentageTotal: 18.3,
    progression: 15.7,
    pourcentage2024: 16.9,
    pourcentage2025: 17.8
  },
  {
    fournisseur: 'Exadis',
    ca2024: 490000,
    ca2025: 245000,
    pourcentageTotal: 7.8,
    progression: 22.1,
    pourcentage2024: 7.2,
    pourcentage2025: 7.6
  }
];

// Performance par famille de produits
export const famillesProduitsPerformance: FamilleProduitPerformance[] = [
  {
    sousFamille: 'FREINS',
    ca2024: 2100000,
    ca2025: 1050000,
    pourcentageTotal: 32.4,
    progression: 18.5
  },
  {
    sousFamille: 'FILTRES',
    ca2024: 1210000,
    ca2025: 605000,
    pourcentageTotal: 18.7,
    progression: 12.3
  },
  {
    sousFamille: 'MOTEUR',
    ca2024: 980000,
    ca2025: 490000,
    pourcentageTotal: 15.2,
    progression: 25.8
  },
  {
    sousFamille: 'ELECTRIQUE',
    ca2024: 750000,
    ca2025: 375000,
    pourcentageTotal: 11.6,
    progression: 8.9
  }
];

// TOP 10 et FLOP 10
export const top10Clients: TopFlopClient[] = [
  { raisonSociale: 'MAGASIN A', codeUnion: 'M0001', progression: 45.2, ca2024: 25000, ca2025: 12500 },
  { raisonSociale: 'MAGASIN B', codeUnion: 'M0003', progression: 38.7, ca2024: 22000, ca2025: 11000 },
  { raisonSociale: 'MAGASIN C', codeUnion: 'M0004', progression: 32.1, ca2024: 18000, ca2025: 9000 }
];

export const flop10Clients: TopFlopClient[] = [
  { raisonSociale: 'MAGASIN X', codeUnion: 'M0100', progression: -23.1, ca2024: 15000, ca2025: 7500 },
  { raisonSociale: 'MAGASIN Y', codeUnion: 'M0101', progression: -18.9, ca2024: 12000, ca2025: 6000 },
  { raisonSociale: 'MAGASIN Z', codeUnion: 'M0102', progression: -15.4, ca2024: 10000, ca2025: 5000 }
];
