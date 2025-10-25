// Configuration d'authentification locale (sans base de données)
// À utiliser uniquement en développement ou pour des démos
import { User } from '../types/user';

export interface LocalUser {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  roles: string[];
  equipe: string;
  plateformesAutorisees: string[];
  regionCommerciale: string;
  avatarUrl?: string;
}

// Utilisateurs locaux hardcodés
export const LOCAL_USERS: LocalUser[] = [
  {
    email: 'admin@union.com',
    password: 'admin',
    nom: 'Admin',
    prenom: 'Administrateur',
    roles: ['admin'],
    equipe: 'Direction',
    plateformesAutorisees: ['Toutes'],
    regionCommerciale: 'National',
    avatarUrl: undefined
  },
  {
    email: 'commercial@union.com',
    password: 'commercial',
    nom: 'Commercial',
    prenom: 'Agent',
    roles: ['commercial'],
    equipe: 'Commercial',
    plateformesAutorisees: ['ACR', 'DCA'],
    regionCommerciale: 'REGION PARISIENNE',
    avatarUrl: undefined
  },
  {
    email: 'viewer@union.com',
    password: 'viewer',
    nom: 'Viewer',
    prenom: 'Lecteur',
    roles: ['viewer'],
    equipe: 'Consultation',
    plateformesAutorisees: ['Toutes'],
    regionCommerciale: 'National',
    avatarUrl: undefined
  }
];

// Fonction pour authentifier un utilisateur local
export const authenticateLocalUser = (email: string, password: string): User | null => {
  const normalizedEmail = email.toLowerCase().trim();

  const localUser = LOCAL_USERS.find(
    u => u.email.toLowerCase() === normalizedEmail && u.password === password
  );

  if (!localUser) {
    return null;
  }

  // Générer un ID simple basé sur l'email
  const id = `local-${normalizedEmail.replace(/[^a-z0-9]/g, '-')}`;

  // Convertir LocalUser en User
  const user: User = {
    id,
    email: localUser.email,
    nom: localUser.nom,
    prenom: localUser.prenom,
    roles: localUser.roles,
    equipe: localUser.equipe,
    actif: true,
    avatarUrl: localUser.avatarUrl,
    dateCreation: new Date().toISOString(),
    derniereConnexion: new Date().toISOString(),
    plateformesAutorisees: localUser.plateformesAutorisees,
    regionCommerciale: localUser.regionCommerciale,
    isGoogleAuthenticated: false
  };

  return user;
};

// Fonction pour vérifier si on doit utiliser l'authentification locale
export const shouldUseLocalAuth = (): boolean => {
  // Utiliser l'authentification locale si :
  // 1. Variable d'environnement explicite
  // 2. Pas de connexion Supabase disponible
  // 3. Mode développement
  return (
    process.env.REACT_APP_USE_LOCAL_AUTH === 'true' ||
    process.env.NODE_ENV === 'development' ||
    !process.env.REACT_APP_SUPABASE_URL
  );
};
