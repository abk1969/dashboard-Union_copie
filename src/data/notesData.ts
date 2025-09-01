import { NoteClient, TodoItem, Utilisateur } from '../types';

// Données fictives des utilisateurs
export const utilisateursFictifs: Utilisateur[] = [
  {
    id: 1,
    email: 'martial@groupementunion.pro',
    nom: 'Martial',
    prenom: 'Dupont',
    role: 'admin',
    equipe: 'Direction',
    actif: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Martial+Dupont&background=0D9488&color=fff',
    dateCreation: new Date('2024-01-01'),
    derniereConnexion: new Date()
  },
  {
    id: 2,
    email: 'vanessa@groupementunion.pro',
    nom: 'Vanessa',
    prenom: 'Martin',
    role: 'commercial',
    equipe: 'Commercial',
    actif: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Vanessa+Martin&background=7C3AED&color=fff',
    dateCreation: new Date('2024-01-01'),
    derniereConnexion: new Date()
  },
  {
    id: 3,
    email: 'mourad@groupementunion.pro',
    nom: 'Mourad',
    prenom: 'Benali',
    role: 'commercial',
    equipe: 'Commercial',
    actif: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Mourad+Benali&background=DC2626&color=fff',
    dateCreation: new Date('2024-01-01'),
    derniereConnexion: new Date()
  },
  {
    id: 4,
    email: 'mohamed@groupementunion.pro',
    nom: 'Mohamed',
    prenom: 'Tazi',
    role: 'manager',
    equipe: 'Commercial',
    actif: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Mohamed+Tazi&background=059669&color=fff',
    dateCreation: new Date('2024-01-01'),
    derniereConnexion: new Date()
  }
];

