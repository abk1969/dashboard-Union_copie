import { supabase } from './supabase';
import { User, UserTask, Team, UserStats } from '../types/user';
import { TodoTask } from '../types/index';

// ===== GESTION DES UTILISATEURS =====

export const createUser = async (userData: Omit<User, 'id' | 'dateCreation'>): Promise<User> => {
  // Préparer les données pour l'insertion
  const insertData: any = {
    email: userData.email,
    nom: userData.nom,
    prenom: userData.prenom,
    roles: userData.roles,
    equipe: userData.equipe,
    actif: userData.actif,
    plateformes_autorisees: userData.plateformesAutorisees,
    region_commerciale: userData.regionCommerciale,
    date_creation: new Date().toISOString()
  };

  // Si la colonne role existe encore, on la remplit avec le premier rôle
  if (userData.roles && userData.roles.length > 0) {
    insertData.role = userData.roles[0];
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;
    
    // Mapper la réponse vers l'interface User
    return {
      id: data.id,
      email: data.email,
      nom: data.nom,
      prenom: data.prenom,
      roles: data.roles || [],
      equipe: data.equipe,
      actif: data.actif,
      plateformesAutorisees: data.plateformes_autorisees,
      regionCommerciale: data.region_commerciale,
      dateCreation: data.date_creation
    };
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    console.error('Données envoyées:', userData);
    throw error;
  }
};

