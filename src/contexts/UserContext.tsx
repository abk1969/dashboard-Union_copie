import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/user';
import { validateSession } from '../config/simple-auth';
import { authenticateUser, generateSecureToken } from '../config/securityPublic';
import { UserService } from '../services/userService';

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  handleUserDeletion: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Authentification simple avec email/mot de passe
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const userProfile = authenticateUser(email, password);

      if (userProfile) {
        const token = await generateSecureToken(userProfile.username);
        localStorage.setItem('authToken', token);
        // La session sera validée par validateSession au rechargement
        // Pour une expérience utilisateur fluide, on peut pré-remplir le contexte
        const user: User = {
            id: userProfile.username,
            email: userProfile.username,
            nom: userProfile.displayName,
            prenom: '',
            roles: [userProfile.role] as any,
            equipe: '',
            actif: true,
            avatarUrl: userProfile.theme.logo,
            dateCreation: new Date().toISOString(),
            derniereConnexion: new Date().toISOString(),
            plateformesAutorisees: userProfile.allowedPlatforms,
            regionCommerciale: ''
        };
        setCurrentUser(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser'); // Nettoyer aussi l'ancien currentUser
  };

  const handleUserDeletion = () => {
    logout();
  };

  // Fonction pour normaliser l'utilisateur avec le service centralisé
  const normalizeUser = async (user: User): Promise<User> => {
    try {
      // Utiliser le service centralisé pour s'assurer de la cohérence
      const result = await UserService.getOrCreateUser({
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        roles: user.roles,
        isGoogleAuthenticated: user.isGoogleAuthenticated,
        googleId: (user as any).googleId,
        avatarUrl: user.avatarUrl
      });

      if (result.success && result.user) {
        console.log('✅ Utilisateur normalisé:', result.user.email);
        return result.user;
      }

      // En cas d'erreur, retourner l'utilisateur original
      console.warn('⚠️ Erreur normalisation utilisateur, utilisation des données originales');
      return user;
    } catch (error) {
      console.error('❌ Erreur normalisation utilisateur:', error);
      return user;
    }
  };

  // Charger l'utilisateur depuis la session au démarrage
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const { user, error } = await validateSession();
        
        if (error) {
          console.log('Aucune session valide:', error);
          localStorage.removeItem('currentUser');
        } else if (user) {
          // Normaliser l'utilisateur avec le service centralisé
          const normalizedUser = await normalizeUser(user);
          setCurrentUser(normalizedUser);
          localStorage.setItem('currentUser', JSON.stringify(normalizedUser));
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
        localStorage.removeItem('currentUser');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const value: UserContextType = {
    currentUser,
    setCurrentUser,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.roles?.includes('direction_generale') || false,
    login,
    logout,
    loading,
    handleUserDeletion
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};