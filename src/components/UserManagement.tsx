import React, { useState, useEffect } from 'react';
import { User, Team, UserStats } from '../types/user';
import { fetchUsers, createUser, deleteUser, fetchTeams, createTeam, fetchUserStats } from '../config/supabase-users';
import PasswordManagement from './PasswordManagement';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showPasswordManagement, setShowPasswordManagement] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newUser, setNewUser] = useState<{
    email: string;
    nom: string;
    prenom: string;
    roles: ('direction_generale' | 'direction_developpement' | 'administratif' | 'communication' | 'commercial' | 'adv')[];
    equipe: string;
    plateformesAutorisees: string[];
    regionCommerciale: string;
    actif: boolean;
  }>({
    email: '',
    nom: '',
    prenom: '',
    roles: [],
    equipe: '',
    plateformesAutorisees: [],
    regionCommerciale: '',
    actif: true
  });

  const [newTeam, setNewTeam] = useState({
    nom: '',
    description: '',
    responsable: '',
    couleur: '#3B82F6',
    actif: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, teamsData] = await Promise.all([
        fetchUsers(),
        fetchTeams()
      ]);
      setUsers(usersData);
      setTeams(teamsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 Tentative de création d\'utilisateur:', newUser);
    
    try {
      setLoading(true);
      
      // Création réelle dans Supabase
      const createdUser = await createUser({
        email: newUser.email,
        nom: newUser.nom,
        prenom: newUser.prenom,
        roles: newUser.roles,
        equipe: newUser.equipe || undefined,
        actif: newUser.actif,
        plateformesAutorisees: newUser.plateformesAutorisees,
        regionCommerciale: newUser.regionCommerciale || undefined
      });
      
      console.log('✅ Utilisateur créé dans Supabase:', createdUser);
      setUsers([...users, createdUser]);
      
      // Reset form
      setNewUser({
        email: '',
        nom: '',
        prenom: '',
        roles: [],
        equipe: '',
        plateformesAutorisees: [],
        regionCommerciale: '',
        actif: true
      });
      setShowUserForm(false);
      
      alert('✅ Utilisateur créé avec succès dans Supabase !');
    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'utilisateur:', error);
      alert(`❌ Erreur lors de la création de l'utilisateur: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const team = await createTeam({
        ...newTeam,
        membres: []
      });
      setTeams([...teams, team]);
      setNewTeam({
        nom: '',
        description: '',
        responsable: '',
        couleur: '#3B82F6',
        actif: true
      });
      setShowTeamForm(false);
    } catch (error) {
      console.error('Erreur lors de la création de l\'équipe:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    
    // Vérifier si l'utilisateur est manager d'une équipe
    const isManager = teams.some(team => team.responsable === userId);
    
    if (isManager) {
      alert('❌ Impossible de supprimer cet utilisateur car il est responsable d\'une équipe. Veuillez d\'abord réassigner l\'équipe à un autre manager.');
      return;
    }
    
    // Confirmation de suppression
    const confirmed = window.confirm(`Êtes-vous sûr de vouloir supprimer ${userToDelete?.prenom} ${userToDelete?.nom} ? Cette action est irréversible.`);
    if (!confirmed) {
      return;
    }
    
    try {
      await deleteUser(userId);
      await loadData();
      setSelectedUser(null);
      alert('Utilisateur supprimé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      alert('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const handleUserClick = async (user: User) => {
    setSelectedUser(user);
    try {
      const stats = await fetchUserStats(user.id);
      setUserStats(stats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'direction_generale': return 'bg-purple-100 text-purple-800';
      case 'direction_developpement': return 'bg-blue-100 text-blue-800';
      case 'administratif': return 'bg-gray-100 text-gray-800';
      case 'communication': return 'bg-pink-100 text-pink-800';
      case 'commercial': return 'bg-green-100 text-green-800';
      case 'adv': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">👥 Gestion des Utilisateurs</h2>
        <div className="space-x-2">
          <button
            onClick={() => setShowPasswordManagement(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
          >
            🔐 Mots de passe
          </button>
          <button
            onClick={() => setShowUserForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            ➕ Nouvel Utilisateur
          </button>
          <button
            onClick={() => setShowTeamForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            🏢 Nouvelle Équipe
          </button>
        </div>
      </div>

      {/* Explication des équipes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">🏢 À propos des équipes</h3>
        <p className="text-blue-800 text-sm">
          Les <strong>équipes</strong> permettent d'organiser vos utilisateurs par groupes de travail. 
          Chaque équipe peut avoir un responsable et regrouper plusieurs commerciaux. 
          Cela facilite la gestion des tâches et le suivi des performances par équipe.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des utilisateurs */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Utilisateurs ({users.length})</h3>
          <div className="space-y-3">
            {users.map(user => (
              <div
                key={user.id}
                onClick={() => handleUserClick(user)}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  selectedUser?.id === user.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getRoleIcon(user.roles[0] || 'commercial')}</div>
                    <div>
                      <h4 className="font-semibold">{user.prenom} {user.nom}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {user.roles.map((role, index) => (
                          <span key={index} className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role)}`}>  
                            {getRoleLabel(role)}
                          </span>
                        ))}
                        {user.equipe && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {user.equipe}
                          </span>
                        )}
                        {!user.actif && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            INACTIF
                          </span>
                        )}
                        {teams.some(team => team.responsable === user.id) && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            👑 MANAGER
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>Plateformes: {user.plateformesAutorisees?.length || 0}</div>
                    <div>Créé: {new Date(user.dateCreation).toLocaleDateString('fr-FR')}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Détails de l'utilisateur sélectionné */}
        <div className="lg:col-span-1">
          {selectedUser ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Détails de {selectedUser.prenom}</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Rôles</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedUser.roles.map((role, index) => (
                      <span key={index} className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role)}`}>
                        {getRoleLabel(role)}
                      </span>
                    ))}
                  </div>
                </div>
                
                {selectedUser.equipe && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Équipe</label>
                    <p className="text-sm text-gray-900">{selectedUser.equipe}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Plateformes</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedUser.plateformesAutorisees?.map(platform => (
                      <span key={platform} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {platform.toUpperCase()}
                      </span>
                    )) || <span className="text-gray-500 text-xs">Aucune plateforme</span>}
                  </div>
                </div>

                {userStats && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold mb-3 text-lg">📊 Statistiques de Performance</h4>
                    
                    {/* Métriques principales */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                        <div className="font-bold text-2xl text-blue-600">{userStats.totalTasks}</div>
                        <div className="text-sm text-blue-700 font-medium">Total tâches</div>
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                        <div className="font-bold text-2xl text-green-600">{userStats.completedTasks}</div>
                        <div className="text-sm text-green-700 font-medium">Terminées</div>
                      </div>
                      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-3 rounded-lg border border-yellow-200">
                        <div className="font-bold text-2xl text-yellow-600">{userStats.pendingTasks}</div>
                        <div className="text-sm text-yellow-700 font-medium">En cours</div>
                      </div>
                      <div className="bg-gradient-to-r from-red-50 to-red-100 p-3 rounded-lg border border-red-200">
                        <div className="font-bold text-2xl text-red-600">{userStats.overdueTasks}</div>
                        <div className="text-sm text-red-700 font-medium">En retard</div>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Taux de completion</span>
                        <span className="font-semibold text-gray-800">{userStats.completionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${userStats.completionRate}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Métriques avancées */}
                    <div className="grid grid-cols-1 gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Temps moyen de completion:</span>
                        <span className="font-semibold text-gray-800">{userStats.averageCompletionTime.toFixed(1)}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tâches cette semaine:</span>
                        <span className="font-semibold text-blue-600">{userStats.tasksThisWeek}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tâches ce mois:</span>
                        <span className="font-semibold text-purple-600">{userStats.tasksThisMonth}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Bouton de suppression */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {teams.some(team => team.responsable === selectedUser.id) ? (
                    <div className="text-center">
                      <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg text-sm">
                        👑 Cet utilisateur est responsable d'une équipe et ne peut pas être supprimé
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDeleteUser(selectedUser.id)}
                      className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      🗑️ Supprimer cet utilisateur
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
              <div className="text-4xl mb-2">👤</div>
              <div>Sélectionnez un utilisateur pour voir ses détails</div>
            </div>
          )}
        </div>
      </div>

      {/* Formulaire de création d'utilisateur */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">➕ Nouvel Utilisateur</h3>
            <form onSubmit={handleCreateUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                    <input
                      type="text"
                      value={newUser.prenom}
                      onChange={(e) => setNewUser({...newUser, prenom: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                    <input
                      type="text"
                      value={newUser.nom}
                      onChange={(e) => setNewUser({...newUser, nom: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rôles</label>
                  <div className="space-y-2">
                    {['direction_generale', 'direction_developpement', 'administratif', 'communication', 'commercial', 'adv'].map(role => (
                      <label key={role} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newUser.roles.includes(role as any)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewUser({...newUser, roles: [...newUser.roles, role as any]});
                            } else {
                              setNewUser({...newUser, roles: newUser.roles.filter(r => r !== role)});
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{getRoleIcon(role)} {getRoleLabel(role)}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plateformes autorisées</label>
                  <div className="space-y-2">
                    {['acr', 'dca', 'exadis', 'alliance'].map(platform => (
                      <label key={platform} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newUser.plateformesAutorisees.includes(platform)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewUser({
                                ...newUser,
                                plateformesAutorisees: [...newUser.plateformesAutorisees, platform]
                              });
                            } else {
                              setNewUser({
                                ...newUser,
                                plateformesAutorisees: newUser.plateformesAutorisees.filter(p => p !== platform)
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{platform.toUpperCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex-1"
                >
                  ✅ Créer
                </button>
                <button
                  type="button"
                  onClick={() => setShowUserForm(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  ❌ Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formulaire de création d'équipe */}
      {showTeamForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">🏢 Nouvelle Équipe</h3>
            <form onSubmit={handleCreateTeam}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'équipe</label>
                  <input
                    type="text"
                    value={newTeam.nom}
                    onChange={(e) => setNewTeam({...newTeam, nom: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                  <select
                    value={newTeam.responsable}
                    onChange={(e) => setNewTeam({...newTeam, responsable: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Sélectionner un responsable</option>
                    {users.filter(u => u.roles.includes('direction_generale') || u.roles.includes('direction_developpement')).map(user => (
                      <option key={user.id} value={user.id}>
                        {user.prenom} {user.nom}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                  <input
                    type="color"
                    value={newTeam.couleur}
                    onChange={(e) => setNewTeam({...newTeam, couleur: e.target.value})}
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex-1"
                >
                  ✅ Créer
                </button>
                <button
                  type="button"
                  onClick={() => setShowTeamForm(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  ❌ Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gestion des mots de passe */}
      {showPasswordManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">🔐 Gestion des mots de passe</h3>
              <button
                onClick={() => setShowPasswordManagement(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <PasswordManagement 
              users={users} 
              onUserUpdated={loadData}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
