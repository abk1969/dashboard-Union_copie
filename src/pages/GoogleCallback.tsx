import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import { handleGoogleCallback, GoogleUser } from '../services/googleAuthService';
import { generateUUIDFromEmail } from '../utils/uuidGenerator';

const GoogleCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [user, setUser] = useState<GoogleUser | null>(null);
  // const navigate = useNavigate();

  useEffect(() => {
    const processCallback = async () => {
      try {
        setStatus('loading');
        
        // Debug: Afficher l'URL actuelle
        console.log('🔍 URL actuelle:', window.location.href);
        console.log('🔍 Paramètres URL:', window.location.search);
        
        const googleUser = await handleGoogleCallback();
        
        console.log('🔍 Utilisateur Google:', googleUser);
        
        if (googleUser) {
          setUser(googleUser);
          setStatus('success');
          
          // Stocker les données Google dans localStorage pour synchronisation
          const userData = {
            id: generateUUIDFromEmail(googleUser.email), // UUID cohérent basé uniquement sur l'email
            email: googleUser.email,
            nom: googleUser.name.split(' ').slice(1).join(' ') || 'Google', // Nom de famille
            prenom: googleUser.name.split(' ')[0] || 'Utilisateur', // Prénom
            roles: ['direction_generale'],
            equipe: 'Direction',
            actif: true,
            avatarUrl: googleUser.picture,
            dateCreation: new Date().toISOString(),
            derniereConnexion: new Date().toISOString(),
            plateformesAutorisees: ['alliance'],
            regionCommerciale: 'France',
            isGoogleAuthenticated: true,
            googleAccessToken: googleUser.accessToken,
            googleRefreshToken: googleUser.refreshToken,
            googleId: googleUser.id // Stocker l'ID Google original pour la migration
          };
          
          // Nettoyer l'ancien localStorage pour éviter les conflits d'ID
          localStorage.removeItem('authToken');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('loginTime');
          localStorage.removeItem('googleAuthenticated');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('sessionToken');
          
          // Stocker dans localStorage pour persistance
          localStorage.setItem('authToken', googleUser.accessToken);
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('loginTime', Date.now().toString());
          localStorage.setItem('googleAuthenticated', 'true');
          localStorage.setItem('currentUser', JSON.stringify(userData));
          localStorage.setItem('sessionToken', googleUser.accessToken);
          
          console.log('✅ Utilisateur Google connecté et synchronisé:', userData);
          
          // Rediriger vers l'onboarding après 2 secondes
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        } else {
          console.error('❌ Aucun utilisateur Google retourné');
          setStatus('error');
        }
      } catch (error) {
        console.error('❌ Erreur callback Google:', error);
        setStatus('error');
      }
    };

    processCallback();
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            🤖
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Maurice se connecte...
          </h2>
          <p className="text-gray-600 mb-4">
            Authentification en cours avec Google
          </p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success' && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            ✅
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Connexion réussie !
          </h2>
          <p className="text-gray-600 mb-4">
            Bonjour {user.name} ! Maurice peut maintenant analyser vos données.
          </p>
          <div className="bg-green-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-green-700">
              🔒 Vos données sont sécurisées et privées
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Redirection vers l'onboarding...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
          ❌
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Erreur de connexion
        </h2>
        <p className="text-gray-600 mb-4">
          Impossible de se connecter à Google. Veuillez réessayer.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
};

export default GoogleCallback;
