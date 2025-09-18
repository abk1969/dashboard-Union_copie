// Configuration Supabase pour la gestion des vues
import { supabase } from './supabase';

export interface TaskView {
  id: string;
  taskId: string;
  userEmail: string;
  viewedAt: string;
  createdAt: string;
}

export interface ViewStats {
  taskId: string;
  title: string;
  typeNote: string;
  auteur: string;
  viewsCount: number;
  viewedByUsers: string[];
  viewedAtTimes: string[];
}

// Fonction pour obtenir le nombre de vues d'une tâche
export const getTaskViewsCount = async (taskId: string): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('get_task_views_count', {
      task_uuid: taskId
    });
    
    if (error) throw error;
    return data || 0;
  } catch (error) {
    console.error('Erreur lors de la récupération du nombre de vues:', error);
    return 0;
  }
};

// Fonction pour vérifier si un utilisateur a vu une tâche
export const hasUserViewedTask = async (taskId: string, userEmail: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('has_user_viewed_task', {
      task_uuid: taskId,
      user_email_param: userEmail
    });
    
    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error('Erreur lors de la vérification de la vue:', error);
    return false;
  }
};

// Fonction pour marquer une tâche comme vue
export const markTaskAsViewed = async (taskId: string, userEmail: string): Promise<{viewed: boolean, count: number, viewedAt: string}> => {
  try {
    const { data, error } = await supabase.rpc('mark_task_as_viewed', {
      task_uuid: taskId,
      user_email_param: userEmail
    });
    
    if (error) throw error;
    return data || { viewed: false, count: 0, viewedAt: new Date().toISOString() };
  } catch (error) {
    console.error('Erreur lors du marquage comme vue:', error);
    return { viewed: false, count: 0, viewedAt: new Date().toISOString() };
  }
};

// Fonction pour obtenir les utilisateurs qui ont vu une tâche
export const getTaskViewers = async (taskId: string): Promise<{userEmail: string, viewedAt: string}[]> => {
  try {
    const { data, error } = await supabase.rpc('get_task_viewers', {
      task_uuid: taskId
    });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des viewers:', error);
    return [];
  }
};

// Fonction pour obtenir les statistiques des vues d'une tâche
export const getTaskViewStats = async (taskId: string): Promise<ViewStats | null> => {
  try {
    const { data, error } = await supabase
      .from('task_views_stats')
      .select('*')
      .eq('task_id', taskId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de vues:', error);
    return null;
  }
};

// Fonction pour obtenir toutes les vues d'un utilisateur
export const getUserViews = async (userEmail: string): Promise<TaskView[]> => {
  try {
    const { data, error } = await supabase
      .from('task_views')
      .select('*')
      .eq('user_email', userEmail)
      .order('viewed_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des vues de l\'utilisateur:', error);
    return [];
  }
};

// Fonction pour obtenir les notes les plus vues
export const getMostViewedNotes = async (limit: number = 10): Promise<ViewStats[]> => {
  try {
    const { data, error } = await supabase
      .from('task_views_stats')
      .select('*')
      .order('views_count', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des notes les plus vues:', error);
    return [];
  }
};

// Fonction pour supprimer toutes les vues d'une tâche (utile pour la suppression de tâche)
export const deleteTaskViews = async (taskId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('task_views')
      .delete()
      .eq('task_id', taskId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la suppression des vues de la tâche:', error);
  }
};
