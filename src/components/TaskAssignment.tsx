import React, { useState, useEffect } from 'react';
import { TodoTask, TaskAssignment } from '../types';
import { User } from '../types/user';
import { fetchUsers } from '../config/supabase-users';

interface TaskAssignmentModalProps {
  task: TodoTask;
  onTaskUpdate: (task: TodoTask) => void;
  onClose: () => void;
}

const TaskAssignmentModal: React.FC<TaskAssignmentModalProps> = ({ task, onTaskUpdate, onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);

  useEffect(() => {
    loadUsers();
    loadAssignments();
  }, [task.id]);

  const loadUsers = async () => {
    try {
      const usersData = await fetchUsers();
      setUsers(usersData.filter(u => u.actif));
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      // Ici on devrait récupérer les assignations pour cette tâche
      // Pour l'instant, on simule avec des données vides
      setAssignments([]);
    } catch (error) {
      console.error('Erreur lors du chargement des assignations:', error);
    }
  };

  const handleAssignTask = async () => {
    if (!selectedUser) {
      console.log('❌ Aucun utilisateur sélectionné');
      return;
    }

    try {
      console.log('🔍 Tentative d\'assignation:', { taskId: task.id, userId: selectedUser });
      
      // Pour l'instant, on simule l'assignation sans Supabase
      const user = users.find(u => u.id === selectedUser);
      if (!user) {
        console.log('❌ Utilisateur non trouvé');
        return;
      }
      
      // Mettre à jour la tâche en base de données
      const { updateTask } = await import('../config/supabase-users');
      const updatedTask = await updateTask(task.id, {
        assignedTo: user.email,
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Tâche assignée et sauvegardée:', updatedTask);
      onTaskUpdate(updatedTask);
      onClose();
    } catch (error) {
      console.error('❌ Erreur lors de l\'assignation:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'direction_generale': return '👑';
      case 'direction_developpement': return '🚀';
      case 'administratif': return '📋';
      case 'communication': return '📢';
      case 'commercial': return '💼';
      case 'adv': return '⚖️';
      default: return '👤';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'direction_generale': return 'Direction Générale';
      case 'direction_developpement': return 'Direction Développement';
      case 'administratif': return 'Administratif';
      case 'communication': return 'Communication';
      case 'commercial': return 'Commercial';
      case 'adv': return 'ADV';
      default: return role;
    }
  };

  const getPriorityColor = (priority: TodoTask['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: TodoTask['category']) => {
    switch (category) {
      case 'prospection': return '🔍';
      case 'suivi': return '📞';
      case 'relance': return '⏰';
      case 'commercial': return '💼';
      case 'admin': return '📋';
      case 'other': return '📝';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">📋 Assigner la tâche</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Détails de la tâche */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{getCategoryIcon(task.category)}</span>
            <h4 className="font-semibold text-lg">{task.title}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
              {task.priority.toUpperCase()}
            </span>
          </div>
          
          {task.description && (
            <p className="text-gray-600 mb-2">{task.description}</p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>👤 {task.clientCode}</span>
            <span>📅 {new Date(task.createdAt).toLocaleDateString('fr-FR')}</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
              {task.category}
            </span>
          </div>
        </div>

        {/* Sélection de l'utilisateur */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assigner à un utilisateur
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Sélectionner un utilisateur</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {getRoleIcon(user.roles[0] || 'commercial')} {user.prenom} {user.nom} ({user.email}) - {user.roles.map(r => getRoleLabel(r)).join(', ')}
              </option>
            ))}
          </select>
        </div>

        {/* Informations sur l'utilisateur sélectionné */}
        {selectedUser && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            {(() => {
              const user = users.find(u => u.id === selectedUser);
              if (!user) return null;
              
              return (
                <div>
                  <h4 className="font-semibold mb-2">👤 {user.prenom} {user.nom}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <div className="font-medium">{user.email}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Rôle:</span>
                      <div className="font-medium flex flex-wrap gap-1">
                        {user.roles.map((role, index) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {getRoleLabel(role)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Équipe:</span>
                      <div className="font-medium">{user.equipe || 'Aucune'}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Plateformes:</span>
                      <div className="font-medium">
                        {user.plateformesAutorisees && user.plateformesAutorisees.length > 0 
                          ? user.plateformesAutorisees.join(', ') 
                          : 'Aucune'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Assignations existantes */}
        {assignments.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Assignations existantes</h4>
            <div className="space-y-2">
              {assignments.map(assignment => (
                <div key={assignment.taskId} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{assignment.userName}</span>
                      <span className="text-sm text-gray-600 ml-2">({assignment.userEmail})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        assignment.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                        assignment.status === 'declined' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {assignment.status === 'assigned' ? 'Assignée' :
                         assignment.status === 'accepted' ? 'Acceptée' :
                         assignment.status === 'declined' ? 'Refusée' :
                         'Terminée'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(assignment.assignedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-2">
          <button
            onClick={handleAssignTask}
            disabled={!selectedUser}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex-1"
          >
            ✅ Assigner la tâche
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            ❌ Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskAssignmentModal;
