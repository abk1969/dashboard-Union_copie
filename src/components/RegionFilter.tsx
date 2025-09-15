import React from 'react';
import { useRegion } from '../contexts/RegionContext';

const RegionFilter: React.FC = () => {
  const { selectedRegion, setSelectedRegion, availableRegions, isRegionFiltered } = useRegion();
  
  // Debug temporaire
  console.log('🌍 Régions disponibles:', availableRegions);

  return (
    <div className="flex items-center space-x-3">
      <label htmlFor="region-filter" className="text-sm font-medium text-gray-700">
        🌍 Région :
      </label>
      <select
        id="region-filter"
        value={selectedRegion}
        onChange={(e) => setSelectedRegion(e.target.value)}
        className={`
          px-3 py-2 border border-gray-300 rounded-md text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${isRegionFiltered ? 'bg-blue-50 border-blue-300' : 'bg-white'}
          ${availableRegions.length === 0 ? 'bg-gray-50 text-gray-400' : ''}
        `}
        disabled={availableRegions.length === 0}
      >
        <option value="all">
          {availableRegions.length === 0 ? 'Aucune région (réimporter Excel)' : 'Toutes les régions'}
        </option>
        {availableRegions.map(region => (
          <option key={region} value={region}>
            {region}
          </option>
        ))}
      </select>
      
      {isRegionFiltered && (
        <div className="flex items-center space-x-1">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {selectedRegion}
          </span>
          <button
            onClick={() => setSelectedRegion('all')}
            className="text-gray-400 hover:text-gray-600"
            title="Supprimer le filtre région"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default RegionFilter;
