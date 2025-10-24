// Système d'authentification simple avec email/mot de passe
import { supabase } from './supabase';
import { User } from '../types/user';
import { generateUUIDFromEmail } from '../utils/uuidGenerator';
import { isTokenExpired, getUserFromToken, UserProfile } from './securityPublic';

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: User;
  sessionToken?: string;
}

// Fonction pour se connecter
export const simpleLogin = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    // Mode de débogage : connexion admin temporaire
    if (email === 'admin@union.com' && password === 'admin') {
      const mockAdmin: User = {
        id: 'admin-temp',
        email: 'admin@union.com',
        nom: 'Admin',
        prenom: 'Super',
        roles: ['direction_generale'],
        equipe: 'Direction',
        actif: true,
        avatarUrl: undefined,
        dateCreation: new Date().toISOString(),
        derniereConnexion: new Date().toISOString(),
        plateformesAutorisees: ['Toutes'],
        regionCommerciale: 'Paris'
      };

      // Stocker un token temporaire
      localStorage.setItem('sessionToken', 'admin-temp-token');
      
      return {
        success: true,
        message: 'Connexion admin temporaire',
        user: mockAdmin,
        sessionToken: 'admin-temp-token'
      };
    }

    // Connexion simple : vérifier directement dans la table users
    // Normaliser l'email en minuscules pour éviter les problèmes de casse
    const normalizedEmail = email.toLowerCase().trim();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('mot_de_passe', password)
      .eq('actif', true)
      .single();

    if (error) {
      console.error('Erreur lors de la connexion:', error);
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
        id: generateUUIDFromEmail(data.email), // Utiliser l'UUID généré au lieu de l'ID Supabase
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
        isGoogleAuthenticated: false // Marquer comme non-Google pour éviter la confusion
      };

      // Mettre à jour la dernière connexion
      await supabase
        .from('users')
        .update({ derniere_connexion: new Date().toISOString() })
        .eq('id', data.id);
      
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

import { isTokenExpired, getUserFromToken, UserProfile } from './securityPublic';

// ... (gardez le reste du code du fichier)

// Fonction pour valider une session
export const validateSession = async (): Promise<{ user: User | null; error: string | null }> => {
  const token = localStorage.getItem('authToken');

  if (!token) {
    return { user: null, error: 'No token found' };
  }

  const expired = await isTokenExpired(token);
  if (expired) {
    localStorage.removeItem('authToken');
    return { user: null, error: 'Token expired' };
  }

  const userProfile = await getUserFromToken(token);
  if (userProfile) {
    // Convert UserProfile to User
    const user: User = {
        id: userProfile.username, // Ou générer un ID plus robuste
        email: userProfile.username,
        nom: userProfile.displayName,
        prenom: '',
        roles: [userProfile.role],
        equipe: '',
        actif: true,
        avatarUrl: userProfile.theme.logo,
        dateCreation: new Date().toISOString(),
        derniereConnexion: new Date().toISOString(),
        plateformesAutorisees: userProfile.allowedPlatforms,
        regionCommerciale: ''
    };
    return { user, error: null };
  }

  return { user: null, error: 'Invalid token' };
};


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

