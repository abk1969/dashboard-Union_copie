// Types pour le système de gestion de projets et to-do

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'member' | 'viewer';
  color: string;
}

export interface Reaction {
  id: string;
  userId: string;
  type: 'like' | 'love' | 'fire' | 'laugh' | 'wow' | 'sad' | 'angry';
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author: User;
  createdAt: string;
  updatedAt: string;
  reactions: Reaction[];
  parentId?: string; // Pour les réponses
}

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  assignee?: User;
  projectId?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  author: User;
  tags: string[];
  comments: Comment[];
  reactions: Reaction[];
  attachments: Attachment[];
  isArchived: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number; // 0-100
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  author: User;
  team: ProjectMember[];
  todos: TodoItem[];
  comments: Comment[];
  reactions: Reaction[];
  attachments: Attachment[];
  tags: string[];
  color: string;
  isArchived: boolean;
}

export interface ProjectMember {
  userId: string;
  user: User;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'video' | 'audio' | 'other';
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Notification {
  id: string;
  type: 'mention' | 'assignment' | 'comment' | 'reaction' | 'due-date' | 'project-update';
  title: string;
  message: string;
  userId: string;
  relatedId: string; // ID du todo ou projet
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTodos: number;
  completedTodos: number;
  overdueTodos: number;
  teamMembers: number;
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  type: 'created' | 'updated' | 'completed' | 'commented' | 'reacted' | 'assigned';
  description: string;
  userId: string;
  user: User;
  relatedId: string;
  relatedType: 'project' | 'todo';
  createdAt: string;
  metadata?: Record<string, any>;
}
