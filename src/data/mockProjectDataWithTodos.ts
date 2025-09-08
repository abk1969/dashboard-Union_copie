import { User, Project, TodoItem, ProjectStats } from '../types/projectTypes';

// Utilisateurs fictifs de l'équipe
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Martin Dupont',
    email: 'martin@union.com',
    role: 'admin',
    color: '#3B82F6',
    avatar: '👨‍💼'
  },
  {
    id: '2',
    name: 'Sophie Martin',
    email: 'sophie@union.com',
    role: 'admin',
    color: '#EC4899',
    avatar: '👩‍💻'
  },
  {
    id: '3',
    name: 'Pierre Durand',
    email: 'pierre@union.com',
    role: 'member',
    color: '#10B981',
    avatar: '👨‍🔧'
  },
  {
    id: '4',
    name: 'Marie Leroy',
    email: 'marie@union.com',
    role: 'member',
    color: '#F59E0B',
    avatar: '👩‍💻'
  },
  {
    id: '5',
    name: 'Alliance Team',
    email: 'alliance@union.com',
    role: 'viewer',
    color: '#003f7f',
    avatar: '🏢'
  }
];

// Todos fictifs
export const mockTodos: TodoItem[] = [
  {
    id: '1',
    title: 'Analyse des besoins',
    description: 'Analyser les besoins en équipement automobile',
    status: 'done',
    priority: 'high',
    assigneeId: '1',
    assignee: mockUsers[0],
    projectId: '1',
    createdBy: '1',
    author: mockUsers[0],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    comments: [],
    reactions: [],
    attachments: [],
    tags: ['analyse', 'besoins'],
    isArchived: false
  },
  {
    id: '2',
    title: 'Sélection des fournisseurs',
    description: 'Rechercher et sélectionner les fournisseurs',
    status: 'in-progress',
    priority: 'high',
    assigneeId: '2',
    assignee: mockUsers[1],
    projectId: '1',
    createdBy: '1',
    author: mockUsers[0],
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    comments: [],
    reactions: [],
    attachments: [],
    tags: ['fournisseurs', 'sélection'],
    isArchived: false
  },
  {
    id: '3',
    title: 'Validation budgétaire',
    description: 'Valider le budget avec la direction',
    status: 'todo',
    priority: 'urgent',
    assigneeId: '1',
    assignee: mockUsers[0],
    projectId: '1',
    createdBy: '1',
    author: mockUsers[0],
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    comments: [],
    reactions: [],
    attachments: [],
    tags: ['budget', 'validation'],
    isArchived: false
  },
  {
    id: '4',
    title: 'Migration Supabase',
    description: 'Migrer les données vers Supabase',
    status: 'done',
    priority: 'high',
    assigneeId: '2',
    assignee: mockUsers[1],
    projectId: '2',
    createdBy: '2',
    author: mockUsers[1],
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    comments: [],
    reactions: [],
    attachments: [],
    tags: ['migration', 'supabase'],
    isArchived: false
  },
  {
    id: '5',
    title: 'Tests de performance',
    description: 'Effectuer les tests de performance',
    status: 'review',
    priority: 'medium',
    assigneeId: '3',
    assignee: mockUsers[2],
    projectId: '2',
    createdBy: '2',
    author: mockUsers[1],
    createdAt: '2024-01-06T00:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    comments: [],
    reactions: [],
    attachments: [],
    tags: ['tests', 'performance'],
    isArchived: false
  }
];

// Projets fictifs avec todos liés
export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Équipement Auto 2025',
    description: 'Projet de renouvellement du parc automobile pour 2025',
    status: 'active',
    priority: 'high',
    progress: 0, // Sera calculé dynamiquement
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    createdBy: '1',
    author: mockUsers[0],
    team: [
      { userId: '1', user: mockUsers[0], role: 'admin', joinedAt: '2024-01-01T00:00:00Z' },
      { userId: '2', user: mockUsers[1], role: 'admin', joinedAt: '2024-01-02T00:00:00Z' },
      { userId: '3', user: mockUsers[2], role: 'member', joinedAt: '2024-01-03T00:00:00Z' }
    ],
    todos: mockTodos.filter(todo => todo.projectId === '1'),
    comments: [],
    reactions: [
      { id: '1', userId: '2', type: 'fire', createdAt: '2024-01-10T00:00:00Z' },
      { id: '2', userId: '3', type: 'like', createdAt: '2024-01-11T00:00:00Z' }
    ],
    attachments: [],
    tags: ['équipement', '2025', 'automobile'],
    color: '#3B82F6',
    isArchived: false
  },
  {
    id: '2',
    name: 'Migration Supabase',
    description: 'Migration complète vers Supabase pour améliorer les performances',
    status: 'active',
    priority: 'urgent',
    progress: 0, // Sera calculé dynamiquement
    startDate: '2024-01-05',
    endDate: '2024-03-31',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    createdBy: '2',
    author: mockUsers[1],
    team: [
      { userId: '2', user: mockUsers[1], role: 'admin', joinedAt: '2024-01-05T00:00:00Z' },
      { userId: '3', user: mockUsers[2], role: 'admin', joinedAt: '2024-01-06T00:00:00Z' }
    ],
    todos: mockTodos.filter(todo => todo.projectId === '2'),
    comments: [],
    reactions: [
      { id: '3', userId: '1', type: 'love', createdAt: '2024-01-12T00:00:00Z' }
    ],
    attachments: [],
    tags: ['migration', 'supabase', 'performance'],
    color: '#10B981',
    isArchived: false
  },
  {
    id: '3',
    name: 'Formation Équipe',
    description: 'Formation de l\'équipe sur les nouveaux outils',
    status: 'planning',
    priority: 'medium',
    progress: 0, // Sera calculé dynamiquement
    startDate: '2024-02-01',
    endDate: '2024-04-30',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
    createdBy: '1',
    author: mockUsers[0],
    team: [
      { userId: '1', user: mockUsers[0], role: 'admin', joinedAt: '2024-01-10T00:00:00Z' },
      { userId: '4', user: mockUsers[3], role: 'admin', joinedAt: '2024-01-11T00:00:00Z' }
    ],
    todos: [], // Pas de todos pour ce projet
    comments: [],
    reactions: [],
    attachments: [],
    tags: ['formation', 'équipe', 'outils'],
    color: '#F59E0B',
    isArchived: false
  }
];

// Statistiques fictives
export const mockProjectStats: ProjectStats = {
  totalProjects: 3,
  activeProjects: 2,
  completedProjects: 0,
  totalTodos: 5,
  completedTodos: 2,
  overdueTodos: 0,
  teamMembers: 5,
  recentActivity: [
    {
      id: '1',
      type: 'created',
      description: 'a créé le projet "Équipement Auto 2025"',
      userId: '1',
      user: mockUsers[0],
      relatedId: '1',
      relatedType: 'project',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      type: 'completed',
      description: 'a terminé la tâche "Migration Supabase"',
      userId: '2',
      user: mockUsers[1],
      relatedId: '1',
      relatedType: 'todo',
      createdAt: '2024-01-14T15:45:00Z'
    },
    {
      id: '3',
      type: 'commented',
      description: 'a commenté sur "Sélection des fournisseurs"',
      userId: '3',
      user: mockUsers[2],
      relatedId: '1',
      relatedType: 'project',
      createdAt: '2024-01-13T09:20:00Z'
    }
  ]
};
