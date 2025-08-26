import { RfaConfiguration, RfaContratStandard, RfaTripartite, RfaSeuil, TripartiteMapping } from '../types';

// Configuration RFA par défaut basée sur les contrats fournis
export const defaultRfaConfiguration: RfaConfiguration = {
  contratsStandard: [
    {
      id: 'contrat-standard-2024',
      nom: 'Contrat Standard 2024',
      description: 'Contrat RFA standard avec seuils progressifs et bonus groupement',
      actif: true,
      seuils: [
        { min: 20000, max: 50000, pourcentageRfa: 1.0, pourcentageBonus: 0.5 },
        { min: 50000, max: 75000, pourcentageRfa: 1.5, pourcentageBonus: 1.0 },
        { min: 75000, max: 100000, pourcentageRfa: 2.0, pourcentageBonus: 1.5 },
        { min: 100000, max: 150000, pourcentageRfa: 2.5, pourcentageBonus: 2.0 },
        { min: 150000, max: 200000, pourcentageRfa: 3.0, pourcentageBonus: 2.5 },
        { min: 200000, max: null, pourcentageRfa: 3.5, pourcentageBonus: 3.0 }
      ]
    }
  ],
  tripartites: [
    // ALLIANCE
    { fournisseur: 'Alliance', marque: 'SCHAEFFLER', seuilMin: 20000, pourcentage: 2.0, actif: true },
    { fournisseur: 'Alliance', marque: 'DELPHI', seuilMin: 20000, pourcentage: 2.0, actif: true },
    { fournisseur: 'Alliance', marque: 'BREMBO', seuilMin: 20000, pourcentage: 2.0, actif: true },
    { fournisseur: 'Alliance', marque: 'SOGEFI', seuilMin: 20000, pourcentage: 2.0, actif: true },
    
    // DCA
    { fournisseur: 'DCA', marque: 'SBS', seuilMin: 25000, pourcentage: 3.0, actif: true },
    
    // EXADIS
    { fournisseur: 'Exadis', famille: 'freinage', seuilMin: 25000, pourcentage: 2.0, actif: true },
    { fournisseur: 'Exadis', famille: 'embrayage', seuilMin: 25000, pourcentage: 3.0, actif: true },
    { fournisseur: 'Exadis', famille: 'filtre', seuilMin: 25000, pourcentage: 2.0, actif: true },
    { fournisseur: 'Exadis', famille: 'distribution', seuilMin: 25000, pourcentage: 2.0, actif: true },
    { fournisseur: 'Exadis', famille: 'etancheite moteur', seuilMin: 5000, pourcentage: 2.0, actif: true },
    { fournisseur: 'Exadis', famille: 'thermique', seuilMin: 5000, pourcentage: 1.5, actif: true },
    
    // ACR
    { fournisseur: 'ACR', famille: 'freinage', seuilMin: 25000, pourcentage: 2.0, actif: true },
    { fournisseur: 'ACR', famille: 'embrayage', seuilMin: 25000, pourcentage: 3.0, actif: true },
    { fournisseur: 'ACR', famille: 'filtre', seuilMin: 25000, pourcentage: 1.5, actif: true },
    { fournisseur: 'ACR', famille: 'distribution', seuilMin: 25000, pourcentage: 1.5, actif: true }
  ]
};

