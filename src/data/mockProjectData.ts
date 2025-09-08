import { User, Project, TodoItem, ProjectStats } from '../types/projectTypes';

// Utilisateurs fictifs de l'équipe
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Martin Dubois',
    email: 'martin@union.com',
    role: 'admin',
    color: '#3B82F6',
    avatar: '👨‍💼'
  },
  {
    id: '2',
    name: 'Sophie Martin',
    email: 'sophie@union.com',
    role: 'member',
    color: '#EC4899',
    avatar: '👩‍💼'
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

// Projets fictifs
export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Équipement Auto 2025',
    description: 'Projet de renouvellement du parc automobile pour 2025',
    status: 'active',
    priority: 'high',
    progress: 65,
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    createdBy: '1',
    author: mockUsers[0],
    team: [
      { userId: '1', user: mockUsers[0], role: 'owner', joinedAt: '2024-01-01T00:00:00Z' },
      { userId: '2', user: mockUsers[1], role: 'admin', joinedAt: '2024-01-02T00:00:00Z' },
      { userId: '3', user: mockUsers[2], role: 'member', joinedAt: '2024-01-03T00:00:00Z' }
    ],
    todos: [],
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
    description: 'Migration des données Excel vers Supabase',
    status: 'active',
    priority: 'urgent',
    progress: 30,
    startDate: '2024-01-10',
    endDate: '2024-02-15',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-15T14:20:00Z',
    createdBy: '1',
    author: mockUsers[0],
    team: [
      { userId: '1', user: mockUsers[0], role: 'owner', joinedAt: '2024-01-10T00:00:00Z' },
      { userId: '4', user: mockUsers[3], role: 'admin', joinedAt: '2024-01-11T00:00:00Z' }
    ],
    todos: [],
    comments: [],
    reactions: [
      { id: '3', userId: '4', type: 'wow', createdAt: '2024-01-12T00:00:00Z' }
    ],
    attachments: [],
    tags: ['technique', 'supabase', 'migration'],
    color: '#10B981',
    isArchived: false
  },
  {
    id: '3',
    name: 'Formation Équipe',
    description: 'Session de formation sur le nouvel outil de gestion',
    status: 'planning',
    priority: 'medium',
    progress: 10,
    startDate: '2024-02-01',
    endDate: '2024-02-28',
    createdAt: '2024-01-12T00:00:00Z',
    updatedAt: '2024-01-15T09:15:00Z',
    createdBy: '2',
    author: mockUsers[1],
    team: [
      { userId: '2', user: mockUsers[1], role: 'owner', joinedAt: '2024-01-12T00:00:00Z' },
      { userId: '1', user: mockUsers[0], role: 'admin', joinedAt: '2024-01-12T00:00:00Z' },
      { userId: '3', user: mockUsers[2], role: 'member', joinedAt: '2024-01-13T00:00:00Z' },
      { userId: '4', user: mockUsers[3], role: 'member', joinedAt: '2024-01-13T00:00:00Z' }
    ],
    todos: [],
    comments: [],
    reactions: [],
    attachments: [],
    tags: ['formation', 'équipe', 'outil'],
    color: '#F59E0B',
    isArchived: false
  }
];