// Données fictives des notes clients (basées sur votre Google Sheets)
export const notesClientsFictives: NoteClient[] = [
  {
    idNote: 'afbf2d88',
    codeUnion: 'M0011',
    typeNote: 'TO DO',
    noteSimple: '',
    noteIa: '',
    dateCreation: new Date('2025-01-20T03:56:23'),
    auteur: 'martial@groupementunion.pro',
    traite: false,
    assigneA: 'MOURAD',
    personneAPrevenir: 'MOURAD',
    dateRappel: new Date('2025-01-22'),
    statutTache: 'TERMINEE',
    tache: 'Faire un retour a Salimou du rendez vous avec Emeric et faire le point avec lui',
    priorite: 'NORMALE',
    tags: ['rendez-vous', 'suivi'],
    createdAt: new Date('2025-01-20T03:56:23')
  },
  {
    idNote: 'e741def0',
    codeUnion: 'M0062',
    typeNote: 'NOTE SIMPLE',
    noteSimple: 'Deux magasin. Oise Pieces Auto a Crépy En Valois',
    noteIa: 'Il existe deux magasins d\'intérêt dans la région. Le premier est le magasin "Oise Pièces Auto", situé à Crépy En Valois. Malheureusement, des informations supplémentaires concernant le deuxième magasin n\'ont pas été fournies. Pour obtenir plus d\'informations, une recherche supplémentaire ou des précisions peuvent être requises.',
    dateCreation: new Date('2025-01-20T10:43:57'),
    auteur: 'vanessa@groupementunion.pro',
    traite: true,
    assigneA: undefined,
    personneAPrevenir: undefined,
    dateRappel: new Date('2025-01-20'),
    statutTache: 'EN COURS',
    tache: undefined,
    priorite: 'NORMALE',
    tags: ['nouveau client', 'région'],
    createdAt: new Date('2025-01-20T10:43:57')
  },
  {
    idNote: 'c0ebfb7e',
    codeUnion: 'M0049',
    typeNote: 'NOTE SIMPLE',
    noteSimple: 'Laisser message ce jour concernant la signature du contrat 2025. RDV PRIS',
    noteIa: 'Aujourd\'hui, un message a été laissé concernant la signature du contrat pour l\'année 2025.',
    dateCreation: new Date('2025-01-20T11:11:32'),
    auteur: 'vanessa@groupementunion.pro',
    traite: true,
    assigneA: 'VANESSA',
    personneAPrevenir: 'VANESSA',
    dateRappel: new Date('2025-01-20'),
    statutTache: 'EN COURS',
    tache: undefined,
    priorite: 'HAUTE',
    tags: ['contrat', 'signature'],
    createdAt: new Date('2025-01-20T11:11:32')
  },
  {
    idNote: 'df19fbe8',
    codeUnion: 'M0049',
    typeNote: 'TO DO',
    noteSimple: '',
    noteIa: '',
    dateCreation: new Date('2025-01-20T11:13:00'),
    auteur: 'vanessa@groupementunion.pro',
    traite: false,
    assigneA: 'VANESSA',
    personneAPrevenir: 'VANESSA',
    dateRappel: new Date('2025-01-23'),
    statutTache: 'TERMINEE',
    tache: 'A relancer Contrat 2025 RDV Aulnay',
    priorite: 'HAUTE',
    tags: ['contrat', 'relance'],
    createdAt: new Date('2025-01-20T11:13:00')
  },
  {
    idNote: '593caff0',
    codeUnion: 'M0214',
    typeNote: 'TO DO',
    noteSimple: '',
    noteIa: '',
    dateCreation: new Date('2025-01-20T14:58:32'),
    auteur: 'vanessa@groupementunion.pro',
    traite: false,
    assigneA: undefined,
    personneAPrevenir: undefined,
    dateRappel: new Date('2025-01-20'),
    statutTache: 'TERMINEE',
    tache: 'Ouverture chez ACR A la demande d\'Halim (jumbo)',
    priorite: 'NORMALE',
    tags: ['ouverture', 'ACR'],
    createdAt: new Date('2025-01-20T14:58:32')
  },
  {
    idNote: '2fc060da',
    codeUnion: 'M000109',
    typeNote: 'TO DO',
    noteSimple: '',
    noteIa: '',
    dateCreation: new Date('2025-01-20T19:26:53'),
    auteur: 'martial@groupementunion.pro',
    traite: false,
    assigneA: 'VANESSA',
    personneAPrevenir: 'VANESSA',
    dateRappel: new Date('2025-01-21'),
    statutTache: 'TERMINEE',
    tache: 'CECI EST UNE TACHE TEST',
    priorite: 'BASSE',
    tags: ['test'],
    createdAt: new Date('2025-01-20T19:26:53')
  },
  {
    idNote: '488ff800',
    codeUnion: 'M0204',
    typeNote: 'TO DO',
    noteSimple: '',
    noteIa: '',
    dateCreation: new Date('2025-01-21T14:38:15'),
    auteur: 'martial@groupementunion.pro',
    traite: false,
    assigneA: 'MOURAD',
    personneAPrevenir: 'MOURAD',
    dateRappel: new Date('2025-01-24'),
    statutTache: 'TERMINEE',
    tache: 'PBM EXADIS TRANSPORT A REGLER BTS',
    priorite: 'URGENTE',
    tags: ['problème', 'transport', 'EXADIS'],
    createdAt: new Date('2025-01-21T14:38:15')
  },
  {
    idNote: 'b2d27a19',
    codeUnion: 'M0204',
    typeNote: 'NOTE SIMPLE',
    noteSimple: 'Point avec Laura concernant la plateforme EXADIS. Problème sur les livraison de ces commande. Point fait ce jour avec Imen et Alain Derail pour trouver une solution.',
    noteIa: 'J\'ai eu un point de discussion avec Laura concernant la plateforme EXADIS. Nous avons identifié un problème concernant les livraisons de ses commandes. Pour résoudre cet enjeu, une réunion a été organisée aujourd\'hui avec Imen et Alain Derail. Nous avons collaboré pour trouver une solution à cette problématique.',
    dateCreation: new Date('2025-01-22T17:14:45'),
    auteur: 'VANESSA@groupementunion.pro',
    traite: true,
    assigneA: 'MOHAMED',
    personneAPrevenir: 'MOHAMED',
    dateRappel: new Date('2025-01-22'),
    statutTache: 'EN COURS',
    tache: undefined,
    priorite: 'HAUTE',
    tags: ['problème', 'EXADIS', 'livraison'],
    createdAt: new Date('2025-01-22T17:14:45')
  },
  {
    idNote: 'ddc7e669',
    codeUnion: 'M0120',
    typeNote: 'TO DO',
    noteSimple: '',
    noteIa: '',
    dateCreation: new Date('2025-01-23T08:27:27'),
    auteur: 'VANESSA@groupementunion.pro',
    traite: false,
    assigneA: 'VANESSA',
    personneAPrevenir: 'VANESSA',
    dateRappel: new Date('2025-01-23'),
    statutTache: 'TERMINEE',
    tache: 'Signature contrat Union 2025',
    priorite: 'HAUTE',
    tags: ['contrat', 'signature'],
    createdAt: new Date('2025-01-23T08:27:27')
  },
  {
    idNote: 'ddcfaeb8',
    codeUnion: 'M0012',
    typeNote: 'NOTE SIMPLE',
    noteSimple: 'Partenaire qui on contacter le magasin : - Total n\'a pas contacter evo - Torus : en attente de la grille tarifaire - Warm\'up : Test en cours dans son magasin Reflexe carte Grise : Pas encore contacté',
    noteIa: 'Le statut de nos partenariats est actuellement le suivant : En ce qui concerne Total, il n\'y a eu aucun contact avec Evo jusqu\'à présent. Pour le moment, nous attendons la grille tarifaire de la part de Torus. Concernant Warm\'up, des tests sont actuellement en cours dans son magasin. Quant à Reflexe Carte Grise, il n\'a pas encore été contacté.',
    dateCreation: new Date('2025-01-09T10:04:11'),
    auteur: 'VANESSA@groupementunion.pro',
    traite: true,
    assigneA: 'MOHAMED',
    personneAPrevenir: 'MOHAMED',
    dateRappel: new Date('2025-01-23'),
    statutTache: 'EN COURS',
    tache: undefined,
    priorite: 'NORMALE',
    tags: ['partenariats', 'suivi'],
    createdAt: new Date('2025-01-09T10:04:11')
  }
];

