import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PlatformContextType {
  activePlatforms: string[];
  setActivePlatforms: (platforms: string[]) => void;
  filterMode: string;
  setFilterMode: (mode: string) => void;
  isFiltered: boolean;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

interface PlatformProviderProps {
  children: ReactNode;
}

export const PlatformProvider: React.FC<PlatformProviderProps> = ({ children }) => {
  const [activePlatforms, setActivePlatforms] = useState<string[]>(['acr', 'dca', 'exadis', 'alliance']);
  const [filterMode, setFilterMode] = useState<string>('all');

  // Charger les préférences depuis localStorage
  useEffect(() => {
    const savedPlatforms = localStorage.getItem('dashboard_active_platforms');
    const savedMode = localStorage.getItem('dashboard_filter_mode');
    
    if (savedPlatforms) {
      try {
        setActivePlatforms(JSON.parse(savedPlatforms));
      } catch {
        // Si erreur de parsing, garder les valeurs par défaut
      }
    }
    
    if (savedMode) {
      setFilterMode(savedMode);
    }
  }, []);

  // Sauvegarder les préférences dans localStorage
  useEffect(() => {
    localStorage.setItem('dashboard_active_platforms', JSON.stringify(activePlatforms));
    localStorage.setItem('dashboard_filter_mode', filterMode);
  }, [activePlatforms, filterMode]);

  const handleSetActivePlatforms = (platforms: string[]) => {
    setActivePlatforms(platforms);
    
    // Mettre à jour le mode automatiquement
    if (platforms.length === 4 && platforms.includes('acr') && platforms.includes('dca') && platforms.includes('exadis') && platforms.includes('alliance')) {
      setFilterMode('all');
    } else if (platforms.length === 1) {
      setFilterMode(platforms[0]);
    } else {
      setFilterMode('custom');
    }
  };

  const handleSetFilterMode = (mode: string) => {
    setFilterMode(mode);
    
    // Mettre à jour les plateformes selon le mode
    switch (mode) {
      case 'all':
        setActivePlatforms(['acr', 'dca', 'exadis', 'alliance']);
        break;
      case 'acr':
        setActivePlatforms(['acr']);
        break;
      case 'dca':
        setActivePlatforms(['dca']);
        break;
      case 'exadis':
        setActivePlatforms(['exadis']);
        break;
      case 'alliance':
        setActivePlatforms(['alliance']);
        break;
      // 'custom' garde les plateformes actuelles
    }
  };

  const isFiltered = filterMode !== 'all';

  return (
    <PlatformContext.Provider 
      value={{ 
        activePlatforms, 
        setActivePlatforms: handleSetActivePlatforms,
        filterMode,
        setFilterMode: handleSetFilterMode,
        isFiltered
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = () => {
  const context = useContext(PlatformContext);
  if (context === undefined) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
};
