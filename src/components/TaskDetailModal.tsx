import React, { useState } from 'react';
import { TodoTask } from '../types';
import { updateTask, deleteTask } from '../config/supabase-users';

interface TaskDetailModalProps {
  task: TodoTask | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
  onTaskDeleted: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onTaskUpdated,
  onTaskDeleted
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    category: 'commercial' as 'prospection' | 'suivi' | 'relance' | 'commercial' | 'admin' | 'other',
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
    dueDate: '',
    tags: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  // Initialiser les données d'édition quand la tâche change
  React.useEffect(() => {
    if (task) {
      setEditData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        category: task.category,
        status: task.status,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        tags: task.tags ? task.tags.join(', ') : '',
        notes: task.notes || ''
      });
    }
  }, [task]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'prospection': return '🔍';
      case 'suivi': return '📞';
      case 'relance': return '⏰';
      case 'commercial': return '💼';
      case 'admin': return '📋';
      default: return '📝';
    }
  };

  const handleSave = async () => {
    if (!task) return;

    setLoading(true);
    try {
      const updatedTask = {
        ...task,
        title: editData.title,
        description: editData.description,
        priority: editData.priority,
        category: editData.category,
        status: editData.status,
        dueDate: editData.dueDate || undefined,
        tags: editData.tags ? editData.tags.split(',').map(tag => tag.trim()) : [],
        notes: editData.notes
      };

      await updateTask(task.id, updatedTask);
      setIsEditing(false);
      onTaskUpdated();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;

    setLoading(true);
    try {
      await deleteTask(task.id);
      onTaskDeleted();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la suppression de la tâche:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getCategoryIcon(task.category)}</span>
            <h2 className="text-xl font-bold text-gray-900">
              {isEditing ? 'Modifier la tâche' : 'Détails de la tâche'}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ✏️ Modifier
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isEditing ? (
            /* Mode édition */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({...editData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priorité
                  </label>
                  <select
                    value={editData.priority}
                    onChange={(e) => setEditData({...editData, priority: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">🟢 Basse</option>
                    <option value="medium">🟡 Normale</option>
                    <option value="high">🟠 Haute</option>
                    <option value="urgent">🔴 Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({...editData, status: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">⏳ En attente</option>
                    <option value="in_progress">🔄 En cours</option>
                    <option value="completed">✅ Terminée</option>
                    <option value="cancelled">❌ Annulée</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={editData.category}
                  onChange={(e) => setEditData({...editData, category: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="prospection">🔍 Prospection</option>
                  <option value="suivi">📞 Suivi</option>
                  <option value="relance">⏰ Relance</option>
                  <option value="commercial">💼 Commercial</option>
                  <option value="admin">📋 Administratif</option>
                  <option value="other">📝 Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d'échéance
                </label>
                <input
                  type="date"
                  value={editData.dueDate}
                  onChange={(e) => setEditData({...editData, dueDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({...editData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={editData.tags}
                  onChange={(e) => setEditData({...editData, tags: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="urgent, client-important, relance"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes internes
                </label>
                <textarea
                  value={editData.notes}
                  onChange={(e) => setEditData({...editData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Notes personnelles sur cette tâche..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          ) : (
            /* Mode lecture */
            <div className="space-y-6">
              {/* En-tête de la tâche */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{task.title}</h3>
                  <div className="flex items-center space-x-2 mb-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                      {task.priority.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {task.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-800 whitespace-pre-wrap">{task.description}</p>
                  </div>
                </div>
              )}

              {/* Notes internes */}
              {task.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Notes internes</h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-800 whitespace-pre-wrap">{task.notes}</p>
                  </div>
                </div>
              )}

              {/* Informations détaillées */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Catégorie</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getCategoryIcon(task.category)}</span>
                    <span className="text-gray-800 capitalize">{task.category}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Assigné à</h4>
                  <p className="text-gray-800">{task.assignedTo || 'Non assigné'}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Date de création</h4>
                  <p className="text-gray-800">{new Date(task.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Dernière mise à jour</h4>
                  <p className="text-gray-800">{new Date(task.updatedAt).toLocaleDateString('fr-FR')}</p>
                </div>

                {task.dueDate && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Date d'échéance</h4>
                    <p className="text-gray-800">{new Date(task.dueDate).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}

                {task.completedAt && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Date de completion</h4>
                    <p className="text-gray-800">{new Date(task.completedAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
              </div>

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-red-600 hover:text-red-800 transition-colors"
                  disabled={loading}
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;

