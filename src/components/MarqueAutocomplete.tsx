import React, { useState, useMemo } from 'react';
import AutocompleteInput from './AutocompleteInput';
import { AdherentData } from '../types';

interface MarqueAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (marque: string) => void;
  adherentData: AdherentData[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MarqueAutocomplete: React.FC<MarqueAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  adherentData,
  placeholder = "Rechercher une marque...",
  className = "",
  disabled = false
}) => {
  // Extraire toutes les marques uniques avec leurs statistiques
  const marquesOptions = useMemo(() => {
    const marquesMap = new Map<string, {
      marque: string;
      count: number;
      totalCA2024: number;
      totalCA2025: number;
      progression: number;
    }>();

    adherentData.forEach(item => {
      if (item.marque) {
        const existing = marquesMap.get(item.marque);
        if (existing) {
          existing.count += 1;
          if (item.annee === 2024) {
            existing.totalCA2024 += item.ca;
          } else if (item.annee === 2025) {
            existing.totalCA2025 += item.ca;
          }
        } else {
          marquesMap.set(item.marque, {
            marque: item.marque,
            count: 1,
            totalCA2024: item.annee === 2024 ? item.ca : 0,
            totalCA2025: item.annee === 2025 ? item.ca : 0,
            progression: 0
          });
        }
      }
    });

    // Calculer les progressions
    marquesMap.forEach(marque => {
      marque.progression = marque.totalCA2024 > 0 
        ? ((marque.totalCA2025 - marque.totalCA2024) / marque.totalCA2024) * 100
        : 0;
    });

    // Trier par CA 2025 décroissant
    return Array.from(marquesMap.values()).sort((a, b) => b.totalCA2025 - a.totalCA2025);
  }, [adherentData]);

  const handleSelect = (marque: any) => {
    onSelect(marque.marque);
  };

  return (
    <div className="relative">
      <AutocompleteInput
        value={value}
        onChange={onChange}
        onSelect={handleSelect}
        options={marquesOptions}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        getOptionLabel={(marque) => marque.marque}
        getOptionValue={(marque) => marque.marque}
        minLength={1}
        maxSuggestions={15}
      />
      
      {/* Affichage des suggestions avec statistiques */}
      {value.length > 0 && marquesOptions.length > 0 && (
        <div className="mt-1 text-xs text-gray-500">
          {marquesOptions.length} marque(s) trouvée(s)
        </div>
      )}
    </div>
  );
};

export default MarqueAutocomplete;
