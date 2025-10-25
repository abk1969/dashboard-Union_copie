// Système d'authentification simple avec email/mot de passe
import { supabase } from './supabase';
import { User } from '../types/user';
import { generateUUIDFromEmail } from '../utils/uuidGenerator';
import { authenticateLocalUser, shouldUseLocalAuth } from './local-auth';

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: User;
  sessionToken?: string;
}

// Fonction pour se connecter
export const simpleLogin = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    // Vérifier si on doit utiliser l'authentification locale
    if (shouldUseLocalAuth()) {
      console.log('🔐 Utilisation de l\'authentification locale');
      const localUser = authenticateLocalUser(email, password);

      if (localUser) {
        // Créer un token de session simple
        const sessionToken = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('sessionToken', sessionToken);

        return {
          success: true,
          message: 'Connexion réussie (mode local)',
          user: localUser,
          sessionToken: sessionToken
        };
      } else {
        return {
          success: false,
          message: 'Email ou mot de passe incorrect'
        };
      }
    }

    // Connexion avec Supabase (si disponible)
    console.log('🔐 Tentative de connexion avec Supabase');
    const normalizedEmail = email.toLowerCase().trim();

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('mot_de_passe', password)
      .eq('actif', true)
      .single();

    if (error) {
      console.error('Erreur Supabase, basculement vers authentification locale:', error);
      // Fallback vers authentification locale en cas d'erreur Supabase
      const localUser = authenticateLocalUser(email, password);

      if (localUser) {
        const sessionToken = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('sessionToken', sessionToken);

        return {
          success: true,
          message: 'Connexion réussie (mode local - fallback)',
          user: localUser,
          sessionToken: sessionToken
        };
      }

      return {
        success: false,
        message: 'Email ou mot de passe incorrect'
      };
    }

    if (data) {
      // Créer un token de session simple
      const sessionToken = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('sessionToken', sessionToken);

      // Convertir les données Supabase vers notre interface User
      const user: User = {
        id: generateUUIDFromEmail(data.email),
        email: data.email,
        nom: data.nom,
        prenom: data.prenom,
        roles: data.roles || [],
        equipe: data.equipe || '',
        actif: data.actif,
        avatarUrl: data.avatar_url,
        dateCreation: data.date_creation,
        derniereConnexion: data.derniere_connexion,
        plateformesAutorisees: data.plateformes_autorisees || [],
        regionCommerciale: data.region_commerciale || '',
        isGoogleAuthenticated: false
      };

      // Mettre à jour la dernière connexion (sans bloquer si erreur)
      try {
        await supabase
          .from('users')
          .update({ derniere_connexion: new Date().toISOString() })
          .eq('id', data.id);
      } catch (updateError) {
        console.warn('Impossible de mettre à jour la dernière connexion:', updateError);
      }

      return {
        success: true,
        message: 'Connexion réussie',
        user: user,
        sessionToken: sessionToken
      };
    }

    return {
      success: false,
      message: 'Erreur de connexion'
    };
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return {
      success: false,
      message: 'Erreur de connexion'
    };
  }
};

// Fonction pour valider une session
export const validateSession = async (): Promise<{ user: User | null; error: string | null }> => {
  try {
    const sessionToken = localStorage.getItem('sessionToken');
    
    if (!sessionToken) {
      return { user: null, error: 'Aucune session trouvée' };
    }

    // Pour l'authentification simple, on utilise juste le localStorage
    // En production, on aurait un système de tokens avec expiration côté serveur
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        return { user, error: null };
      } catch (error) {
        console.error('Erreur lors du parsing des données utilisateur:', error);
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('currentUser');
        return { user: null, error: 'Données utilisateur corrompues' };
      }
    }

    // Pas de session valide
    localStorage.removeItem('sessionToken');
    return { user: null, error: 'Session expirée' };
  } catch (error) {
    console.error('Erreur lors de la validation de session:', error);
    localStorage.removeItem('sessionToken');
    return { user: null, error: 'Erreur de validation' };
  }
};

// Fonction pour se déconnecter
export const simpleLogout = async (): Promise<void> => {
  try {
    const sessionToken = localStorage.getItem('sessionToken');
    
    if (sessionToken) {
      await supabase.rpc('logout_user', {
        session_token_param: sessionToken
      });
    }
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  } finally {
    // Toujours nettoyer localement
    localStorage.removeItem('sessionToken');
  }
};

// Fonction pour créer un utilisateur avec mot de passe (pour les admins)
export const createUserWithPassword = async (userData: {
  email: string;
  nom: string;
  prenom: string;
  roles: string[];
  equipe: string;
  plateformesAutorisees: string[];
  regionCommerciale: string;
  motDePasse: string;
}): Promise<{ success: boolean; error?: string; user?: any }> => {
  try {
    // Normaliser l'email en minuscules pour éviter les problèmes de casse
    const normalizedEmail = userData.email.toLowerCase().trim();
    
    const { data, error } = await supabase
      .from('users')
      .insert([{
        email: normalizedEmail,
        nom: userData.nom,
        prenom: userData.prenom,
        roles: userData.roles,
        equipe: userData.equipe,
        actif: true,
        date_creation: new Date().toISOString(),
        derniere_connexion: new Date().toISOString(),
        plateformes_autorisees: userData.plateformesAutorisees,
        region_commerciale: userData.regionCommerciale,
        mot_de_passe: userData.motDePasse // En production, hasher le mot de passe !
      }])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
};

// Fonction pour mettre à jour le mot de passe d'un utilisateur
export const updateUserPassword = async (userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ mot_de_passe: newPassword }) // En production, hasher le mot de passe !
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
};
