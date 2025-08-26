import React from 'react';
import { Filtres } from '../types';

interface FiltersProps {
  filtres: Filtres;
  onFiltresChange: (filtres: Filtres) => void;
  groupesClients: string[];
  fournisseurs: string[];
  marques: string[];
  sousFamilles: string[];
}

const Filters: React.FC<FiltersProps> = ({
  filtres,
  onFiltresChange,
  groupesClients,
  fournisseurs,
  marques,
  sousFamilles
}) => {
  const handleFilterChange = (key: keyof Filtres, value: string | number | undefined) => {
    onFiltresChange({
      ...filtres,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltresChange({});
  };

  return (
    <div className="filters-container bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="filters-header flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">🔍 Filtres</h3>
        <button
          onClick={clearFilters}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
        >
          Effacer tous les filtres
        </button>
      </div>
      
      <div className="filters-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Groupe Client */}
        <div className="filter-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Groupe Client
          </label>
          <select
            value={filtres.groupeClient || ''}
            onChange={(e) => handleFilterChange('groupeClient', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les groupes</option>
            {groupesClients.map((groupe) => (
              <option key={groupe} value={groupe}>
                {groupe}
              </option>
            ))}
          </select>
        </div>

        {/* Fournisseur */}
        <div className="filter-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fournisseur
          </label>
          <select
            value={filtres.fournisseur || ''}
            onChange={(e) => handleFilterChange('fournisseur', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les fournisseurs</option>
            {fournisseurs.map((fournisseur) => (
              <option key={fournisseur} value={fournisseur}>
                {fournisseur}
              </option>
            ))}
          </select>
        </div>

        {/* Marque */}
        <div className="filter-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Marque
          </label>
          <select
            value={filtres.marque || ''}
            onChange={(e) => handleFilterChange('marque', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes les marques</option>
            {marques.map((marque) => (
              <option key={marque} value={marque}>
                {marque}
              </option>
            ))}
          </select>
        </div>

        {/* Sous Famille */}
        <div className="filter-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Famille de Produits
          </label>
          <select
            value={filtres.sousFamille || ''}
            onChange={(e) => handleFilterChange('sousFamille', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes les familles</option>
            {sousFamilles.map((famille) => (
              <option key={famille} value={famille}>
                {famille}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtres actifs */}
      {Object.keys(filtres).length > 0 && (
        <div className="active-filters mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Filtres actifs :</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(filtres).map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {key}: {value}
                <button
                  onClick={() => handleFilterChange(key as keyof Filtres, undefined)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Filters;
