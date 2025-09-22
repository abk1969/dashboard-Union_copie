import React, { createContext, useContext, ReactNode } from 'react';

interface NavigationContextType {
  onNavigateToNotes?: () => void;
  onNavigateToReports?: () => void;
  onNavigateToDashboard?: () => void;
}

const NavigationContext = createContext<NavigationContextType>({});

interface NavigationProviderProps {
  children: ReactNode;
  onNavigateToNotes?: () => void;
  onNavigateToReports?: () => void;
  onNavigateToDashboard?: () => void;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
  onNavigateToNotes,
  onNavigateToReports,
  onNavigateToDashboard
}) => {
  return (
    <NavigationContext.Provider value={{
      onNavigateToNotes,
      onNavigateToReports,
      onNavigateToDashboard
    }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

