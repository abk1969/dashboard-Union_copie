import React, { useState } from 'react';
import { TripartiteMapping } from '../types';

interface TripartiteMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mappings: TripartiteMapping[]) => void;
  initialMappings: TripartiteMapping[];
}

const TripartiteMappingModal: React.FC<TripartiteMappingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMappings
}) => {
  const [mappings, setMappings] = useState<TripartiteMapping[]>(initialMappings);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleAddMapping = () => {
    const newMapping: TripartiteMapping = {
      fournisseur: 'Alliance',
      marque: '',
      famille: '',
      colonne: 7,
      valeur: '',
      seuilMin: 20000,
      pourcentage: 2.0,
      actif: true
    };
    setMappings([...mappings, newMapping]);
    setEditingIndex(mappings.length);
  };

  const handleEditMapping = (index: number) => {
    setEditingIndex(index);
  };

  const handleSaveMapping = (index: number, mapping: TripartiteMapping) => {
    const newMappings = [...mappings];
    newMappings[index] = mapping;
    setMappings(newMappings);
    setEditingIndex(null);
  };

  const handleDeleteMapping = (index: number) => {
    const newMappings = mappings.filter((_, i) => i !== index);
    setMappings(newMappings);
  };

  const handleSave = () => {
    onSave(mappings);
    onClose();
  };

  const fournisseurs = ['Alliance', 'DCA', 'Exadis', 'ACR'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">🔗 Configuration TRIPARTITE</h2>
              <p className="text-purple-100 mt-1">
                Mapping des colonnes d'import pour les accords TRIPARTITE
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Mappings TRIPARTITE</h3>
            <button
              onClick={handleAddMapping}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ➕ Ajouter un mapping
            </button>
          </div>

          <div className="space-y-4">
            {mappings.map((mapping, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                {editingIndex === index ? (
                  <MappingEditForm
                    mapping={mapping}
                    fournisseurs={fournisseurs}
                    onSave={(updatedMapping) => handleSaveMapping(index, updatedMapping)}
                    onCancel={() => setEditingIndex(null)}
                  />
                ) : (
                  <MappingDisplay
                    mapping={mapping}
                    onEdit={() => handleEditMapping(index)}
                    onDelete={() => handleDeleteMapping(index)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant pour afficher un mapping
const MappingDisplay: React.FC<{
  mapping: TripartiteMapping;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ mapping, onEdit, onDelete }) => (
  <div className="flex items-center justify-between">
    <div className="flex-1">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
        <div>
          <span className="font-medium text-gray-600">Fournisseur:</span>
          <p className="font-semibold">{mapping.fournisseur}</p>
        </div>
        <div>
          <span className="font-medium text-gray-600">Type:</span>
          <p className="font-semibold">
            {mapping.marque ? `Marque: ${mapping.marque}` : `Famille: ${mapping.famille}`}
          </p>
        </div>
        <div>
          <span className="font-medium text-gray-600">Colonne:</span>
          <p className="font-semibold">{mapping.colonne}</p>
        </div>
        <div>
          <span className="font-medium text-gray-600">Valeur:</span>
          <p className="font-semibold">{mapping.valeur}</p>
        </div>
        <div>
          <span className="font-medium text-gray-600">Seuil:</span>
          <p className="font-semibold">{mapping.seuilMin.toLocaleString()}€</p>
        </div>
        <div>
          <span className="font-medium text-gray-600">%:</span>
          <p className="font-semibold">{mapping.pourcentage}%</p>
        </div>
      </div>
    </div>
    <div className="flex space-x-2 ml-4">
      <button
        onClick={onEdit}
        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        ✏️ Modifier
      </button>
      <button
        onClick={onDelete}
        className="text-red-600 hover:text-red-800 text-sm font-medium"
      >
        🗑️ Supprimer
      </button>
    </div>
  </div>
);

// Composant pour éditer un mapping
const MappingEditForm: React.FC<{
  mapping: TripartiteMapping;
  fournisseurs: string[];
  onSave: (mapping: TripartiteMapping) => void;
  onCancel: () => void;
}> = ({ mapping, fournisseurs, onSave, onCancel }) => {
  const [formData, setFormData] = useState<TripartiteMapping>(mapping);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fournisseur
          </label>
          <select
            value={formData.fournisseur}
            onChange={(e) => setFormData({ ...formData, fournisseur: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {fournisseurs.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={formData.marque ? 'marque' : 'famille'}
            onChange={(e) => {
              if (e.target.value === 'marque') {
                setFormData({ ...formData, marque: '', famille: undefined });
              } else {
                setFormData({ ...formData, marque: undefined, famille: '' });
              }
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="marque">Marque</option>
            <option value="famille">Famille</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {formData.marque ? 'Marque' : 'Famille'}
          </label>
          <input
            type="text"
            value={formData.marque || formData.famille || ''}
            onChange={(e) => {
              if (formData.marque) {
                setFormData({ ...formData, marque: e.target.value });
              } else {
                setFormData({ ...formData, famille: e.target.value });
              }
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={formData.marque ? 'ex: SCHAEFFLER' : 'ex: freinage'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Colonne d'import
          </label>
          <input
            type="number"
            value={formData.colonne}
            onChange={(e) => setFormData({ ...formData, colonne: parseInt(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="1"
            placeholder="ex: 7"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valeur dans la colonne
          </label>
          <input
            type="text"
            value={formData.valeur}
            onChange={(e) => setFormData({ ...formData, valeur: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="ex: SCHAEFFLER"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Seuil minimum (€)
          </label>
          <input
            type="number"
            value={formData.seuilMin}
            onChange={(e) => setFormData({ ...formData, seuilMin: parseInt(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
            step="1000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pourcentage (%)
          </label>
          <input
            type="number"
            value={formData.pourcentage}
            onChange={(e) => setFormData({ ...formData, pourcentage: parseFloat(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
            step="0.1"
          />
        </div>

        <div className="flex items-center">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.actif}
              onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Actif</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Sauvegarder
        </button>
      </div>
    </form>
  );
};

export default TripartiteMappingModal;
