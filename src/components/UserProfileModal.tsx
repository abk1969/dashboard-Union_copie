import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import UserPhotoUpload from './UserPhotoUpload';
import { deleteUser } from '../config/simple-auth';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, setCurrentUser, handleUserDeletion } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    equipe: '',
    regionCommerciale: ''
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        prenom: currentUser.prenom || '',
        nom: currentUser.nom || '',
        email: currentUser.email || '',
        equipe: currentUser.equipe || '',
        regionCommerciale: currentUser.regionCommerciale || ''
      });
    }
  }, [currentUser]);

  const handleSave = () => {
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        ...formData
      };
      setCurrentUser(updatedUser);

      // Sauvegarder dans localStorage
      localStorage.setItem('userProfile', JSON.stringify(updatedUser));

      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (currentUser) {
      setFormData({
        prenom: currentUser.prenom || '',
        nom: currentUser.nom || '',
        email: currentUser.email || '',
        equipe: currentUser.equipe || '',
        regionCommerciale: currentUser.regionCommerciale || ''
      });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (currentUser && window.confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      const { success, error } = await deleteUser(currentUser.id);
      if (success) {
        alert('Compte supprimé avec succès.');
        handleUserDeletion();
        onClose();
      } else {
        alert(`Erreur lors de la suppression du compte : ${error}`);
      }
    }
  };

  if (!isOpen || !currentUser) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Mon Profil</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Photo de profil */}
          <div className="flex flex-col items-center space-y-4">
            <UserPhotoUpload size="lg" />
            <p className="text-sm text-gray-600 text-center">
              Cliquez sur "Changer" pour modifier votre photo de profil
            </p>
          </div>

          {/* Informations utilisateur */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{currentUser.prenom}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{currentUser.nom}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="text-gray-900 font-medium">{currentUser.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Équipe
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.equipe}
                  onChange={(e) => setFormData({...formData, equipe: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              ) : (
                <p className="text-gray-900 font-medium">{currentUser.equipe || 'Non spécifiée'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Région Commerciale
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.regionCommerciale}
                  onChange={(e) => setFormData({...formData, regionCommerciale: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              ) : (
                <p className="text-gray-900 font-medium">{currentUser.regionCommerciale || 'Non spécifiée'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rôle
              </label>
              <p className="text-gray-900 font-medium">{currentUser.roles?.[0] || 'Utilisateur'}</p>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              Supprimer mon compte
            </button>
            <div className="flex space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
                  >
                    Sauvegarder
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
                >
                  Modifier le profil
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
