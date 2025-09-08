import React, { useState } from 'react';
import { X, Users, Calendar, Target, MessageSquare, Heart, ThumbsUp, Flame, Smile, Star, Frown, AlertTriangle, Send, UserPlus, CheckCircle } from 'lucide-react';
import { Project, User, Reaction } from '../types/projectTypes';

interface ProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (project: Project) => void;
  onAddComment: (projectId: string, content: string) => void;
  onAddParticipant: (projectId: string, userId: string) => void;
  onRemoveParticipant: (projectId: string, userId: string) => void;
  users: User[];
  currentUserId: string;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  isOpen,
  onClose,
  onUpdate,
  onAddComment,
  onAddParticipant,
  onRemoveParticipant,
  users,
  currentUserId
}) => {
  const [commentContent, setCommentContent] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  if (!isOpen || !project) return null;

  const handleReaction = (type: Reaction['type']) => {
    const newReaction = {
      id: Date.now().toString(),
      userId: currentUserId,
      type,
      createdAt: new Date().toISOString()
    };

    const updatedProject = {
      ...project,
      reactions: [...project.reactions, newReaction]
    };
    onUpdate(updatedProject);
  };

  const handleAddComment = () => {
    if (!commentContent.trim() || !project) return;
    
    onAddComment(project.id, commentContent);
    setCommentContent('');
    
    // Animation de validation
    setValidationMessage('💬 Commentaire ajouté !');
    setShowValidation(true);
    setTimeout(() => setShowValidation(false), 2000);
  };

  const handleAddMember = () => {
    if (!newMemberId || !project) return;
    
    const user = users.find(u => u.id === newMemberId);
    onAddParticipant(project.id, newMemberId);
    setNewMemberId('');
    setShowAddMember(false);
    
    // Animation de validation
    setValidationMessage(`👥 ${user?.name} ajouté au projet !`);
    setShowValidation(true);
    setTimeout(() => setShowValidation(false), 2000);
  };

  const handleRemoveMember = (userId: string) => {
    if (!project) return;
    
    const user = users.find(u => u.id === userId);
    onRemoveParticipant(project.id, userId);
    
    // Animation de validation
    setValidationMessage(`👋 ${user?.name} retiré du projet`);
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
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-slideInUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{project.name}</h2>
                <p className="text-blue-100">{project.description}</p>
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
          {/* Progression */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progression</span>
              <span className="text-sm font-bold text-blue-600">{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
          </div>

          {/* Informations du projet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Date de début</p>
                  <p className="font-medium">{new Date(project.startDate).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              {project.endDate && (
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Date de fin</p>
                    <p className="font-medium">{new Date(project.endDate).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Équipe</p>
                  <p className="font-medium">{project.team.length} membres</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Commentaires</p>
                  <p className="font-medium">{project.comments.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Équipe */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Équipe</h3>
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Ajouter</span>
              </button>
            </div>
            
            {showAddMember && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex space-x-2">
                  <select
                    value={newMemberId}
                    onChange={(e) => setNewMemberId(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un membre</option>
                    {users.filter(u => !project.team.some(m => m.userId === u.id)).map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddMember}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Valider</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {project.team.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{ backgroundColor: member.user.color + '20' }}
                  >
                    {member.user.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{member.user.name}</p>
                    <p className="text-sm text-gray-500 capitalize">{member.role}</p>
                  </div>
                  {member.userId !== currentUserId && (
                    <button
                      onClick={() => handleRemoveMember(member.userId)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                      title="Retirer du projet"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {project.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
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
                const count = project.reactions.filter(r => r.type === type).length;
                const hasReacted = project.reactions.some(r => r.type === type && r.userId === currentUserId);
                
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
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
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
              {project.comments.map((comment) => (
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

export default ProjectModal;
