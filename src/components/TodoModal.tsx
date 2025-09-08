import React, { useState } from 'react';
import { X, Calendar, Users, Heart, ThumbsUp, Flame, Smile, Star, Frown, AlertTriangle, Send, FileText, CheckCircle } from 'lucide-react';
import { TodoItem, User, Reaction } from '../types/projectTypes';

interface TodoModalProps {
  todo: TodoItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (todo: TodoItem) => void;
  onAddComment: (todoId: string, content: string) => void;
  users: User[];
  currentUserId: string;
  projects: any[];
}

const TodoModal: React.FC<TodoModalProps> = ({
  todo,
  isOpen,
  onClose,
  onUpdate,
  onAddComment,
  users,
  currentUserId,
  projects
}) => {
  const [commentContent, setCommentContent] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  if (!isOpen || !todo) return null;

  const handleReaction = (type: Reaction['type']) => {
    const newReaction = {
      id: Date.now().toString(),
      userId: currentUserId,
      type,
      createdAt: new Date().toISOString()
    };

    const updatedTodo = {
      ...todo,
      reactions: [...todo.reactions, newReaction]
    };
    onUpdate(updatedTodo);
  };

  const handleAddComment = () => {
    if (!commentContent.trim() || !todo) return;
    
    onAddComment(todo.id, commentContent);
    setCommentContent('');
    
    // Animation de validation
    setValidationMessage('💬 Commentaire ajouté !');
    setShowValidation(true);
    setTimeout(() => setShowValidation(false), 2000);
  };

  const handleStatusChange = (newStatus: TodoItem['status']) => {
    const updatedTodo = {
      ...todo,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };
    onUpdate(updatedTodo);
    
    // Animation de validation
    setValidationMessage(`✅ Statut mis à jour : ${newStatus}`);
    setShowValidation(true);
    setTimeout(() => setShowValidation(false), 2000);
  };

  const handlePriorityChange = (newPriority: TodoItem['priority']) => {
    const updatedTodo = {
      ...todo,
      priority: newPriority,
      updatedAt: new Date().toISOString()
    };
    onUpdate(updatedTodo);
    
    // Animation de validation
    setValidationMessage(`⚡ Priorité mise à jour : ${newPriority}`);
    setShowValidation(true);
    setTimeout(() => setShowValidation(false), 2000);
  };

  const handleAssigneeChange = (newAssigneeId: string) => {
    const newAssignee = users.find(u => u.id === newAssigneeId);
    if (!newAssignee) return;

    const updatedTodo = {
      ...todo,
      assigneeId: newAssigneeId,
      assignee: newAssignee,
      updatedAt: new Date().toISOString()
    };
    onUpdate(updatedTodo);
    
    // Animation de validation
    setValidationMessage(`👤 Assigné à : ${newAssignee.name}`);
    setShowValidation(true);
    setTimeout(() => setShowValidation(false), 2000);
  };


  const reactionTypes: { type: Reaction['type']; icon: React.ReactNode; color: string; bgColor: string }[] = [
    { type: 'like', icon: <ThumbsUp className="w-4 h-4" />, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { type: 'love', icon: <Heart className="w-4 h-4" />, color: 'text-red-600', bgColor: 'bg-red-50' },
    { type: 'fire', icon: <Flame className="w-4 h-4" />, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { type: 'laugh', icon: <Smile className="w-4 h-4" />, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { type: 'wow', icon: <Star className="w-4 h-4" />, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { type: 'sad', icon: <Frown className="w-4 h-4" />, color: 'text-gray-600', bgColor: 'bg-gray-50' },
    { type: 'angry', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-700', bgColor: 'bg-red-100' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-slideInUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{todo.title}</h2>
                <p className="text-green-100">{todo.description}</p>
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
          {/* Actions rapides */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <select
                  value={todo.status}
                  onChange={(e) => handleStatusChange(e.target.value as TodoItem['status'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="todo">À faire</option>
                  <option value="in-progress">En cours</option>
                  <option value="review">En révision</option>
                  <option value="done">Terminé</option>
                </select>
              </div>

              {/* Priorité */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
                <select
                  value={todo.priority}
                  onChange={(e) => handlePriorityChange(e.target.value as TodoItem['priority'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              {/* Assigné à */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigné à</label>
                <select
                  value={todo.assigneeId || ''}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Non assigné</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Informations détaillées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Date de création</p>
                  <p className="font-medium">{new Date(todo.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              {todo.dueDate && (
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Échéance</p>
                    <p className="font-medium">{new Date(todo.dueDate).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {todo.assignee && (
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Assigné à</p>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                        style={{ backgroundColor: todo.assignee.color + '20' }}
                      >
                        {todo.assignee.avatar}
                      </div>
                      <p className="font-medium">{todo.assignee.name}</p>
                    </div>
                  </div>
                </div>
              )}
              {todo.projectId && (
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Projet</p>
                    <p className="font-medium">
                      {projects.find(p => p.id === todo.projectId)?.name || 'Projet inconnu'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {todo.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {todo.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Réactions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Réactions</h3>
            <div className="flex flex-wrap gap-2">
              {reactionTypes.map(({ type, icon, color, bgColor }) => {
                const count = todo.reactions.filter(r => r.type === type).length;
                const hasReacted = todo.reactions.some(r => r.type === type && r.userId === currentUserId);
                
                return (
                  <button
                    key={type}
                    onClick={() => handleReaction(type)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm transition-all duration-200 ${
                      hasReacted 
                        ? `${color} ${bgColor} shadow-md` 
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {icon}
                    {count > 0 && <span className="font-medium">{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Commentaires */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Commentaires</h3>
            
            {/* Ajouter un commentaire */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex space-x-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                  style={{ backgroundColor: users.find(u => u.id === currentUserId)?.color + '20' }}
                >
                  {users.find(u => u.id === currentUserId)?.avatar}
                </div>
                <div className="flex-1">
                  <textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setCommentContent('')}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Effacer
                    </button>
                    <button
                      onClick={handleAddComment}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Send className="w-4 h-4" />
                      <span>Valider</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des commentaires */}
            <div className="space-y-4">
              {todo.comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3 p-4 bg-white border border-gray-200 rounded-lg">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{ backgroundColor: comment.author.color + '20' }}
                  >
                    {comment.author.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900">{comment.author.name}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.createdAt).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                    {comment.reactions.length > 0 && (
                      <div className="flex space-x-2 mt-2">
                        {comment.reactions.map((reaction) => (
                          <span key={reaction.id} className="text-sm">
                            {reactionTypes.find(rt => rt.type === reaction.type)?.icon}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Animation de validation */}
        {showValidation && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounceIn z-50">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{validationMessage}</span>
            </div>
          </div>
        )}

        {/* Bouton Valider pour fermer le modal */}
        <div className="flex justify-end p-6 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Valider & Fermer</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodoModal;
