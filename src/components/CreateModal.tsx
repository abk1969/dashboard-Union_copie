import React, { useState } from 'react';
import { X, Plus, Target, CheckCircle, Zap } from 'lucide-react';
import { Project, TodoItem, User } from '../types/projectTypes';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'team' | 'todos' | 'comments' | 'reactions' | 'attachments'>) => void;
  onCreateTodo: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'assignee' | 'comments' | 'reactions' | 'attachments'>) => void;
  users: User[];
  currentUserId: string;
  projects: Project[];
}

const CreateModal: React.FC<CreateModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
  onCreateTodo,
  users,
  currentUserId,
  projects
}) => {
  const [activeType, setActiveType] = useState<'project' | 'todo'>('project');
  const [formData, setFormData] = useState({
    // Projet
    name: '',
    description: '',
    status: 'planning' as const,
    priority: 'medium' as const,
    startDate: '',
    endDate: '',
    color: '#3B82F6',
    tags: [] as string[],
    
    // Todo
    title: '',
    todoDescription: '',
    todoStatus: 'todo' as const,
    todoPriority: 'medium' as const,
    assigneeId: '',
    projectId: '',
    dueDate: '',
    todoTags: [] as string[]
  });

  const [newTag, setNewTag] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeType === 'project') {
      onCreateProject({
        name: formData.name,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        progress: 0,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        createdBy: currentUserId,
        color: formData.color,
        tags: formData.tags,
        isArchived: false
      });
    } else {
      onCreateTodo({
        title: formData.title,
        description: formData.todoDescription,
        status: formData.todoStatus,
        priority: formData.todoPriority,
        assigneeId: formData.assigneeId || undefined,
        projectId: formData.projectId || undefined,
        dueDate: formData.dueDate || undefined,
        createdBy: currentUserId,
        tags: formData.todoTags,
        isArchived: false
      });
    }
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      status: 'planning',
      priority: 'medium',
      startDate: '',
      endDate: '',
      color: '#3B82F6',
      tags: [],
      title: '',
      todoDescription: '',
      todoStatus: 'todo',
      todoPriority: 'medium',
      assigneeId: '',
      projectId: '',
      dueDate: '',
      todoTags: []
    });
    onClose();
  };

  const addTag = (tagList: string[], setTagList: (tags: string[]) => void) => {
    if (newTag.trim() && !tagList.includes(newTag.trim())) {
      setTagList([...tagList, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string, tagList: string[], setTagList: (tags: string[]) => void) => {
    setTagList(tagList.filter(t => t !== tag));
  };

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Créer un nouvel élément</h2>
                <p className="text-purple-100">Ajoutez un projet ou une tâche à votre équipe</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Type selector */}
          <div className="mb-6">
            <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setActiveType('project')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-all ${
                  activeType === 'project'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Target className="w-5 h-5" />
                <span>Projet</span>
              </button>
              <button
                onClick={() => setActiveType('todo')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-all ${
                  activeType === 'todo'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                <span>Tâche</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {activeType === 'project' ? (
              <>
                {/* Nom du projet */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du projet *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ex: Migration Supabase"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Décrivez les objectifs du projet..."
                  />
                </div>

                {/* Statut et Priorité */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="planning">Planification</option>
                      <option value="active">Actif</option>
                      <option value="on-hold">En pause</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="low">Basse</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Haute</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de début *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Couleur */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
                  <div className="flex space-x-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color ? 'border-gray-400' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(formData.tags, (tags) => setFormData({ ...formData, tags })))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ajouter un tag..."
                    />
                    <button
                      type="button"
                      onClick={() => addTag(formData.tags, (tags) => setFormData({ ...formData, tags }))}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full flex items-center space-x-2"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag, formData.tags, (tags) => setFormData({ ...formData, tags }))}
                          className="hover:text-purple-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Titre de la tâche */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre de la tâche *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ex: Créer la structure de la base de données"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.todoDescription}
                    onChange={(e) => setFormData({ ...formData, todoDescription: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Décrivez la tâche en détail..."
                  />
                </div>

                {/* Statut, Priorité et Assignation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                    <select
                      value={formData.todoStatus}
                      onChange={(e) => setFormData({ ...formData, todoStatus: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="todo">À faire</option>
                      <option value="in-progress">En cours</option>
                      <option value="review">En révision</option>
                      <option value="done">Terminé</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
                    <select
                      value={formData.todoPriority}
                      onChange={(e) => setFormData({ ...formData, todoPriority: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="low">Basse</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Haute</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assigné à</label>
                    <select
                      value={formData.assigneeId}
                      onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Non assigné</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Projet et Date d'échéance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Projet</label>
                    <select
                      value={formData.projectId}
                      onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Aucun projet</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date d'échéance
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(formData.todoTags, (tags) => setFormData({ ...formData, todoTags: tags })))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ajouter un tag..."
                    />
                    <button
                      type="button"
                      onClick={() => addTag(formData.todoTags, (tags) => setFormData({ ...formData, todoTags: tags }))}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.todoTags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full flex items-center space-x-2"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag, formData.todoTags, (tags) => setFormData({ ...formData, todoTags: tags }))}
                          className="hover:text-green-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Boutons d'action */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors hover:bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <X className="w-4 h-4" />
                  <span>Fermer</span>
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Zap className="w-4 h-4" />
                  <span>Créer {activeType === 'project' ? 'le projet' : 'la tâche'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateModal;
