import React, { useState, useMemo } from 'react';
import AutocompleteInput from './AutocompleteInput';
import { AdherentData } from '../types';

interface FournisseurAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (fournisseur: string) => void;
  adherentData: AdherentData[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const FournisseurAutocomplete: React.FC<FournisseurAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  adherentData,
  placeholder = "Rechercher un fournisseur...",
  className = "",
  disabled = false
}) => {
  // Extraire tous les fournisseurs uniques avec leurs statistiques
  const fournisseursOptions = useMemo(() => {
    const fournisseursMap = new Map<string, {
      fournisseur: string;
      count: number;
      totalCA2024: number;
      totalCA2025: number;
      progression: number;
      marques: string[];
    }>();

    adherentData.forEach(item => {
      if (item.fournisseur) {
        const existing = fournisseursMap.get(item.fournisseur);
        if (existing) {
          existing.count += 1;
          if (item.annee === 2024) {
            existing.totalCA2024 += item.ca;
          } else if (item.annee === 2025) {
            existing.totalCA2025 += item.ca;
          }
          if (item.marque && !existing.marques.includes(item.marque)) {
            existing.marques.push(item.marque);
          }
        } else {
          fournisseursMap.set(item.fournisseur, {
            fournisseur: item.fournisseur,
            count: 1,
            totalCA2024: item.annee === 2024 ? item.ca : 0,
            totalCA2025: item.annee === 2025 ? item.ca : 0,
            progression: 0,
            marques: item.marque ? [item.marque] : []
          });
        }
      }
    });

    // Calculer les progressions
    fournisseursMap.forEach(fournisseur => {
      fournisseur.progression = fournisseur.totalCA2024 > 0 
        ? ((fournisseur.totalCA2025 - fournisseur.totalCA2024) / fournisseur.totalCA2024) * 100
        : 0;
    });

    // Trier par CA 2025 décroissant
    return Array.from(fournisseursMap.values()).sort((a, b) => b.totalCA2025 - a.totalCA2025);
  }, [adherentData]);

  const handleSelect = (fournisseur: any) => {
    onSelect(fournisseur.fournisseur);
  };

  return (
    <div className="relative">
      <AutocompleteInput
        value={value}
        onChange={onChange}
        onSelect={handleSelect}
        options={fournisseursOptions}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        getOptionLabel={(fournisseur) => fournisseur.fournisseur}
        getOptionValue={(fournisseur) => fournisseur.fournisseur}
        minLength={1}
        maxSuggestions={15}
      />
      
      {/* Affichage des suggestions avec statistiques */}
      {value.length > 0 && fournisseursOptions.length > 0 && (
        <div className="mt-1 text-xs text-gray-500">
          {fournisseursOptions.length} fournisseur(s) trouvé(s)
        </div>
      )}
    </div>
  );
};

export default FournisseurAutocomplete;