// Configuration Supabase pour la gestion des likes
import { supabase } from './supabase';

export interface TaskLike {
  id: string;
  taskId: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface LikeStats {
  taskId: string;
  title: string;
  typeNote: string;
  likesCount: number;
  likedByUsers: string[];
}

// Fonction pour obtenir le nombre de likes d'une tâche
export const getTaskLikesCount = async (taskId: string): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('get_task_likes_count', {
      task_uuid: taskId
    });
    
    if (error) throw error;
    return data || 0;
  } catch (error) {
    console.error('Erreur lors de la récupération du nombre de likes:', error);
    return 0;
  }
};

// Fonction pour vérifier si un utilisateur a liké une tâche
export const hasUserLikedTask = async (taskId: string, userEmail: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('has_user_liked_task', {
      task_uuid: taskId,
      user_email_param: userEmail
    });
    
    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error('Erreur lors de la vérification du like:', error);
    return false;
  }
};

// Fonction pour toggle un like (ajouter ou supprimer)
export const toggleTaskLike = async (taskId: string, userEmail: string): Promise<{liked: boolean, count: number}> => {
  try {
    const { data, error } = await supabase.rpc('toggle_task_like', {
      task_uuid: taskId,
      user_email_param: userEmail
    });
    
    if (error) throw error;
    return data || { liked: false, count: 0 };
  } catch (error) {
    console.error('Erreur lors du toggle du like:', error);
    return { liked: false, count: 0 };
  }
};

// Fonction pour obtenir les statistiques des likes d'une tâche
export const getTaskLikeStats = async (taskId: string): Promise<LikeStats | null> => {
  try {
    const { data, error } = await supabase
      .from('task_likes_stats')
      .select('*')
      .eq('task_id', taskId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de likes:', error);
    return null;
  }
};

// Fonction pour obtenir tous les likes d'un utilisateur
export const getUserLikes = async (userEmail: string): Promise<TaskLike[]> => {
  try {
    const { data, error } = await supabase
      .from('task_likes')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des likes de l\'utilisateur:', error);
    return [];
  }
};

// Fonction pour obtenir les tâches les plus likées
export const getMostLikedTasks = async (limit: number = 10): Promise<LikeStats[]> => {
  try {
    const { data, error } = await supabase
      .from('task_likes_stats')
      .select('*')
      .order('likes_count', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches les plus likées:', error);
    return [];
  }
};

// Fonction pour supprimer tous les likes d'une tâche (utile pour la suppression de tâche)
export const deleteTaskLikes = async (taskId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('task_likes')
      .delete()
      .eq('task_id', taskId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la suppression des likes de la tâche:', error);
  }
};
