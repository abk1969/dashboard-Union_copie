export interface AdherentData {
  raisonSociale: string;
  codeUnion: string;
  groupeClient: string;
  regionCommerciale?: string; // Région commerciale (REGION PARISIENNE, NORD, SUD, etc.)
  fournisseur: string;
  marque: string;
  famille: string; // Famille de produits (freinage, embrayage, etc.)
  sousFamille: string; // Sous-famille (plaquettes, disques, etc.)
  groupeFournisseur: string;
  annee: number;
  ca: number;
  platform?: string; // Plateforme : 'acr', 'dca', 'exadis', 'alliance'
}

export interface AdherentSummary {
  raisonSociale: string;
  codeUnion: string;
  groupeClient: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  statut: 'progression' | 'regression' | 'stable';
  classement2024?: number;
  classement2025?: number;
  evolutionClassement?: number;
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
  famille: string; // Famille principale (freinage, embrayage, etc.)
  ca2024: number;
  ca2025: number;
  pourcentageTotal: number;
  progression: number;
}

export interface SousFamilleProduitPerformance {
  sousFamille: string; // Sous-famille (plaquettes, disques, etc.)
  famille: string; // Famille parente
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
  regionCommerciale?: string;
  fournisseur?: string;
  marque?: string;
  famille?: string;
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

// Nouvelles interfaces pour la to-do list ludique
export interface TodoTask {
  id: string;
  clientCode: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'prospection' | 'suivi' | 'relance' | 'commercial' | 'admin' | 'other';
  assignedTo?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  tags?: string[];
  notes?: string;
  // Nouvelles propriétés pour les notes
  noteSimple?: string;
  noteIa?: string;
  typeNote?: 'TASK' | 'NOTE SIMPLE' | 'RAPPORT VISITE' | 'ACTION COMMERCIALE';
  auteur?: string;
  dateRappel?: string;
  plateforme?: string;
  regionCommerciale?: string;
}

export interface TodoList {
  tasks: TodoTask[];
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
}

export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
  byPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  byCategory: {
    prospection: number;
    suivi: number;
    relance: number;
    commercial: number;
    admin: number;
    other: number;
  };
}

export interface TaskAssignment {
  taskId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  assignedAt: string;
  status: 'assigned' | 'accepted' | 'declined' | 'completed';
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
}

// Google Calendar and Gmail Interfaces
export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  location?: string;
  description?: string;
  attendees?: string[];
  isAllDay?: boolean;
}

export interface GmailMessage {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  labels?: string[];
}

export interface MauriceData {
  upcomingMeetings: CalendarEvent[];
  importantEmails: GmailMessage[];
  clientAnalysis: any[];
  personalizedMessage: string;
  recommendations: string[];
  alerts: string[];
  priorities: string[];
}

// Interfaces pour les données clients étendues (Import Excel)
export interface ClientInfo {
  codeUnion: string;
  nomClient: string;
  groupe: string;
  contactMagasin: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  contactResponsablePDV?: string;
  mail: string;
  sirenSiret: string;
  agentUnion: string;
  mailAgent: string;
  // Coordonnées géographiques (calculées)
  latitude?: number;
  longitude?: number;
  // Métadonnées
  dateImport?: Date;
  statut?: 'actif' | 'inactif' | 'suspendu';
  notes?: string;
}

export interface CommercialUnion {
  nom: string;
  email: string;
  region: string;
  clients: string[]; // codes Union des clients
  caTotal: number;
  ca2024: number;
  ca2025: number;
  progression: number;
  nombreClients: number;
  statut: 'actif' | 'inactif';
  dateCreation: Date;
  derniereActivite?: Date;
}

export interface ClientLocation {
  codeUnion: string;
  nomClient: string;
  adresse: string;
  ville: string;
  codePostal: string;
  latitude: number;
  longitude: number;
  commercial: string;
  ca2025: number;
  groupe: string;
}

