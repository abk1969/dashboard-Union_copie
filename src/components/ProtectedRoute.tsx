import React, { useEffect, useState, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import OnboardingPage from './OnboardingPage';
import RealLoginPage from './RealLoginPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, isAuthenticated, loading, logout } = useUser();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingSkipped, setOnboardingSkipped] = useState(false);

  // Gérer l'affichage de l'onboarding
  useEffect(() => {
    if (isAuthenticated && currentUser && !onboardingSkipped) {
      // Nettoyer les anciennes clés de localStorage (migration)
      const userOnboardingKey = `lastLogin_${currentUser.email}`;
      localStorage.removeItem(userOnboardingKey);
      localStorage.removeItem('lastLogin'); // Ancienne clé globale
      
      // Afficher l'onboarding à chaque connexion
      setShowOnboarding(true);
    }
  }, [isAuthenticated, currentUser, onboardingSkipped]);

  // Fonction pour passer l'onboarding
  const handleSkipOnboarding = useCallback(() => {
    setShowOnboarding(false);
    setOnboardingSkipped(true);
  }, []);

  // Pour debug : forcer l'onboarding avec Ctrl+Shift+O
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'O' && currentUser) {
        setOnboardingSkipped(false);
        setShowOnboarding(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentUser]);

  // Afficher un loader pendant la vérification
  if (loading) {
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
    return <RealLoginPage />;
  }

  // Si authentifié, vérifier si on doit afficher l'onboarding
  if (showOnboarding && currentUser) {
    return (
      <OnboardingPage 
        userName={currentUser.prenom || 'Utilisateur'} 
        userEmail={currentUser.email || ''}
        onSkip={handleSkipOnboarding}
      />
    );
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