// Configuration TRIPARTITE avec mapping des colonnes d'import
export const defaultTripartiteMapping: TripartiteMapping[] = [
  // ALLIANCE - Colonnes spécifiques pour chaque marque
  { fournisseur: 'Alliance', marque: 'SCHAEFFLER', colonne: 7, valeur: 'SCHAEFFLER', seuilMin: 20000, pourcentage: 2.0, actif: true },
  { fournisseur: 'Alliance', marque: 'DELPHI', colonne: 8, valeur: 'DELPHI', seuilMin: 20000, pourcentage: 2.0, actif: true },
  { fournisseur: 'Alliance', marque: 'SOGEFI', colonne: 7, valeur: 'SOGEFI', seuilMin: 20000, pourcentage: 2.0, actif: true },
  { fournisseur: 'Alliance', marque: 'BREMBO', colonne: 9, valeur: 'BREMBO', seuilMin: 20000, pourcentage: 2.0, actif: true },
  
  // DCA
  { fournisseur: 'DCA', marque: 'SBS', colonne: 6, valeur: 'SBS', seuilMin: 25000, pourcentage: 3.0, actif: true },
  
  // EXADIS - Colonnes pour familles de produits
  { fournisseur: 'Exadis', famille: 'freinage', colonne: 10, valeur: 'freinage', seuilMin: 25000, pourcentage: 2.0, actif: true },
  { fournisseur: 'Exadis', famille: 'embrayage', colonne: 11, valeur: 'embrayage', seuilMin: 25000, pourcentage: 3.0, actif: true },
  { fournisseur: 'Exadis', famille: 'filtre', colonne: 12, valeur: 'filtre', seuilMin: 25000, pourcentage: 2.0, actif: true },
  { fournisseur: 'Exadis', famille: 'distribution', colonne: 13, valeur: 'distribution', seuilMin: 25000, pourcentage: 2.0, actif: true },
  { fournisseur: 'Exadis', famille: 'etancheite moteur', colonne: 14, valeur: 'etancheite moteur', seuilMin: 5000, pourcentage: 2.0, actif: true },
  { fournisseur: 'Exadis', famille: 'thermique', colonne: 15, valeur: 'thermique', seuilMin: 5000, pourcentage: 1.5, actif: true },
  
  // ACR - Colonnes pour familles de produits
  { fournisseur: 'ACR', famille: 'freinage', colonne: 16, valeur: 'freinage', seuilMin: 25000, pourcentage: 2.0, actif: true },
  { fournisseur: 'ACR', famille: 'embrayage', colonne: 17, valeur: 'embrayage', seuilMin: 25000, pourcentage: 3.0, actif: true },
  { fournisseur: 'ACR', famille: 'filtre', colonne: 18, valeur: 'filtre', seuilMin: 25000, pourcentage: 1.5, actif: true },
  { fournisseur: 'ACR', famille: 'distribution', colonne: 19, valeur: 'distribution', seuilMin: 25000, pourcentage: 1.5, actif: true }
];

// Mapping des familles de produits vers les sous-familles de vos données
export const familleMapping: Record<string, string[]> = {
  'freinage': ['DISQUES DE FREIN AVEC RLTS', 'DISQUES DE FREIN SANS RLTS', 'KITS DE FREIN VL', 'PLAQUETTES DE FREIN VL'],
  'embrayage': ['EMBRAYAGES', 'KITS EMBRAYAGE'],
  'filtre': ['FILTRES A AIR VL', 'FILTRES D\'HABITACLE VL', 'FILTRES GO VL', 'FILTRES HUILE VL ET MOTO'],
  'distribution': ['CHAINES DE DISTRIBUTION', 'TENDERS DE CHAINE', 'GUIDES CHAINE'],
  'etancheite moteur': ['JOINTS', 'JOINTS CULASSE', 'JOINTS VILBREQUIN'],
  'thermique': ['THERMOSTATS', 'RADIATEURS', 'VENTILATEURS']
};

// Fonction utilitaire pour déterminer la famille d'un produit
export function getFamilleFromSousFamille(sousFamille: string): string | null {
  for (const [famille, sousFamilles] of Object.entries(familleMapping)) {
    if (sousFamilles.some(sf => sousFamille.toLowerCase().includes(sf.toLowerCase()))) {
      return famille;
    }
  }
  return null;
}

