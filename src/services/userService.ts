// Service centralisé pour la gestion des utilisateurs
import { supabase } from '../config/supabase';
import { generateUUIDFromEmail } from '../utils/uuidGenerator';
import { User } from '../types/user';

export interface UserServiceResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Service centralisé pour gérer les utilisateurs de manière cohérente
 */
export class UserService {
  /**
   * Récupère ou crée un utilisateur de manière cohérente
   * Garantit qu'un même email aura toujours le même ID
   */
  static async getOrCreateUser(userData: {
    email: string;
    nom?: string;
    prenom?: string;
    roles?: string[];
    isGoogleAuthenticated?: boolean;
    googleId?: string;
    avatarUrl?: string;
  }): Promise<UserServiceResult> {
    try {
      // 1. Vérifier si l'utilisateur existe déjà par email
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('email', userData.email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Erreur vérification utilisateur:', checkError);
        return { success: false, error: checkError.message };
      }

      if (existingUser) {
        // 2. L'utilisateur existe, le retourner avec les données mises à jour
        console.log('✅ Utilisateur existant trouvé:', existingUser.email);
        
        const updatedUser: User = {
          id: existingUser.id,
          email: existingUser.email,
          nom: existingUser.nom || userData.nom || 'Utilisateur',
          prenom: existingUser.prenom || userData.prenom || 'Utilisateur',
          roles: (existingUser.roles || userData.roles || ['direction_generale']) as ('direction_generale' | 'direction_developpement' | 'administratif' | 'communication' | 'commercial' | 'adv')[],
          equipe: existingUser.equipe || 'Direction',
          actif: existingUser.actif ?? true,
          avatarUrl: existingUser.avatarUrl || userData.avatarUrl,
          plateformesAutorisees: existingUser.plateformesAutorisees || ['alliance'],
          regionCommerciale: existingUser.regionCommerciale || 'France',
          isGoogleAuthenticated: userData.isGoogleAuthenticated || false,
          dateCreation: existingUser.dateCreation || new Date().toISOString(),
          derniereConnexion: new Date().toISOString()
        };

        // Mettre à jour les données si nécessaire
        await this.updateUser(existingUser.id, updatedUser);

        return { success: true, user: updatedUser };
      }

      // 3. L'utilisateur n'existe pas, le créer
      const userId = generateUUIDFromEmail(userData.email);
      console.log('🆕 Création nouvel utilisateur:', userData.email, 'ID:', userId);

      const newUser: User = {
        id: userId,
        email: userData.email,
        nom: userData.nom || 'Utilisateur',
        prenom: userData.prenom || 'Utilisateur',
        roles: (userData.roles || ['direction_generale']) as ('direction_generale' | 'direction_developpement' | 'administratif' | 'communication' | 'commercial' | 'adv')[],
        equipe: 'Direction',
        actif: true,
        avatarUrl: userData.avatarUrl,
        plateformesAutorisees: ['alliance'],
        regionCommerciale: 'France',
        isGoogleAuthenticated: userData.isGoogleAuthenticated || false,
        dateCreation: new Date().toISOString(),
        derniereConnexion: new Date().toISOString()
      };

      const { error: createError } = await supabase
        .from('users')
        .insert(newUser);

      if (createError) {
        console.error('❌ Erreur création utilisateur:', createError);
        return { success: false, error: createError.message };
      }

      return { success: true, user: newUser };

    } catch (error) {
      console.error('❌ Erreur UserService.getOrCreateUser:', error);
      return { success: false, error: 'Erreur lors de la gestion de l\'utilisateur' };
    }
  }

  /**
   * Met à jour un utilisateur existant
   */
  private static async updateUser(userId: string, userData: Partial<User>): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...userData,
          derniereConnexion: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.warn('⚠️ Erreur mise à jour utilisateur:', error);
      }
    } catch (error) {
      console.warn('⚠️ Erreur mise à jour utilisateur:', error);
    }
  }

  /**
   * Récupère un utilisateur par email
   */
  static async getUserByEmail(email: string): Promise<UserServiceResult> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: true, user: undefined };
        }
        return { success: false, error: error.message };
      }

      return { success: true, user: user as User };
    } catch (error) {
      console.error('❌ Erreur getUserByEmail:', error);
      return { success: false, error: 'Erreur lors de la récupération de l\'utilisateur' };
    }
  }
}
