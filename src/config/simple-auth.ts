// Système d'authentification simple avec email/mot de passe
import { supabase } from './supabase';
import { User } from '../types/user';
import { isTokenExpired, getUserFromToken } from './securityPublic';
import { encrypt, decrypt } from '../utils/encryption';

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: User;
  sessionToken?: string;
}


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
        id: userProfile.username, // Or generate a more robust ID
        email: decrypt(userProfile.username),
        nom: decrypt(userProfile.displayName),
        prenom: '', // This field is empty, but we'll decrypt it for consistency if it's used in the future
        roles: [userProfile.role] as any,
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
        email: encrypt(normalizedEmail),
        nom: encrypt(userData.nom),
        prenom: encrypt(userData.prenom),
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

// Fonction pour supprimer un utilisateur (Droit à l'effacement)
export const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur inattendue lors de la suppression:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
};
