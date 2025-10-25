import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/user';
import { validateSession, loginWithSupabase } from '../config/simple-auth';
import { generateSecureToken } from '../config/securityPublic';
import { decrypt } from '../utils/cryptoUtils';
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
    // TODO: Supprimer ce bypass avant la soumission
    if (email === 'admin' && password === 'GroupementUnion2025!') {
      console.log("Utilisation du bypass de connexion direct dans UserContext.");
      const mockUser: User = {
        id: 'admin@union.local',
        email: 'admin@union.local',
        nom: 'Admin Bypass',
        prenom: '',
        roles: ['admin'] as any,
        equipe: '',
        actif: true,
        avatarUrl: '',
        dateCreation: new Date().toISOString(),
        derniereConnexion: new Date().toISOString(),
        plateformesAutorisees: ['acr', 'dca', 'exadis', 'alliance'],
        regionCommerciale: ''
      };
      setCurrentUser(mockUser);
      // Simuler la création d'un token pour maintenir la session
      const token = await generateSecureToken('admin@union.local');
      localStorage.setItem('authToken', token);
      setLoading(false);
      return true;
    }

    try {
      setLoading(true);
      const userProfile = await loginWithSupabase(email, password);

      if (userProfile) {
        const token = await generateSecureToken(userProfile.username);
        localStorage.setItem('authToken', token);

        const user: User = {
            id: decrypt(userProfile.username), // L'ID est l'email déchiffré pour l'instant
            email: decrypt(userProfile.username),
            nom: decrypt(userProfile.displayName),
            prenom: '', // Ce champ n'est pas chiffré car vide
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

  // Charger l'utilisateur depuis la session au démarrage
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const { user, error } = await validateSession();
        
        if (error) {
          console.log('Aucune session valide:', error);
        } else if (user) {
          setCurrentUser(user);
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