export interface CommercialStats {
  commercial: string;
  region: string;
  nombreClients: number;
  caTotal: number;
  ca2024: number;
  ca2025: number;
  progression: number;
  clients: {
    codeUnion: string;
    nomClient: string;
    ca2025: number;
    ville: string;
  }[];
  topClients: {
    codeUnion: string;
    nomClient: string;
    ca2025: number;
  }[];
}

export interface ExcelImportResult {
  success: boolean;
  clientsImported: number;
  clientsUpdated: number;
  errors: string[];
  warnings: string[];
  data: ClientInfo[];
  commercials: CommercialUnion[];
}

// Interface pour les performances commerciales (basée sur la vraie structure)
export interface CommercialPerformance {
  agentUnion: string; // Nom du commercial depuis clients.agent_union
  mailAgent: string; // Email du commercial depuis clients.mail_agent
  prenom: string; // Extrait du nom complet
  nom: string; // Extrait du nom complet
  email?: string; // Depuis la table users
  photo?: string; // Depuis la table user_photos
  ca2024: number;
  ca2025: number;
  progression: number;
  pourcentageTotal: number;
  clientsUniques: number;
  totalClients: number;
  famillesUniques: number;
  marquesUniques: number;
  fournisseursUniques: number;
  regionsUniques: number;
  moyenneCAparClient: number;
  topClient: {
    codeUnion: string;
    raisonSociale: string;
    ca: number;
  };
  topFamille: {
    famille: string;
    ca: number;
  };
  topMarque: {
    marque: string;
    ca: number;
  };
  topFournisseur: {
    fournisseur: string;
    ca: number;
  };
  evolutionMensuelle: {
    mois: string;
    ca2024: number;
    ca2025: number;
  }[];
  // Nouvelles données détaillées pour les modals
  clients: {
    codeUnion: string;
    raisonSociale: string;
    groupeClient: string;
    regionCommerciale?: string;
    ca2024: number;
    ca2025: number;
    progression: number;
    pourcentageTotal: number;
    derniereActivite: string;
  }[];
  familles: {
    famille: string;
    ca2024: number;
    ca2025: number;
    progression: number;
    pourcentageTotal: number;
    clients: number;
  }[];
  marques: {
    marque: string;
    fournisseur: string;
    ca2024: number;
    ca2025: number;
    progression: number;
    pourcentageTotal: number;
    clients: number;
  }[];
  fournisseurs: {
    fournisseur: string;
    ca2024: number;
    ca2025: number;
    progression: number;
    pourcentageTotal: number;
    clients: number;
  }[];
  regions: {
    region: string;
    ca2024: number;
    ca2025: number;
    progression: number;
    pourcentageTotal: number;
    clients: number;
  }[];
}

// Interface pour les détails d'un commercial
export interface CommercialDetail {
  commercial: string;
  prenom: string;
  nom: string;
  email?: string;
  photo?: string;
  clients: {
    codeUnion: string;
    raisonSociale: string;
    groupeClient: string;
    regionCommerciale?: string;
    ca2024: number;
    ca2025: number;
    progression: number;
    pourcentageTotal: number;
    derniereActivite: string;
  }[];
  familles: {
    famille: string;
    ca2024: number;
    ca2025: number;
    progression: number;
    pourcentageTotal: number;
    clients: number;
  }[];
  marques: {
    marque: string;
    fournisseur: string;
    ca2024: number;
    ca2025: number;
    progression: number;
    pourcentageTotal: number;
    clients: number;
  }[];
  fournisseurs: {
    fournisseur: string;
    ca2024: number;
    ca2025: number;
    progression: number;
    pourcentageTotal: number;
    clients: number;
  }[];
  regions: {
    region: string;
    ca2024: number;
    ca2025: number;
    progression: number;
    pourcentageTotal: number;
    clients: number;
  }[];
  totalCA2024: number;
  totalCA2025: number;
  progressionGenerale: number;
  clientsUniques: number;
}
