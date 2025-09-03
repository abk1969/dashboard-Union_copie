import React, { useEffect, useState, useCallback } from 'react';
import { LoginScreen } from './LoginScreen';
import { isTokenExpired, getUserFromToken, UserProfile } from '../config/securityPublic';
import { useUser } from '../contexts/UserContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { setCurrentUser } = useUser();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthentication = useCallback(() => {
    try {
      const authToken = localStorage.getItem('authToken');
      const isAuth = localStorage.getItem('isAuthenticated');

      if (authToken && isAuth === 'true') {
        // Vérifier si le token n'a pas expiré
        if (!isTokenExpired(authToken)) {
          // Récupérer et définir l'utilisateur actuel
          const user = getUserFromToken(authToken);
          if (user) {
            setCurrentUser(user);
            setIsAuthenticated(true);
          } else {
            console.log('❌ Utilisateur non trouvé pour le token');
            logout();
          }
        } else {
          // Token expiré, déconnecter l'utilisateur
          console.log('⏰ Token expiré, déconnexion automatique');
          logout();
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de l\'authentification:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAuthenticated');
    setCurrentUser(null);
    setIsAuthenticated(false);
    console.log('🔒 Utilisateur déconnecté');
  };

  const handleLogin = (success: boolean, user?: UserProfile) => {
    if (success && user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
  };

  // Afficher un loader pendant la vérification
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">🔐 Vérification de la sécurité...</p>
        </div>
      </div>
    );
  }

  // Si non authentifié, afficher l'écran de connexion
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Si authentifié, afficher l'application avec un bouton de déconnexion
  return (
    <div className="relative">
      {/* Bouton de déconnexion flottant */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 shadow-lg"
          title="Se déconnecter"
        >
          🚪 Déconnexion
        </button>
      </div>

      {/* Contenu de l'application */}
      {children}
    </div>
  );
};
