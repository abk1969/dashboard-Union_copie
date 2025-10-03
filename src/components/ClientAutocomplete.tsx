import React, { useState, useMemo } from 'react';
import AutocompleteInput from './AutocompleteInput';
import { AdherentData } from '../types';

interface ClientAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (client: any) => void;
  adherentData: AdherentData[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const ClientAutocomplete: React.FC<ClientAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  adherentData,
  placeholder = "Rechercher un client...",
  className = "",
  disabled = false
}) => {
  // Extraire tous les clients uniques avec leurs statistiques
  const clientsOptions = useMemo(() => {
    const clientsMap = new Map<string, {
      codeUnion: string;
      raisonSociale: string;
      ville: string;
      totalCA2024: number;
      totalCA2025: number;
      progression: number;
      count: number;
    }>();

    adherentData.forEach(item => {
      if (item.codeUnion) {
        const existing = clientsMap.get(item.codeUnion);
        if (existing) {
          existing.count += 1;
          if (item.annee === 2024) {
            existing.totalCA2024 += item.ca;
          } else if (item.annee === 2025) {
            existing.totalCA2025 += item.ca;
          }
        } else {
          clientsMap.set(item.codeUnion, {
            codeUnion: item.codeUnion,
            raisonSociale: item.raisonSociale || 'N/A',
            ville: item.regionCommerciale || 'N/A',
            totalCA2024: item.annee === 2024 ? item.ca : 0,
            totalCA2025: item.annee === 2025 ? item.ca : 0,
            progression: 0,
            count: 1
          });
        }
      }
    });

    // Calculer les progressions
    clientsMap.forEach(client => {
      client.progression = client.totalCA2024 > 0 
        ? ((client.totalCA2025 - client.totalCA2024) / client.totalCA2024) * 100
        : 0;
    });

    // Trier par CA 2025 décroissant
    return Array.from(clientsMap.values()).sort((a, b) => b.totalCA2025 - a.totalCA2025);
  }, [adherentData]);

  const handleSelect = (client: any) => {
    onSelect(client);
  };

  // Fonction pour formater l'affichage des suggestions
  const getOptionLabel = (client: any) => {
    return `${client.raisonSociale} (${client.codeUnion}) - ${client.ville}`;
  };

  return (
    <div className="relative">
      <AutocompleteInput
        value={value}
        onChange={onChange}
        onSelect={handleSelect}
        options={clientsOptions}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        getOptionLabel={getOptionLabel}
        getOptionValue={(client) => client.codeUnion}
        minLength={1}
        maxSuggestions={15}
      />
      
      {/* Affichage des suggestions avec statistiques */}
      {value.length > 0 && clientsOptions.length > 0 && (
        <div className="mt-1 text-xs text-gray-500">
          {clientsOptions.length} client(s) trouvé(s)
        </div>
      )}
    </div>
  );
};

export default ClientAutocomplete;