// Fonction utilitaire pour calculer le RFA standard
export function calculerRfaStandard(ca: number, seuils: RfaSeuil[]): {
  palier: RfaSeuil;
  montantRfa: number;
  montantBonus: number;
  progressionVersPalierSuivant: number;
} | null {
  // Trier les seuils par ordre croissant pour s'assurer de la logique
  const seuilsTries = [...seuils].sort((a, b) => a.min - b.min);
  
  // Trouver le palier approprié
  let palier: RfaSeuil | undefined;
  
  for (let i = 0; i < seuilsTries.length; i++) {
    const seuil = seuilsTries[i];
    const seuilSuivant = seuilsTries[i + 1];
    
    if (ca >= seuil.min && (seuilSuivant ? ca < seuilSuivant.min : true)) {
      palier = seuil;
      break;
    }
  }
  
  if (!palier) return null;
  
  const montantRfa = (ca * palier.pourcentageRfa) / 100;
  const montantBonus = (ca * palier.pourcentageBonus) / 100;
  
  // Calculer la progression vers le palier suivant
  let progressionVersPalierSuivant = 0;
  const indexPalier = seuilsTries.findIndex(s => s === palier);
  const palierSuivant = seuilsTries[indexPalier + 1];
  
  if (palierSuivant) {
    progressionVersPalierSuivant = ((ca - palier.min) / (palierSuivant.min - palier.min)) * 100;
  } else {
    progressionVersPalierSuivant = 100; // Palier maximum atteint
  }
  
  return {
    palier,
    montantRfa,
    montantBonus,
    progressionVersPalierSuivant
  };
}

// Fonction utilitaire pour calculer le RFA TRIPARTITE
export function calculerRfaTripartite(
  ca: number, 
  tripartites: RfaTripartite[], 
  fournisseur: string, 
  marque?: string, 
  famille?: string
): {
  palier: RfaTripartite;
  montantRfa: number;
  progressionVersPalierSuivant: number;
} | null {
  const tripartite = tripartites.find(t => 
    t.fournisseur === fournisseur &&
    t.actif &&
    ((marque && t.marque === marque) || (famille && t.famille === famille)) &&
    ca >= t.seuilMin
  );
  
  if (!tripartite) return null;
  
  const montantRfa = (ca * tripartite.pourcentage) / 100;
  const progressionVersPalierSuivant = 100; // TRIPARTITE n'a qu'un seuil
  
  return {
    palier: tripartite,
    montantRfa,
    progressionVersPalierSuivant
  };
}

// Fonction utilitaire pour calculer le RFA TRIPARTITE basée sur les colonnes d'import
export function calculerRfaTripartiteParColonne(
  adherentsData: any[],
  codeUnion: string,
  fournisseur: string,
  tripartiteMapping: TripartiteMapping[],
  annee: number = 2025
): {
  palier: TripartiteMapping;
  montantRfa: number;
  progressionVersPalierSuivant: number;
} | null {
  // Trouver le mapping TRIPARTITE pour ce fournisseur
  const mapping = tripartiteMapping.find(t => 
    t.fournisseur === fournisseur && 
    t.actif
  );

  if (!mapping) return null;

  // Calculer CA basé sur la colonne spécifiée
  let caTotal = 0;
  
  adherentsData.forEach(adherent => {
    if (adherent.codeUnion === codeUnion && 
        adherent.fournisseur === fournisseur && 
        adherent.annee === annee) {
      
      // Utiliser la colonne spécifiée dans le mapping
      const colonneKey = `colonne${mapping.colonne}`;
      if (adherent[colonneKey] === mapping.valeur) {
        caTotal += adherent.ca;
      }
    }
  });

  // Vérifier si le seuil minimum est atteint
  if (caTotal < mapping.seuilMin) return null;

  const montantRfa = (caTotal * mapping.pourcentage) / 100;
  const progressionVersPalierSuivant = 100; // TRIPARTITE n'a qu'un seuil

  return {
    palier: mapping,
    montantRfa,
    progressionVersPalierSuivant
  };
}
