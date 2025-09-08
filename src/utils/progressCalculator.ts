import { Project } from '../types/projectTypes';

/**
 * Calcule le pourcentage d'avancement d'un projet basé sur ses tâches
 */
export const calculateProjectProgress = (project: Project): number => {
  if (!project.todos || project.todos.length === 0) {
    return 0;
  }

  const totalTodos = project.todos.length;
  const completedTodos = project.todos.filter(todo => todo.status === 'done').length;
  
  // Calcul basique : pourcentage de tâches terminées
  const basicProgress = Math.round((completedTodos / totalTodos) * 100);
  
  // Bonus pour les tâches en cours (50% du poids)
  const inProgressTodos = project.todos.filter(todo => todo.status === 'in-progress').length;
  const inProgressBonus = Math.round((inProgressTodos / totalTodos) * 50);
  
  // Bonus pour les tâches en révision (75% du poids)
  const reviewTodos = project.todos.filter(todo => todo.status === 'review').length;
  const reviewBonus = Math.round((reviewTodos / totalTodos) * 75);
  
  // Calcul final avec bonus
  const finalProgress = Math.min(100, basicProgress + inProgressBonus + reviewBonus);
  
  return finalProgress;
};

/**
 * Calcule le pourcentage d'avancement basé sur les priorités
 */
export const calculateProgressByPriority = (project: Project): number => {
  if (!project.todos || project.todos.length === 0) {
    return 0;
  }

  // Poids des priorités
  const priorityWeights = {
    'urgent': 4,
    'high': 3,
    'medium': 2,
    'low': 1
  };

  // Poids des statuts
  const statusWeights = {
    'done': 1,
    'review': 0.75,
    'in-progress': 0.5,
    'todo': 0
  };

  let totalWeight = 0;
  let completedWeight = 0;

  project.todos.forEach(todo => {
    const priorityWeight = priorityWeights[todo.priority] || 1;
    const statusWeight = statusWeights[todo.status] || 0;
    
    totalWeight += priorityWeight;
    completedWeight += priorityWeight * statusWeight;
  });

  if (totalWeight === 0) return 0;
  
  return Math.round((completedWeight / totalWeight) * 100);
};

/**
 * Calcule le pourcentage d'avancement basé sur les dates
 */
export const calculateProgressByTime = (project: Project): number => {
  if (!project.startDate && !project.endDate) {
    return 0;
  }

  const now = new Date();
  const startDate = new Date(project.startDate);
  const endDate = project.endDate ? new Date(project.endDate) : new Date(startDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 jours par défaut

  if (now < startDate) return 0;
  if (now > endDate) return 100;

  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();
  
  return Math.round((elapsed / totalDuration) * 100);
};

/**
 * Calcule le pourcentage d'avancement global (moyenne pondérée)
 */
export const calculateOverallProgress = (project: Project): number => {
  const taskProgress = calculateProjectProgress(project);
  const priorityProgress = calculateProgressByPriority(project);
  const timeProgress = calculateProgressByTime(project);

  // Pondération : 60% tâches, 25% priorités, 15% temps
  const weightedProgress = Math.round(
    (taskProgress * 0.6) + 
    (priorityProgress * 0.25) + 
    (timeProgress * 0.15)
  );

  return Math.min(100, Math.max(0, weightedProgress));
};

/**
 * Obtient le statut de progression basé sur le pourcentage
 */
export const getProgressStatus = (progress: number): { status: string; color: string; icon: string } => {
  if (progress === 0) {
    return { status: 'Non démarré', color: 'text-gray-500', icon: '⏸️' };
  } else if (progress < 25) {
    return { status: 'Début', color: 'text-red-500', icon: '🚀' };
  } else if (progress < 50) {
    return { status: 'En cours', color: 'text-orange-500', icon: '⚡' };
  } else if (progress < 75) {
    return { status: 'Bien avancé', color: 'text-blue-500', icon: '🔥' };
  } else if (progress < 90) {
    return { status: 'Presque fini', color: 'text-green-500', icon: '🎯' };
  } else if (progress < 100) {
    return { status: 'Finalisation', color: 'text-green-600', icon: '✨' };
  } else {
    return { status: 'Terminé', color: 'text-green-700', icon: '🏆' };
  }
};

/**
 * Calcule les métriques de progression détaillées
 */
export const getProgressMetrics = (project: Project) => {
  const todos = project.todos || [];
  const totalTodos = todos.length;
  const completedTodos = todos.filter(todo => todo.status === 'done').length;
  const inProgressTodos = todos.filter(todo => todo.status === 'in-progress').length;
  const reviewTodos = todos.filter(todo => todo.status === 'review').length;
  const todoTodos = todos.filter(todo => todo.status === 'todo').length;

  const progress = calculateOverallProgress(project);
  const progressStatus = getProgressStatus(progress);

  return {
    progress,
    progressStatus,
    todos: {
      total: totalTodos,
      completed: completedTodos,
      inProgress: inProgressTodos,
      review: reviewTodos,
      todo: todoTodos
    },
    percentages: {
      completed: totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0,
      inProgress: totalTodos > 0 ? Math.round((inProgressTodos / totalTodos) * 100) : 0,
      review: totalTodos > 0 ? Math.round((reviewTodos / totalTodos) * 100) : 0,
      todo: totalTodos > 0 ? Math.round((todoTodos / totalTodos) * 100) : 0
    }
  };
};