export const fetchUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('nom', { ascending: true });

    if (error) throw error;
    
    // Mapper les colonnes de la base vers l'interface User
    return (data || []).map((row: any) => ({
      id: row.id,
      email: row.email,
      nom: row.nom,
      prenom: row.prenom,
      roles: row.roles || [],
      equipe: row.equipe,
      actif: row.actif,
      plateformesAutorisees: row.plateformes_autorisees,
      regionCommerciale: row.region_commerciale,
      dateCreation: row.date_creation
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    throw error;
  }
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User> => {
  try {
    // Mapper les champs pour la base de données
    const dbUpdates: any = { ...updates };
    if (updates.roles) {
      dbUpdates.roles = updates.roles;
    }
    if (updates.plateformesAutorisees) {
      dbUpdates.plateformes_autorisees = updates.plateformesAutorisees;
    }
    if (updates.regionCommerciale) {
      dbUpdates.region_commerciale = updates.regionCommerciale;
    }

    const { data, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    
    // Mapper la réponse vers l'interface User
    return {
      id: data.id,
      email: data.email,
      nom: data.nom,
      prenom: data.prenom,
      roles: data.roles || [],
      equipe: data.equipe,
      actif: data.actif,
      plateformesAutorisees: data.plateformes_autorisees,
      regionCommerciale: data.region_commerciale,
      dateCreation: data.date_creation
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    throw error;
  }
};

// ===== GESTION DES ÉQUIPES =====

export const createTeam = async (teamData: Omit<Team, 'id' | 'dateCreation'>): Promise<Team> => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .insert([{
        nom: teamData.nom,
        description: teamData.description,
        responsable: teamData.responsable,
        date_creation: new Date().toISOString(),
        actif: teamData.actif
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la création de l\'équipe:', error);
    throw error;
  }
};

export const fetchTeams = async (): Promise<Team[]> => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('nom', { ascending: true });

    if (error) throw error;
    
    // Mapper les colonnes de la base vers l'interface Team
    return (data || []).map((row: any) => ({
      id: row.id,
      nom: row.nom,
      description: row.description,
      responsable: row.responsable,
      membres: row.membres || [],
      couleur: row.couleur || '#3B82F6',
      actif: row.actif,
      dateCreation: row.date_creation
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des équipes:', error);
    throw error;
  }
};

// ===== GESTION DES TÂCHES =====

// Fonction pour créer une note (insertion directe)
export const createNote = async (noteData: {
  codeUnion: string;
  noteSimple: string;
  auteur: string;
  dateCreation?: string;
}): Promise<TodoTask> => {
  try {
    const { data, error } = await supabase
      .from('todo_tasks')
      .insert([{
        clientcode: noteData.codeUnion,
        title: 'Note: ' + noteData.noteSimple.substring(0, 50) + '...',
        description: noteData.noteSimple,
        status: 'pending',
        priority: 'medium',
        category: 'other',
        type_note: 'NOTE SIMPLE',
        note_simple: noteData.noteSimple,
        auteur: noteData.auteur,
        createdat: noteData.dateCreation || new Date().toISOString(),
        updatedat: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Erreur lors de la création de la note:', error);
    throw error;
  }
};

export const createTask = async (taskData: Omit<TodoTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<TodoTask> => {
  try {
    // Convertir dueDate au format ISO si c'est une date simple
    let dueDateISO = null;
    if (taskData.dueDate) {
      if (taskData.dueDate.includes('T') || taskData.dueDate.includes('Z')) {
        // Déjà au format ISO
        dueDateISO = taskData.dueDate;
      } else {
        // Convertir YYYY-MM-DD en ISO
        dueDateISO = new Date(taskData.dueDate + 'T00:00:00.000Z').toISOString();
      }
    }

    // Convertir completedAt au format ISO si fourni
    let completedAtISO = null;
    if (taskData.completedAt) {
      if (taskData.completedAt.includes('T') || taskData.completedAt.includes('Z')) {
        completedAtISO = taskData.completedAt;
      } else {
        completedAtISO = new Date(taskData.completedAt + 'T00:00:00.000Z').toISOString();
      }
    }

    const { data, error } = await supabase
      .from('todo_tasks')
      .insert([{
        clientcode: taskData.clientCode,
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        category: taskData.category,
        assignedto: taskData.assignedTo,
        duedate: dueDateISO,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
        completedat: completedAtISO,
        tags: taskData.tags,
        notes: taskData.notes,
        // Nouvelles colonnes pour les notes
        note_simple: taskData.noteSimple,
        note_ia: taskData.noteIa,
        type_note: taskData.typeNote || 'TASK',
        auteur: taskData.auteur,
        date_rappel: taskData.dateRappel,
        plateforme: taskData.plateforme,
        region_commerciale: taskData.regionCommerciale
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la création de la tâche:', error);
    throw error;
  }
};

export const fetchTasks = async (): Promise<TodoTask[]> => {
  try {
    const { data, error } = await supabase
      .from('todo_tasks')
      .select('*')
      .order('createdat', { ascending: false });

    if (error) throw error;
    
    // Mapper les colonnes de la base vers l'interface TodoTask
    return (data || []).map((row: any) => ({
      id: row.id,
      clientCode: row.clientcode,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      category: row.category,
      assignedTo: row.assignedto,
      dueDate: row.duedate,
      createdAt: row.createdat,
      updatedAt: row.updatedat,
      completedAt: row.completedat,
      tags: row.tags,
      notes: row.notes,
      // Nouvelles colonnes pour les notes
      noteSimple: row.note_simple,
      noteIa: row.note_ia,
      typeNote: row.type_note,
      auteur: row.auteur,
      dateRappel: row.date_rappel,
      plateforme: row.plateforme,
      regionCommerciale: row.region_commerciale
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches:', error);
    throw error;
  }
};

export const updateTask = async (taskId: string, updates: Partial<TodoTask>): Promise<TodoTask> => {
  try {
    // Mapper les champs de l'interface vers les colonnes de la base
    const dbUpdates: any = {
      updatedat: new Date().toISOString()
    };
    
    if (updates.clientCode !== undefined) dbUpdates.clientcode = updates.clientCode;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.assignedTo !== undefined) dbUpdates.assignedto = updates.assignedTo;
    if (updates.dueDate !== undefined) dbUpdates.duedate = updates.dueDate;
    if (updates.completedAt !== undefined) dbUpdates.completedat = updates.completedAt;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

    const { data, error } = await supabase
      .from('todo_tasks')
      .update(dbUpdates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    
    // Mapper la réponse vers l'interface TodoTask
    return {
      id: data.id,
      clientCode: data.clientcode,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      category: data.category,
      assignedTo: data.assignedto,
      dueDate: data.duedate,
      createdAt: data.createdat,
      updatedAt: data.updatedat,
      completedAt: data.completedat,
      tags: data.tags,
      notes: data.notes
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la tâche:', error);
    throw error;
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('todo_tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche:', error);
    throw error;
  }
};

// ===== GESTION DES TÂCHES UTILISATEURS =====

export const assignTaskToUser = async (taskId: string, userId: string, assignedBy: string): Promise<UserTask> => {
  try {
    const { data, error } = await supabase
      .from('user_tasks')
      .insert([{
        task_id: taskId,
        user_id: userId,
        assigned_by: assignedBy,
        assigned_at: new Date().toISOString(),
        status: 'assigned'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de l\'assignation de la tâche:', error);
    throw error;
  }
};

export const updateTaskStatus = async (userTaskId: string, status: UserTask['status'], notes?: string): Promise<UserTask> => {
  try {
    const { data, error } = await supabase
      .from('user_tasks')
      .update({ 
        status,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', userTaskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    throw error;
  }
};

export const fetchUserTasks = async (userId: string): Promise<UserTask[]> => {
  try {
    const { data, error } = await supabase
      .from('user_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('assigned_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches utilisateur:', error);
    throw error;
  }
};

// ===== STATISTIQUES UTILISATEURS =====

export const fetchUserStats = async (userId: string): Promise<UserStats> => {
  try {
    // Récupérer l'utilisateur pour obtenir son email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Récupérer les tâches de l'utilisateur via son email
    const { data: tasks, error: tasksError } = await supabase
      .from('todo_tasks')
      .select('*')
      .eq('assignedto', user.email);

    if (tasksError) throw tasksError;

    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter((t: any) => t.status === 'completed').length || 0;
    const pendingTasks = tasks?.filter((t: any) => t.status === 'pending' || t.status === 'in_progress').length || 0;
    const overdueTasks = tasks?.filter((t: any) => {
      // Logique pour déterminer les tâches en retard
      if (t.status === 'completed') return false;
      if (!t.duedate) return false;
      return new Date(t.duedate) < new Date();
    }).length || 0;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculer le temps moyen de completion (simplifié)
    const completedTaskTimes = tasks?.filter((t: any) => t.status === 'completed').map((t: any) => {
      const created = new Date(t.createdat);
      const completed = new Date(t.completedat || t.updatedat || t.createdat);
      return (completed.getTime() - created.getTime()) / (1000 * 60 * 60); // en heures
    }) || [];

    const averageCompletionTime = completedTaskTimes.length > 0 
      ? completedTaskTimes.reduce((a: number, b: number) => a + b, 0) / completedTaskTimes.length 
      : 0;

    // Tâches cette semaine et ce mois
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const tasksThisWeek = tasks?.filter((t: any) => new Date(t.createdat) >= weekStart).length || 0;
    const tasksThisMonth = tasks?.filter((t: any) => new Date(t.createdat) >= monthStart).length || 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionRate,
      averageCompletionTime: Math.round(averageCompletionTime * 100) / 100,
      tasksThisWeek,
      tasksThisMonth
    };
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques utilisateur:', error);
    throw error;
  }
};
