import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Calendar, Users, CheckCircle, Clock, AlertCircle, BarChart3, MessageSquare } from 'lucide-react';
import ProjectManagement from '../components/ProjectManagement';

interface Note {
  id: string;
  title: string;
  content: string;
  type: 'note' | 'todo' | 'project';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo?: string;
  dueDate?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  progress: number;
  startDate: string;
  endDate?: string;
  team: string[];
  tasks: Note[];
}

const NotesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'notes' | 'todos' | 'projects' | 'management'>('management');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Données fictives pour la démonstration
  const mockNotes: Note[] = [
    {
      id: '1',
      title: 'Réunion client Alliance',
      content: 'Préparer la présentation des KPI pour la réunion de demain',
      type: 'note',
      priority: 'high',
      status: 'pending',
      tags: ['client', 'alliance', 'kpi'],
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15'
    },
    {
      id: '2',
      title: 'Mise à jour base de données',
      content: 'Migrer les données Excel vers Supabase',
      type: 'todo',
      priority: 'high',
      status: 'in-progress',
      assignedTo: 'Martin',
      dueDate: '2024-01-20',
      tags: ['technique', 'supabase'],
      createdAt: '2024-01-10',
      updatedAt: '2024-01-15'
    },
    {
      id: '3',
      title: 'Formation équipe',
      content: 'Organiser une session de formation sur le nouvel outil',
      type: 'project',
      priority: 'medium',
      status: 'pending',
      assignedTo: 'Équipe',
      dueDate: '2024-02-01',
      tags: ['formation', 'équipe'],
      createdAt: '2024-01-12',
      updatedAt: '2024-01-12'
    }
  ];

  const mockProjects: Project[] = [
    {
      id: '1',
      name: 'Équipement Auto 2025',
      description: 'Projet de renouvellement du parc automobile',
      status: 'active',
      progress: 65,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      team: ['Martin', 'Sophie', 'Pierre'],
      tasks: mockNotes.filter(note => note.type === 'todo')
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending': return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredItems = mockNotes.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || item.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Retour au Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900">
                Gestion des Notes & Projets
              </h1>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'management', label: 'Gestion Avancée', count: 0, icon: <BarChart3 className="w-4 h-4" /> },
                { id: 'notes', label: 'Notes', count: mockNotes.filter(n => n.type === 'note').length, icon: <MessageSquare className="w-4 h-4" /> },
                { id: 'todos', label: 'To-Do', count: mockNotes.filter(n => n.type === 'todo').length, icon: <CheckCircle className="w-4 h-4" /> },
                { id: 'projects', label: 'Projets', count: mockProjects.length, icon: <Users className="w-4 h-4" /> }
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
                  <div className="flex items-center space-x-2">
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Filters */}
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
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes priorités</option>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Basse</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous statuts</option>
              <option value="pending">En attente</option>
              <option value="in-progress">En cours</option>
              <option value="completed">Terminé</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'management' && <ProjectManagement />}
        
        {activeTab !== 'management' && (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(item.priority)}`}>
                        {item.priority === 'high' ? 'Haute' : item.priority === 'medium' ? 'Moyenne' : 'Basse'}
                      </span>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(item.status)}
                        <span className="text-sm text-gray-600 capitalize">
                          {item.status === 'pending' ? 'En attente' : 
                           item.status === 'in-progress' ? 'En cours' : 'Terminé'}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-3">{item.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Créé le {new Date(item.createdAt).toLocaleDateString('fr-FR')}</span>
                      {item.assignedTo && (
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {item.assignedTo}
                        </span>
                      )}
                      {item.dueDate && (
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Échéance: {new Date(item.dueDate).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {item.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun élément trouvé
                </h3>
                <p className="text-gray-500">
                  Essayez de modifier vos critères de recherche ou créez un nouvel élément.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesPage;
