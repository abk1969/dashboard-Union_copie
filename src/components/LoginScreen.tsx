import React, { useState } from 'react';
import Logo from './Logo';
import { authenticateUser, generateSecureToken, UserProfile } from '../config/securityPublic';
import { useUser } from '../contexts/UserContext';

interface LoginScreenProps {
  onLogin: (success: boolean, user?: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { setCurrentUser } = useUser();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

        try {
      // Simulation d'un délai de vérification
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Authentifier l'utilisateur avec le nouveau système
      const user = authenticateUser(credentials.username, credentials.password);
      
      if (user) {
        // Stocker le token d'authentification sécurisé
        const authToken = await generateSecureToken(user.username);
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('loginTime', Date.now().toString());

        // Mapper les rôles
        const mapRole = (role: string): 'direction_generale' | 'direction_developpement' | 'commercial' | 'administratif' | 'communication' | 'adv' => {
          switch (role) {
            case 'admin': return 'direction_generale';
            case 'alliance': return 'direction_developpement';
            case 'acr': return 'commercial';
            case 'dca': return 'commercial';
            case 'exadis': return 'commercial';
            default: return 'commercial';
          }
        };

        // Mettre à jour le contexte utilisateur
        const convertedUser = {
          id: '1',
          email: user.username + '@union.com',
          nom: user.displayName?.split(' ')[1] || 'Utilisateur',
          prenom: user.displayName?.split(' ')[0] || 'Utilisateur',
          roles: [mapRole(user.role)],
          equipe: 'Équipe Commerciale',
          actif: true,
          avatarUrl: user.theme?.logo || undefined,
          dateCreation: new Date().toISOString(),
          derniereConnexion: new Date().toISOString(),
          plateformesAutorisees: user.allowedPlatforms || ['Toutes'],
          regionCommerciale: 'Paris'
        };
        setCurrentUser(convertedUser);

        console.log('✅ Authentification réussie pour:', user.displayName);
        onLogin(true, user);
      } else {
        setError('❌ Identifiants incorrects. Veuillez réessayer.');
        console.error('❌ Tentative de connexion échouée avec:', credentials.username);
      }
    } catch (error) {
      setError('❌ Erreur lors de la connexion. Veuillez réessayer.');
      console.error('❌ Erreur authentification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
    // Effacer l'erreur quand l'utilisateur tape
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔐 Connexion Sécurisée
          </h1>
          <p className="text-gray-600">
            Accès protégé au Dashboard Union
          </p>
        </div>

        {/* Formulaire de connexion */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom d'utilisateur */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                👤 Nom d'utilisateur
              </label>
              <input
                id="username"
                type="text"
                value={credentials.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Entrez votre nom d'utilisateur"
                required
                autoComplete="username"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                🔒 Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Entrez votre mot de passe"
                required
                autoComplete="current-password"
              />
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={isLoading || !credentials.username || !credentials.password}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Connexion en cours...
                </>
              ) : (
                <>
                  🔓 Se connecter
                </>
              )}
            </button>
          </form>

          {/* Informations de sécurité */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-yellow-600 text-lg mr-2">⚠️</div>
                <div className="text-yellow-800 text-sm">
                  <p className="font-medium mb-1">Sécurité renforcée</p>
                  <p>Cette application contient des données sensibles. L'accès est strictement réservé aux membres autorisés du Groupement Union.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            © 2025 Groupement Union - Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
};
