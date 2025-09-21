// Configuration Supabase pour la gestion des photos de profil
import { supabase } from './supabase';
import { UserService } from '../services/userService';

export interface UserPhoto {
  id: string;
  userId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
}

// Fonction pour uploader une photo de profil
export const uploadUserPhoto = async (
  userId: string,
  file: File,
  userData?: any
): Promise<{ success: boolean; photoUrl?: string; error?: string }> => {
  try {
    // S'assurer que l'utilisateur existe et récupérer son ID réel
    let actualUserId = userId;
    if (userData) {
      const userResult = await UserService.getOrCreateUser(userData);
      if (!userResult.success) {
        return { success: false, error: userResult.error };
      }
      actualUserId = userResult.user!.id;
      console.log('✅ Utilisateur vérifié/créé, ID:', actualUserId);
    }

    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${actualUserId}-${Date.now()}.${fileExt}`;
    const filePath = `user-photos/${fileName}`;

    // Upload du fichier vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Erreur upload Supabase Storage:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('user-photos')
      .getPublicUrl(filePath);

    const photoUrl = urlData.publicUrl;

    // Enregistrer les métadonnées dans la table user_photos
    const { error: dbError } = await supabase
      .from('user_photos')
      .insert({
        user_id: actualUserId,
        file_name: fileName,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type
      });

    if (dbError) {
      console.error('❌ Erreur sauvegarde métadonnées:', dbError);
      // Supprimer le fichier uploadé en cas d'erreur DB
      await supabase.storage
        .from('user-photos')
        .remove([filePath]);
      return { success: false, error: dbError.message };
    }

    console.log('✅ Photo uploadée avec succès:', photoUrl);
    return { success: true, photoUrl };
  } catch (error) {
    console.error('❌ Erreur upload photo:', error);
    return { success: false, error: 'Erreur lors de l\'upload de la photo' };
  }
};

// Fonction pour récupérer la photo de profil d'un utilisateur
export const getUserPhoto = async (userId: string, userEmail?: string): Promise<{ success: boolean; photoUrl?: string; error?: string }> => {
  try {
    let actualUserId = userId;
    
    // Si on a l'email, récupérer l'ID réel de l'utilisateur
    if (userEmail) {
      const userResult = await UserService.getUserByEmail(userEmail);
      if (userResult.success && userResult.user) {
        actualUserId = userResult.user.id;
        console.log('✅ Récupération photo avec ID utilisateur:', actualUserId);
      }
    }

    const { data, error } = await supabase
      .from('user_photos')
      .select('file_path')
      .eq('user_id', actualUserId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Erreur récupération photo:', error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      // Aucune photo trouvée
      return { success: true, photoUrl: undefined };
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('user-photos')
      .getPublicUrl(data[0].file_path);

    return { success: true, photoUrl: urlData.publicUrl };
  } catch (error) {
    console.error('❌ Erreur récupération photo:', error);
    return { success: false, error: 'Erreur lors de la récupération de la photo' };
  }
};

// Fonction pour supprimer la photo de profil d'un utilisateur
export const deleteUserPhoto = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Récupérer les informations de la photo
    const { data: photoData, error: fetchError } = await supabase
      .from('user_photos')
      .select('file_path')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Erreur récupération photo à supprimer:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!photoData || photoData.length === 0) {
      // Aucune photo trouvée
      return { success: true };
    }

    // Supprimer le fichier du storage
    const { error: storageError } = await supabase.storage
      .from('user-photos')
      .remove([photoData[0].file_path]);

    if (storageError) {
      console.error('Erreur suppression fichier storage:', storageError);
      return { success: false, error: storageError.message };
    }

    // Supprimer l'enregistrement de la base de données
    const { error: dbError } = await supabase
      .from('user_photos')
      .delete()
      .eq('user_id', userId);

    if (dbError) {
      console.error('Erreur suppression métadonnées:', dbError);
      return { success: false, error: dbError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur suppression photo:', error);
    return { success: false, error: 'Erreur lors de la suppression de la photo' };
  }
};

// Fonction pour mettre à jour la photo de profil (supprime l'ancienne et ajoute la nouvelle)
export const updateUserPhoto = async (
  userId: string,
  file: File,
  userData?: any
): Promise<{ success: boolean; photoUrl?: string; error?: string }> => {
  try {
    // Supprimer l'ancienne photo
    await deleteUserPhoto(userId);
    
    // Uploader la nouvelle photo
    return await uploadUserPhoto(userId, file, userData);
  } catch (error) {
    console.error('Erreur mise à jour photo:', error);
    return { success: false, error: 'Erreur lors de la mise à jour de la photo' };
  }
};
