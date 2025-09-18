import React, { useState } from 'react';
import { createUserWithPassword, updateUserPassword } from '../config/simple-auth';
import { User } from '../types/user';

interface PasswordManagementProps {
  users: User[];
  onUserUpdated: () => void;
}

const PasswordManagement: React.FC<PasswordManagementProps> = ({ users, onUserUpdated }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await updateUserPassword(selectedUser.id, newPassword);
      
      if (!result.success) {
        setMessage({ type: 'error', text: `Erreur: ${result.error}` });
      } else {
        setMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès' });
        setNewPassword('');
        setConfirmPassword('');
        onUserUpdated();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du mot de passe' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetPasswordForUser = async (userData: User, password: string) => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await updateUserPassword(userData.id, password);

      if (!result.success) {
        setMessage({ type: 'error', text: `Erreur: ${result.error}` });
      } else {
        setMessage({ type: 'success', text: 'Mot de passe défini avec succès' });
        onUserUpdated();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la définition du mot de passe' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        🔐 Gestion des mots de passe
      </h2>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Sélection d'utilisateur */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionner un utilisateur
          </label>
          <select
            value={selectedUser?.id || ''}
            onChange={(e) => {
              const user = users.find(u => u.id === e.target.value);
              setSelectedUser(user || null);
              setNewPassword('');
              setConfirmPassword('');
              setMessage(null);
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choisir un utilisateur...</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.prenom} {user.nom} ({user.email})
              </option>
            ))}
          </select>
        </div>

        {/* Formulaire de mot de passe */}
        {selectedUser && (
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Entrez le nouveau mot de passe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirmez le mot de passe"
                required
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null);
                  setNewPassword('');
                  setConfirmPassword('');
                  setMessage(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">📋 Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Sélectionnez un utilisateur dans la liste</li>
            <li>• Entrez un nouveau mot de passe (minimum 6 caractères)</li>
            <li>• Confirmez le mot de passe</li>
            <li>• Cliquez sur "Mettre à jour le mot de passe"</li>
          </ul>
        </div>

        {/* Liste des utilisateurs sans mot de passe */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Utilisateurs créés récemment
          </h3>
          <div className="space-y-2">
            {users.slice(0, 5).map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium">{user.prenom} {user.nom}</span>
                  <span className="text-gray-500 ml-2">({user.email})</span>
                </div>
                <button
                  onClick={() => {
                    const password = prompt(`Entrez le mot de passe pour ${user.prenom} ${user.nom}:`);
                    if (password) {
                      handleSetPasswordForUser(user, password);
                    }
                  }}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Définir mot de passe
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordManagement;