// Données fictives des to-do lists
export const todoItemsFictifs: TodoItem[] = [
  {
    id: 'todo-001',
    titre: 'Relance contrat M0049',
    description: 'Relancer le client M0049 pour la signature du contrat 2025',
    assigneA: 'Vanessa',
    createur: 'Martial',
    priorite: 'HAUTE',
    statut: 'EN COURS',
    dateCreation: new Date('2025-01-20'),
    dateEcheance: new Date('2025-01-25'),
    tags: ['contrat', 'relance'],
    notes: 'Client en attente de validation'
  },
  {
    id: 'todo-002',
    titre: 'Résolution problème EXADIS',
    description: 'Trouver une solution pour les problèmes de livraison EXADIS',
    assigneA: 'Mohamed',
    createur: 'Vanessa',
    priorite: 'URGENTE',
    statut: 'EN COURS',
    dateCreation: new Date('2025-01-22'),
    dateEcheance: new Date('2025-01-24'),
    tags: ['problème', 'EXADIS'],
    notes: 'Réunion prévue avec l\'équipe technique'
  },
  {
    id: 'todo-003',
    titre: 'Suivi partenariats M0012',
    description: 'Faire le point sur les partenariats avec Total, Torus, Warm\'up',
    assigneA: 'Mohamed',
    createur: 'Vanessa',
    priorite: 'NORMALE',
    statut: 'A FAIRE',
    dateCreation: new Date('2025-01-09'),
    dateEcheance: new Date('2025-01-30'),
    tags: ['partenariats', 'suivi'],
    notes: 'En attente de retours des partenaires'
  }
];

// Fonctions utilitaires
export const getUtilisateurByEmail = (email: string): Utilisateur | undefined => {
  return utilisateursFictifs.find(user => user.email.toLowerCase() === email.toLowerCase());
};

export const getUtilisateurById = (id: number): Utilisateur | undefined => {
  return utilisateursFictifs.find(user => user.id === id);
};

export const getNotesByCodeUnion = (codeUnion: string): NoteClient[] => {
  return notesClientsFictives.filter(note => note.codeUnion === codeUnion);
};

export const getNotesByAuteur = (email: string): NoteClient[] => {
  return notesClientsFictives.filter(note => note.auteur.toLowerCase() === email.toLowerCase());
};

export const getNotesByAssignee = (email: string): NoteClient[] => {
  return notesClientsFictives.filter(note => 
    note.assigneA && note.assigneA.toLowerCase() === email.toLowerCase()
  );
};

export const getTodosByAssignee = (nom: string): TodoItem[] => {
  return todoItemsFictifs.filter(todo => 
    todo.assigneA.toLowerCase() === nom.toLowerCase()
  );
};
