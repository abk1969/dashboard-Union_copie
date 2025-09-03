import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, getUserFromToken } from '../config/securityPublic';

interface UserContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Récupérer l'utilisateur depuis le token au démarrage
  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      const user = getUserFromToken(authToken);
      if (user) {
        setCurrentUser(user);
      }
    }
  }, []);

  const isAdmin = currentUser?.role === 'admin' || false;

  const value: UserContextType = {
    currentUser,
    setCurrentUser,
    isAdmin,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
