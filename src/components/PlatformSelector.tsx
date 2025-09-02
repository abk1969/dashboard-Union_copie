import React, { useState } from 'react';
import { usePlatform } from '../contexts/PlatformContext';
import { PLATFORM_FILTER_OPTIONS, PLATFORMS } from '../config/platforms';

interface PlatformSelectorProps {
  className?: string;
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({ className = '' }) => {
  const { filterMode, setFilterMode, activePlatforms, setActivePlatforms, isFiltered } = usePlatform();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustomSelector, setShowCustomSelector] = useState(false);

  const currentFilter = PLATFORM_FILTER_OPTIONS.find(option => option.id === filterMode);

  const handleQuickSelect = (mode: string) => {
    setFilterMode(mode);
    setShowDropdown(false);
    setShowCustomSelector(false);
  };

  const handleCustomPlatformToggle = (platformId: string) => {
    const newPlatforms = activePlatforms.includes(platformId)
      ? activePlatforms.filter(p => p !== platformId)
      : [...activePlatforms, platformId];
    
    setActivePlatforms(newPlatforms);
  };

  const applyCustomSelection = () => {
    setShowCustomSelector(false);
    setShowDropdown(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Indicateur de filtrage actif */}
      {isFiltered && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
            🎯 FILTRÉ
          </div>
        </div>
      )}

      {/* Bouton principal */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center gap-3 px-4 py-2 rounded-lg border transition-all duration-200 min-w-[200px] ${
          isFiltered 
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-500 shadow-lg' 
            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
        }`}
      >
        <div className="flex items-center gap-2 flex-1">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: currentFilter?.color || '#6B7280' }}
          />
          <span className="font-medium truncate">
            {currentFilter?.name || 'TOUTES LES PLATEFORMES'}
          </span>
        </div>
        <svg 
          className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-full w-max">
          <div className="p-2">
            <div className="text-xs text-gray-500 px-3 py-2 font-medium uppercase tracking-wide">
              🎯 Modes de présentation
            </div>
            
            {PLATFORM_FILTER_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  if (option.id === 'custom') {
                    setShowCustomSelector(true);
                  } else {
                    handleQuickSelect(option.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  filterMode === option.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: option.color }}
                />
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{option.name}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </div>
                {filterMode === option.id && (
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Sélection personnalisée */}
          {showCustomSelector && (
            <div className="border-t border-gray-200 p-3">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Sélectionner les plateformes :
              </div>
              <div className="space-y-2">
                {PLATFORMS.map((platform) => (
                  <label key={platform.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activePlatforms.includes(platform.id)}
                      onChange={() => handleCustomPlatformToggle(platform.id)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: platform.color }}
                    />
                    <span className="text-sm font-medium">{platform.name}</span>
                    <span className="text-xs text-gray-500">({platform.description})</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={applyCustomSelection}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Appliquer
                </button>
                <button
                  onClick={() => setShowCustomSelector(false)}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overlay pour fermer le dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowDropdown(false);
            setShowCustomSelector(false);
          }}
        />
      )}
    </div>
  );
};
