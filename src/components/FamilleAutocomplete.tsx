import React, { useState, useMemo } from 'react';
import AutocompleteInput from './AutocompleteInput';
import { AdherentData } from '../types';

interface FamilleAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (famille: string) => void;
  adherentData: AdherentData[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const FamilleAutocomplete: React.FC<FamilleAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  adherentData,
  placeholder = "Rechercher une famille...",
  className = "",
  disabled = false
}) => {
  // Extraire toutes les familles uniques avec leurs statistiques
  const famillesOptions = useMemo(() => {
    const famillesMap = new Map<string, {
      famille: string;
      count: number;
      totalCA2024: number;
      totalCA2025: number;
      progression: number;
      sousFamilles: string[];
    }>();

    adherentData.forEach(item => {
      if (item.famille) {
        const existing = famillesMap.get(item.famille);
        if (existing) {
          existing.count += 1;
          if (item.annee === 2024) {
            existing.totalCA2024 += item.ca;
          } else if (item.annee === 2025) {
            existing.totalCA2025 += item.ca;
          }
          if (item.sousFamille && !existing.sousFamilles.includes(item.sousFamille)) {
            existing.sousFamilles.push(item.sousFamille);
          }
        } else {
          famillesMap.set(item.famille, {
            famille: item.famille,
            count: 1,
            totalCA2024: item.annee === 2024 ? item.ca : 0,
            totalCA2025: item.annee === 2025 ? item.ca : 0,
            progression: 0,
            sousFamilles: item.sousFamille ? [item.sousFamille] : []
          });
        }
      }
    });

    // Calculer les progressions
    famillesMap.forEach(famille => {
      famille.progression = famille.totalCA2024 > 0 
        ? ((famille.totalCA2025 - famille.totalCA2024) / famille.totalCA2024) * 100
        : 0;
    });

    // Trier par CA 2025 décroissant
    return Array.from(famillesMap.values()).sort((a, b) => b.totalCA2025 - a.totalCA2025);
  }, [adherentData]);

  const handleSelect = (famille: any) => {
    onSelect(famille.famille);
  };

  return (
    <div className="relative">
      <AutocompleteInput
        value={value}
        onChange={onChange}
        onSelect={handleSelect}
        options={famillesOptions}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        getOptionLabel={(famille) => famille.famille}
        getOptionValue={(famille) => famille.famille}
        minLength={1}
        maxSuggestions={15}
      />
      
      {/* Affichage des suggestions avec statistiques */}
      {value.length > 0 && famillesOptions.length > 0 && (
        <div className="mt-1 text-xs text-gray-500">
          {famillesOptions.length} famille(s) trouvée(s)
        </div>
      )}
    </div>
  );
};

export default FamilleAutocomplete;