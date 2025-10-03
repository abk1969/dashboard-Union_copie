import React, { useState, useMemo } from 'react';
import AutocompleteInput from './AutocompleteInput';
import { CommercialPerformance } from '../types';

interface CommercialAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (commercial: string) => void;
  commercialsPerformance: CommercialPerformance[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CommercialAutocomplete: React.FC<CommercialAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  commercialsPerformance,
  placeholder = "Rechercher un commercial...",
  className = "",
  disabled = false
}) => {
  // Préparer les options des commerciaux
  const commercialsOptions = useMemo(() => {
    return commercialsPerformance.map(commercial => ({
      nom: commercial.agentUnion,
      totalCA2024: commercial.ca2024,
      totalCA2025: commercial.ca2025,
      progression: commercial.progression,
      clientsCount: commercial.totalClients,
      famillesCount: commercial.famillesUniques,
      marquesCount: commercial.marquesUniques
    }));
  }, [commercialsPerformance]);

  const handleSelect = (commercial: any) => {
    onSelect(commercial.nom);
  };

  // Fonction pour formater l'affichage des suggestions
  const getOptionLabel = (commercial: any) => {
    return `${commercial.nom} (${commercial.clientsCount} clients)`;
  };

  return (
    <div className="relative">
      <AutocompleteInput
        value={value}
        onChange={onChange}
        onSelect={handleSelect}
        options={commercialsOptions}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        getOptionLabel={getOptionLabel}
        getOptionValue={(commercial) => commercial.nom}
        minLength={1}
        maxSuggestions={15}
      />
      
      {/* Affichage des suggestions avec statistiques */}
      {value.length > 0 && commercialsOptions.length > 0 && (
        <div className="mt-1 text-xs text-gray-500">
          {commercialsOptions.length} commercial(aux) trouvé(s)
        </div>
      )}
    </div>
  );
};

export default CommercialAutocomplete;
