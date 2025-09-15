import React, { createContext, useContext, useState, useMemo } from 'react';
import { AdherentData } from '../types';

interface RegionContextType {
  selectedRegion: string;
  setSelectedRegion: (region: string) => void;
  availableRegions: string[];
  setAvailableRegions: (regions: string[]) => void;
  isRegionFiltered: boolean;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

interface RegionProviderProps {
  children: React.ReactNode;
}

export const RegionProvider: React.FC<RegionProviderProps> = ({ children }) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);

  const isRegionFiltered = selectedRegion !== 'all';

  return (
    <RegionContext.Provider 
      value={{ 
        selectedRegion, 
        setSelectedRegion,
        availableRegions,
        setAvailableRegions,
        isRegionFiltered
      }}
    >
      {children}
    </RegionContext.Provider>
  );
};

export const useRegion = () => {
  const context = useContext(RegionContext);
  if (context === undefined) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
};

// Fonction utilitaire pour extraire les régions uniques des données
export const extractUniqueRegions = (data: AdherentData[]): string[] => {
  const regions = new Set<string>();
  
  data.forEach(item => {
    if (item.regionCommerciale && item.regionCommerciale.trim() !== '') {
      regions.add(item.regionCommerciale.trim());
    }
  });
  
  return Array.from(regions).sort();
};

// Fonction utilitaire pour filtrer les données par région
export const filterDataByRegion = (data: AdherentData[], selectedRegion: string): AdherentData[] => {
  if (selectedRegion === 'all') {
    return data;
  }
  
  return data.filter(item => 
    item.regionCommerciale && 
    item.regionCommerciale.trim() === selectedRegion
  );
};
