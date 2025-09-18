import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/user';
import { simpleLogin, validateSession, simpleLogout } from '../config/simple-auth';

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
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
      
      const response = await simpleLogin(email, password);
      
      if (!response.success) {
        console.error('Erreur de connexion:', response.message);
        return false;
      }
      
      if (response.user) {
        setCurrentUser(response.user);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await simpleLogout();
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Déconnecter quand même localement
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
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
          setCurrentUser(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
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
    loading
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};