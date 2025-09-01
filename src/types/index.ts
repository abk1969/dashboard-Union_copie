export interface AdherentData {
  raisonSociale: string;
  codeUnion: string;
  groupeClient: string;
  fournisseur: string;
  marque: string;
  sousFamille: string;
  groupeFournisseur: string;
  annee: number;
  ca: number;
}

export interface AdherentSummary {
  raisonSociale: string;
  codeUnion: string;
  groupeClient: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  statut: 'progression' | 'regression' | 'stable';
}

export interface FournisseurPerformance {
  fournisseur: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  pourcentageTotal: number;
  pourcentage2024: number;
  pourcentage2025: number;
}

export interface FamilleProduitPerformance {
  sousFamille: string;
  ca2024: number;
  ca2025: number;
  pourcentageTotal: number;
  progression: number;
}

export interface TopFlopClient {
  raisonSociale: string;
  codeUnion: string;
  progression: number;
  ca2024: number;
  ca2025: number;
}

export interface Filtres {
  groupeClient?: string;
  fournisseur?: string;
  marque?: string;
  sousFamille?: string;
  annee?: number;
}

export interface RfaConfig {
  codeUnion: string;
  fournisseur: string;
  palier1: number;
  palier2: number;
  palier3: number;
  taux1: number;
  taux2: number;
  taux3: number;
}

export interface ClientPerformanceData {
  fournisseur: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  pourcentageTotal: number;
  pourcentage2024: number;
  pourcentage2025: number;
}

// RFA System Interfaces
export interface RfaSeuil {
  min: number;
  max: number | null; // null for "et +"
  pourcentageRfa: number;
  pourcentageBonus: number;
}

export interface RfaContratStandard {
  id: string;
  nom: string;
  description: string;
  seuils: RfaSeuil[];
  actif: boolean;
}

export interface RfaTripartite {
  fournisseur: string;
  marque?: string; // Pour ALLIANCE (Schaeffler, Delphi, etc.)
  famille?: string; // Pour EXADIS et ACR (freinage, embrayage, etc.)
  seuilMin: number;
  pourcentage: number;
  actif: boolean;
}

// Document Management Interfaces
export interface Document {
  id: number;
  codeUnion: string;
  typeDocument: 'RIB' | 'KBIS' | 'PIECES_IDENTITE' | 'CONTRAT_UNION' | 'PHOTO_ENSEIGNE' | 'PHOTO_COMPTOIR';
  urlDrive: string;
  nomFichier: string;
  dateUpload: Date;
  statut: 'actif' | 'archive' | 'supprime';
  notes?: string;
  createdAt: Date;
}

export interface DocumentType {
  type: 'RIB' | 'KBIS' | 'PIECES_IDENTITE' | 'CONTRAT_UNION' | 'PHOTO_ENSEIGNE' | 'PHOTO_COMPTOIR';
  label: string;
  description: string;
  icon: string;
  color: string;
  required: boolean;
}

export interface TripartiteMapping {
  fournisseur: string;
  marque?: string;        // Pour ALLIANCE, DCA
  famille?: string;       // Pour EXADIS, ACR
  colonne: number;        // Colonne d'import (7, 8, 9, etc.)
  valeur: string;         // Valeur exacte à chercher dans la colonne
  seuilMin: number;
  pourcentage: number;
  actif: boolean;
}

export interface RfaConfiguration {
  contratsStandard: RfaContratStandard[];
  tripartites: RfaTripartite[];
}

export interface ClientRfaAffectation {
  codeUnion: string;
  contratStandard: string; // ID du contrat standard
  tripartites: {
    fournisseur: string;
    marque?: string;
    famille?: string;
    actif: boolean;
  }[];
}

export interface RfaCalcul {
  fournisseur: string;
  caTotal: number;
  contratApplique: 'standard' | 'tripartite';
  rfaStandard?: {
    palier: RfaSeuil;
    montantRfa: number;
    montantBonus: number;
    progressionVersPalierSuivant: number;
  };
  rfaTripartite?: {
    palier: RfaTripartite;
    montantRfa: number;
    progressionVersPalierSuivant: number;
  };
  montantTotalRfa: number;
}

export interface ClientRfaResume {
  codeUnion: string;
  contratStandard: string;
  rfaTotal: number;
  bonusTotal: number;
  tripartites: RfaCalcul[];
  progressionGlobale: number;
}

// Notes et To-Do Lists Interfaces
export interface NoteClient {
  idNote: string;
  codeUnion: string;
  typeNote: 'TO DO' | 'NOTE SIMPLE';
  noteSimple?: string;
  noteIa?: string;
  dateCreation: Date;
  auteur: string;
  traite: boolean;
  assigneA?: string;
  personneAPrevenir?: string;
  dateRappel?: Date;
  statutTache: 'TERMINEE' | 'EN COURS' | 'EN RETARD';
  tache?: string;
  priorite: 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';
  tags?: string[];
  createdAt: Date;
}

export interface Utilisateur {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: 'admin' | 'commercial' | 'manager';
  equipe?: string;
  actif: boolean;
  avatarUrl?: string;
  dateCreation: Date;
  derniereConnexion?: Date;
}

export interface TodoItem {
  id: string;
  titre: string;
  description?: string;
  assigneA: string;
  createur: string;
  priorite: 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';
  statut: 'A FAIRE' | 'EN COURS' | 'TERMINEE' | 'EN RETARD';
  dateCreation: Date;
  dateEcheance?: Date;
  dateTerminaison?: Date;
  tags?: string[];
  notes?: string;
}

export interface NoteFilter {
  codeUnion?: string;
  typeNote?: 'TO DO' | 'NOTE SIMPLE' | 'TOUS';
  statut?: 'TERMINEE' | 'EN COURS' | 'EN RETARD' | 'TOUS';
  priorite?: 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE' | 'TOUS';
  auteur?: string;
  assigneA?: string;
  dateDebut?: Date;
  dateFin?: Date;
}
