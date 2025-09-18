// Types pour la gestion des utilisateurs
export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  roles: ('direction_generale' | 'direction_developpement' | 'administratif' | 'communication' | 'commercial' | 'adv')[];
  equipe?: string;
  actif: boolean;
  avatarUrl?: string;
  dateCreation: string;
  derniereConnexion?: string;
  plateformesAutorisees: string[]; // ['acr', 'dca', 'exadis', 'alliance']
  regionCommerciale?: string;
}

export interface UserTask {
  id: string;
  taskId: string;
  userId: string;
  assignedBy: string;
  assignedAt: string;
  status: 'assigned' | 'accepted' | 'declined' | 'completed';
  notes?: string;
}

export interface Team {
  id: string;
  nom: string;
  description?: string;
  responsable: string; // User ID
  membres: string[]; // User IDs
  couleur: string;
  actif: boolean;
  dateCreation: string;
}

export interface UserStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageCompletionTime: number; // en heures
  tasksThisWeek: number;
  tasksThisMonth: number;
}

export interface TaskAssignment {
  taskId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  assignedAt: string;
  status: 'assigned' | 'accepted' | 'declined' | 'completed';
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
}
