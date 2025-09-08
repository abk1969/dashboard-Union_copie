import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock,
  BarChart3,
  MessageSquare,
  Heart,
  ThumbsUp,
  Flame,
  Smile,
  Star,
  Frown,
  AlertTriangle,
  Bell
} from 'lucide-react';
import { Project, TodoItem, User, Reaction, Comment, ProjectStats } from '../types/projectTypes';
import { mockUsers, mockProjects, mockTodos, mockProjectStats } from '../data/mockProjectDataWithTodos';
import { calculateOverallProgress, getProgressMetrics } from '../utils/progressCalculator';
import ProjectModal from './ProjectModal';
import TodoModal from './TodoModal';
import CreateModal from './CreateModal';

const ProjectManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'projects' | 'todos' | 'team' | 'activity'>('projects');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [notifications, setNotifications] = useState<number>(3);
  const currentUserId = '1'; // Utilisateur actuel

  // Données
  const [projects, setProjects] = useState<Project[]>(() => {
    // Calculer le pourcentage initial pour tous les projets
    return mockProjects.map(project => ({
      ...project,
      progress: calculateOverallProgress(project)
    }));
  });
  const [todos, setTodos] = useState<TodoItem[]>(mockTodos);
  const [users] = useState<User[]>(mockUsers);
  const [stats] = useState<ProjectStats>(mockProjectStats);

  // Filtrage des projets
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || project.priority === filterPriority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [projects, searchTerm, filterStatus, filterPriority]);

  // Filtrage des todos
  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          todo.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || todo.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || todo.priority === filterPriority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [todos, searchTerm, filterStatus, filterPriority]);

  // Gestion des réactions
  const handleReaction = (itemId: string, type: Reaction['type'], isProject: boolean = false) => {
    const newReaction = {
      id: Date.now().toString(),
      userId: '1', // Utilisateur actuel
      type,
      createdAt: new Date().toISOString()
    };

    if (isProject) {
      setProjects(prev => prev.map(project => 
        project.id === itemId 
          ? { ...project, reactions: [...project.reactions, newReaction] }
          : project
      ));
    } else {
      setTodos(prev => prev.map(todo => 
        todo.id === itemId 
          ? { ...todo, reactions: [...todo.reactions, newReaction] }
          : todo
      ));
    }
  };

  // Gestion des commentaires
  const handleAddComment = (itemId: string, isProject: boolean, content: string) => {
    if (!content.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      content: content,
      authorId: currentUserId,
      author: users.find(u => u.id === currentUserId) || users[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactions: []
    };

    if (isProject) {
      setProjects(prev => prev.map(project => 
        project.id === itemId 
          ? { ...project, comments: [...project.comments, newComment] }
          : project
      ));
    } else {
      setTodos(prev => prev.map(todo => 
        todo.id === itemId 
          ? { ...todo, comments: [...todo.comments, newComment] }
          : todo
      ));
    }
  };

  // Gestion du statut des todos
  const handleTodoStatusChange = (todoId: string, newStatus: TodoItem['status']) => {
    setTodos(prev => prev.map(todo => 
      todo.id === todoId 
        ? { ...todo, status: newStatus, updatedAt: new Date().toISOString() }
        : todo
    ));
  };

  // Gestion des projets
  const handleCreateProject = (projectData: any) => {
    const newProject: Project = {
      ...projectData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: users.find(u => u.id === currentUserId) || users[0],
      team: [{
        userId: currentUserId,
        user: users.find(u => u.id === currentUserId) || users[0],
        role: 'admin',
        joinedAt: new Date().toISOString()
      }],
      todos: [],
      comments: [],
      reactions: [],
      attachments: []
    };
    
    // Calculer le pourcentage initial (0% car pas de tâches)
    newProject.progress = calculateOverallProgress(newProject);
    
    setProjects(prev => [newProject, ...prev]);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(project => 
      project.id === updatedProject.id ? updatedProject : project
    ));
  };

  // Gestion des participants
  const handleAddParticipant = (projectId: string, userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newParticipant = {
      userId: user.id,
      user: user,
      role: 'member' as const,
      joinedAt: new Date().toISOString()
    };

    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? { 
            ...project, 
            team: [...project.team, newParticipant],
            updatedAt: new Date().toISOString()
          }
        : project
    ));

    // Notification
    setNotifications(prev => prev + 1);
  };

  const handleRemoveParticipant = (projectId: string, userId: string) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? { 
            ...project, 
            team: project.team.filter(member => member.userId !== userId),
            updatedAt: new Date().toISOString()
          }
        : project
    ));
  };

  // Gestion des todos
  const handleCreateTodo = (todoData: any) => {
    const newTodo: TodoItem = {
      ...todoData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: users.find(u => u.id === currentUserId) || users[0],
      assignee: todoData.assigneeId ? users.find(u => u.id === todoData.assigneeId) : undefined,
      comments: [],
      reactions: [],
      attachments: []
    };
    setTodos(prev => [newTodo, ...prev]);
    
    // Si la tâche est associée à un projet, recalculer le pourcentage
    if (todoData.projectId) {
      setProjects(prev => prev.map(project => {
        if (project.id === todoData.projectId) {
          const updatedProject = {
            ...project,
            todos: [...project.todos, newTodo],
            updatedAt: new Date().toISOString()
          };
          updatedProject.progress = calculateOverallProgress(updatedProject);
          return updatedProject;
        }
        return project;
      }));
    }
  };

  const handleUpdateTodo = (updatedTodo: TodoItem) => {
    setTodos(prev => prev.map(todo => 
      todo.id === updatedTodo.id ? updatedTodo : todo
    ));
    
    // Recalculer le pourcentage des projets associés
    setProjects(prev => prev.map(project => {
      // Vérifier si le todo appartient à ce projet
      const hasTodo = project.todos.some(todo => todo.id === updatedTodo.id);
      if (!hasTodo) return project;
      
      const projectTodos = project.todos.map(todo => 
        todo.id === updatedTodo.id ? updatedTodo : todo
      );
      const updatedProject = {
        ...project,
        todos: projectTodos,
        updatedAt: new Date().toISOString()
      };
      updatedProject.progress = calculateOverallProgress(updatedProject);
      return updatedProject;
    }));
  };

  // Gestion des clics
  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  };

  const handleTodoClick = (todo: TodoItem) => {
    setSelectedTodo(todo);
    setShowTodoModal(true);
  };

  // Composant de réactions
  const ReactionButtons: React.FC<{ itemId: string; reactions: Reaction[]; isProject?: boolean }> = ({ 
    itemId, 
    reactions, 
    isProject = false 
  }) => {
    const reactionTypes: { type: Reaction['type']; icon: React.ReactNode; color: string }[] = [
      { type: 'like', icon: <ThumbsUp className="w-4 h-4" />, color: 'text-blue-500' },
      { type: 'love', icon: <Heart className="w-4 h-4" />, color: 'text-red-500' },
      { type: 'fire', icon: <Flame className="w-4 h-4" />, color: 'text-orange-500' },
      { type: 'laugh', icon: <Smile className="w-4 h-4" />, color: 'text-yellow-500' },
      { type: 'wow', icon: <Star className="w-4 h-4" />, color: 'text-purple-500' },
      { type: 'sad', icon: <Frown className="w-4 h-4" />, color: 'text-gray-500' },
      { type: 'angry', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-600' }
    ];

    return (
      <div className="flex items-center space-x-2">
        {reactionTypes.map(({ type, icon, color }) => {
          const count = reactions.filter(r => r.type === type).length;
          const hasReacted = reactions.some(r => r.type === type && r.userId === '1');
          
          return (
            <button
              key={type}
              onClick={() => handleReaction(itemId, type, isProject)}
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm transition-colors ${
                hasReacted 
                  ? `${color} bg-gray-100` 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {icon}
              {count > 0 && <span className="text-xs">{count}</span>}
            </button>
          );
        })}
      </div>
    );
  };

  // Composant de priorité
  const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };

    const labels = {
      low: 'Basse',
      medium: 'Moyenne',
      high: 'Haute',
      urgent: 'Urgente'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[priority as keyof typeof colors]}`}>
        {labels[priority as keyof typeof labels]}
      </span>
    );
  };

  // Composant de statut
  const StatusBadge: React.FC<{ status: string; isProject?: boolean }> = ({ status, isProject = false }) => {
    const projectColors = {
      planning: 'bg-gray-100 text-gray-800',
      active: 'bg-blue-100 text-blue-800',
      'on-hold': 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    const todoColors = {
      todo: 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      review: 'bg-yellow-100 text-yellow-800',
      done: 'bg-green-100 text-green-800'
    };

    const projectLabels = {
      planning: 'Planification',
      active: 'Actif',
      'on-hold': 'En pause',
      completed: 'Terminé',
      cancelled: 'Annulé'
    };

    const todoLabels = {
      todo: 'À faire',
      'in-progress': 'En cours',
      review: 'En révision',
      done: 'Terminé'
    };

    const colors = isProject ? projectColors : todoColors;
    const labels = isProject ? projectLabels : todoLabels;

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                🚀 Gestion de Projets & To-Do
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              {notifications > 0 && (
                <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <Bell className="w-6 h-6" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications}
                  </span>
                </button>
              )}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1 animate-pulse"
              >
                <Plus className="w-5 h-5 mr-2" />
                <span className="font-semibold">Nouveau</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'projects', label: 'Projets', count: projects.length },
                { id: 'todos', label: 'To-Do', count: todos.length },
                { id: 'team', label: 'Équipe', count: users.length },
                { id: 'activity', label: 'Activité', count: stats.recentActivity.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous statuts</option>
              {activeTab === 'projects' ? (
                <>
                  <option value="planning">Planification</option>
                  <option value="active">Actif</option>
                  <option value="on-hold">En pause</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </>
              ) : (
                <>
                  <option value="todo">À faire</option>
                  <option value="in-progress">En cours</option>
                  <option value="review">En révision</option>
                  <option value="done">Terminé</option>
                </>
              )}
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes priorités</option>
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Projets Actifs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tâches Terminées</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedTodos}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En Retard</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdueTodos}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Membres</p>
                <p className="text-2xl font-bold text-gray-900">{stats.teamMembers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.03] hover:border-blue-300 card-hover group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {project.name}
                      </h3>
                      <PriorityBadge priority={project.priority} />
                      <StatusBadge status={project.status} isProject />
                    </div>
                    <p className="text-gray-600 mb-3">{project.description}</p>
                    
                    {/* Barre de progression dynamique */}
                    <div className="mb-3">
                      {(() => {
                        const metrics = getProgressMetrics(project);
                        return (
                          <>
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                              <span>Progression</span>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold">{metrics.progress}%</span>
                                <span className={`text-xs ${metrics.progressStatus.color}`}>
                                  {metrics.progressStatus.icon} {metrics.progressStatus.status}
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  metrics.progress < 25 ? 'bg-red-500' :
                                  metrics.progress < 50 ? 'bg-orange-500' :
                                  metrics.progress < 75 ? 'bg-blue-500' :
                                  metrics.progress < 90 ? 'bg-green-500' :
                                  'bg-green-600'
                                }`}
                                style={{ width: `${metrics.progress}%` }}
                              ></div>
                            </div>
                            {metrics.todos.total > 0 && (
                              <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                                <span>{metrics.todos.completed} terminées</span>
                                <span>{metrics.todos.inProgress} en cours</span>
                                <span>{metrics.todos.todo} à faire</span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {/* Équipe */}
                    <div className="flex items-center space-x-2 mb-3">
                      <Users className="w-4 h-4 text-gray-400" />
                      <div className="flex -space-x-2">
                        {project.team.slice(0, 3).map((member) => (
                          <div
                            key={member.userId}
                            className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium"
                            style={{ backgroundColor: member.user.color + '20' }}
                            title={member.user.name}
                          >
                            {member.user.avatar}
                          </div>
                        ))}
                        {project.team.length > 3 && (
                          <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                            +{project.team.length - 3}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Réactions et commentaires */}
                    <div className="flex items-center justify-between">
                      <ReactionButtons 
                        itemId={project.id} 
                        reactions={project.reactions} 
                        isProject 
                      />
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {project.comments.length}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {project.endDate ? new Date(project.endDate).toLocaleDateString('fr-FR') : 'Pas de date'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'todos' && (
          <div className="space-y-4">
            {filteredTodos.map((todo) => (
              <div
                key={todo.id}
                onClick={() => handleTodoClick(todo)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.03] hover:border-green-300 card-hover group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {todo.title}
                      </h3>
                      <PriorityBadge priority={todo.priority} />
                      <StatusBadge status={todo.status} />
                    </div>
                    <p className="text-gray-600 mb-3">{todo.description}</p>
                    
                    {/* Assigné à */}
                    {todo.assignee && (
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-sm text-gray-500">Assigné à:</span>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                            style={{ backgroundColor: todo.assignee.color + '20' }}
                          >
                            {todo.assignee.avatar}
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {todo.assignee.name}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Projet */}
                    {todo.projectId && (
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-sm text-gray-500">Projet:</span>
                        <span className="text-sm font-medium text-blue-600">
                          {projects.find(p => p.id === todo.projectId)?.name}
                        </span>
                      </div>
                    )}

                    {/* Tags */}
                    {todo.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {todo.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions de statut */}
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-sm text-gray-500">Statut:</span>
                      <select
                        value={todo.status}
                        onChange={(e) => handleTodoStatusChange(todo.id, e.target.value as TodoItem['status'])}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="todo">À faire</option>
                        <option value="in-progress">En cours</option>
                        <option value="review">En révision</option>
                        <option value="done">Terminé</option>
                      </select>
                    </div>

                    {/* Réactions et commentaires */}
                    <div className="flex items-center justify-between">
                      <ReactionButtons 
                        itemId={todo.id} 
                        reactions={todo.reactions} 
                      />
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {todo.comments.length}
                        </span>
                        {todo.dueDate && (
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(todo.dueDate).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'team' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-medium"
                    style={{ backgroundColor: user.color + '20' }}
                  >
                    {user.avatar}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user.name}
                    </h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-2 ${
                      user.role === 'admin' 
                        ? 'bg-red-100 text-red-800' 
                        : user.role === 'member'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'admin' ? 'Administrateur' : 
                       user.role === 'member' ? 'Membre' : 'Observateur'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4">
            {stats.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{ backgroundColor: activity.user.color + '20' }}
                  >
                    {activity.user.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900">{activity.description}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(activity.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateProject={handleCreateProject}
        onCreateTodo={handleCreateTodo}
        users={users}
        currentUserId={currentUserId}
        projects={projects}
      />

      <ProjectModal
        project={selectedProject}
        isOpen={showProjectModal}
        onClose={() => {
          setShowProjectModal(false);
          setSelectedProject(null);
        }}
        onUpdate={handleUpdateProject}
        onAddComment={(projectId, content) => handleAddComment(projectId, true, content)}
        onAddParticipant={handleAddParticipant}
        onRemoveParticipant={handleRemoveParticipant}
        users={users}
        currentUserId={currentUserId}
      />

      <TodoModal
        todo={selectedTodo}
        isOpen={showTodoModal}
        onClose={() => {
          setShowTodoModal(false);
          setSelectedTodo(null);
        }}
        onUpdate={handleUpdateTodo}
        onAddComment={(todoId, content) => handleAddComment(todoId, false, content)}
        users={users}
        currentUserId={currentUserId}
        projects={projects}
      />
    </div>
  );
};

export default ProjectManagement;