// To-Do items fictifs
export const mockTodos: TodoItem[] = [
  {
    id: '1',
    title: 'Analyser les besoins en véhicules',
    description: 'Faire un audit complet des véhicules actuels et définir les besoins pour 2025',
    status: 'in-progress',
    priority: 'high',
    assigneeId: '2',
    assignee: mockUsers[1],
    projectId: '1',
    dueDate: '2024-01-20',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    createdBy: '1',
    author: mockUsers[0],
    tags: ['analyse', 'véhicules', 'audit'],
    comments: [
      {
        id: '1',
        content: 'J\'ai commencé l\'audit, je devrais avoir les premiers résultats demain',
        authorId: '2',
        author: mockUsers[1],
        createdAt: '2024-01-14T15:30:00Z',
        updatedAt: '2024-01-14T15:30:00Z',
        reactions: [
          { id: '1', userId: '1', type: 'like', createdAt: '2024-01-14T16:00:00Z' }
        ]
      }
    ],
    reactions: [
      { id: '1', userId: '1', type: 'fire', createdAt: '2024-01-10T00:00:00Z' },
      { id: '2', userId: '3', type: 'like', createdAt: '2024-01-11T00:00:00Z' }
    ],
    attachments: [],
    isArchived: false
  },
  {
    id: '2',
    title: 'Créer la structure de la base de données',
    description: 'Définir les tables et relations pour la migration Supabase',
    status: 'done',
    priority: 'urgent',
    assigneeId: '4',
    assignee: mockUsers[3],
    projectId: '2',
    dueDate: '2024-01-15',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-15T14:20:00Z',
    createdBy: '1',
    author: mockUsers[0],
    tags: ['supabase', 'base-de-données', 'structure'],
    comments: [
      {
        id: '2',
        content: 'Structure créée avec succès ! Toutes les tables sont prêtes.',
        authorId: '4',
        author: mockUsers[3],
        createdAt: '2024-01-15T14:20:00Z',
        updatedAt: '2024-01-15T14:20:00Z',
        reactions: [
          { id: '3', userId: '1', type: 'fire', createdAt: '2024-01-15T14:25:00Z' },
          { id: '4', userId: '2', type: 'love', createdAt: '2024-01-15T14:30:00Z' }
        ]
      }
    ],
    reactions: [
      { id: '3', userId: '1', type: 'fire', createdAt: '2024-01-15T14:20:00Z' },
      { id: '4', userId: '2', type: 'love', createdAt: '2024-01-15T14:25:00Z' }
    ],
    attachments: [],
    isArchived: false
  },
  {
    id: '3',
    title: 'Préparer la présentation de formation',
    description: 'Créer les slides et supports pour la formation de l\'équipe',
    status: 'todo',
    priority: 'medium',
    assigneeId: '2',
    assignee: mockUsers[1],
    projectId: '3',
    dueDate: '2024-01-25',
    createdAt: '2024-01-12T00:00:00Z',
    updatedAt: '2024-01-15T09:15:00Z',
    createdBy: '2',
    author: mockUsers[1],
    tags: ['formation', 'présentation', 'slides'],
    comments: [],
    reactions: [],
    attachments: [],
    isArchived: false
  },
  {
    id: '4',
    title: 'Tester la migration des données',
    description: 'Effectuer des tests complets de la migration vers Supabase',
    status: 'in-progress',
    priority: 'high',
    assigneeId: '4',
    assignee: mockUsers[3],
    projectId: '2',
    dueDate: '2024-01-18',
    createdAt: '2024-01-12T00:00:00Z',
    updatedAt: '2024-01-15T16:45:00Z',
    createdBy: '1',
    author: mockUsers[0],
    tags: ['test', 'migration', 'supabase'],
    comments: [
      {
        id: '3',
        content: 'Les tests avancent bien, j\'ai trouvé quelques petits bugs à corriger',
        authorId: '4',
        author: mockUsers[3],
        createdAt: '2024-01-15T16:45:00Z',
        updatedAt: '2024-01-15T16:45:00Z',
        reactions: [
          { id: '5', userId: '1', type: 'like', createdAt: '2024-01-15T17:00:00Z' }
        ]
      }
    ],
    reactions: [
      { id: '5', userId: '1', type: 'like', createdAt: '2024-01-15T16:45:00Z' }
    ],
    attachments: [],
    isArchived: false
  }
];

// Statistiques fictives
export const mockProjectStats: ProjectStats = {
  totalProjects: 3,
  activeProjects: 2,
  completedProjects: 0,
  totalTodos: 4,
  completedTodos: 1,
  overdueTodos: 0,
  teamMembers: 5,
  recentActivity: [
    {
      id: '1',
      type: 'completed',
      description: 'Marie a terminé "Créer la structure de la base de données"',
      userId: '4',
      user: mockUsers[3],
      relatedId: '2',
      relatedType: 'todo',
      createdAt: '2024-01-15T14:20:00Z'
    },
    {
      id: '2',
      type: 'commented',
      description: 'Sophie a commenté "Analyser les besoins en véhicules"',
      userId: '2',
      user: mockUsers[1],
      relatedId: '1',
      relatedType: 'todo',
      createdAt: '2024-01-14T15:30:00Z'
    },
    {
      id: '3',
      type: 'reacted',
      description: 'Pierre a réagi avec 👍 à "Équipement Auto 2025"',
      userId: '3',
      user: mockUsers[2],
      relatedId: '1',
      relatedType: 'project',
      createdAt: '2024-01-11T00:00:00Z'
    }
  ]
};
