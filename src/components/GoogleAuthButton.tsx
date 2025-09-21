import React, { useState, useEffect } from 'react';
import { googleAuthService, redirectToGoogleAuth } from '../services/googleAuthService';

interface GoogleAuthButtonProps {
  onAuthSuccess?: () => void;
  onAuthError?: (error: string) => void;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({ 
  onAuthSuccess, 
  onAuthError 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà authentifié
    const checkAuth = () => {
      const authenticated = googleAuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        onAuthSuccess?.();
      }
    };

    checkAuth();
    
    // Vérifier périodiquement l'état d'authentification
    const interval = setInterval(checkAuth, 1000);
    
    return () => clearInterval(interval);
  }, [onAuthSuccess]);

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      redirectToGoogleAuth();
    } catch (error) {
      console.error('❌ Erreur authentification Google:', error);
      onAuthError?.('Erreur lors de la connexion à Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Nettoyer complètement le localStorage
    localStorage.clear();
    
    // Recharger la page pour forcer une nouvelle authentification
    window.location.reload();
  };

  if (isAuthenticated) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
              ✅
            </div>
            <div>
              <p className="text-green-800 font-medium">
                Connecté à Google
              </p>
              <p className="text-green-600 text-sm">
                Maurice peut analyser vos données
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="ml-4 px-3 py-1 text-xs font-medium text-red-600 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="text-center">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
          🤖
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          Connectez Maurice à Google
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          Pour analyser vos emails et calendrier, Maurice a besoin d'accéder à vos données Google.
        </p>
        
        <button
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
          ) : (
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          <span className="text-gray-700 font-medium">
            {isLoading ? 'Connexion...' : 'Se connecter avec Google'}
          </span>
        </button>
        
        <div className="mt-3 text-xs text-gray-500">
          <p>🔒 Vos données restent privées et sécurisées</p>
          <p>📧 Accès en lecture seule à Gmail et Calendar</p>
        </div>
      </div>
    </div>
  );
};

export default GoogleAuthButton;
