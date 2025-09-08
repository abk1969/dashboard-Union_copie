import React, { useState } from 'react';
import { NoteClient } from '../types';
// import { utilisateursFictifs } from '../data/notesData';

// Données temporaires
const utilisateursFictifs = [
  { id: '1', nom: 'Dupont', prenom: 'Jean' },
  { id: '2', nom: 'Martin', prenom: 'Marie' },
  { id: '3', nom: 'Bernard', prenom: 'Pierre' }
];
import CloseButton from './CloseButton';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoteAdded: (note: NoteClient) => void;
  codeUnion: string;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  onNoteAdded,
  codeUnion
}) => {
  const [formData, setFormData] = useState({
    typeNote: 'NOTE SIMPLE' as 'TO DO' | 'NOTE SIMPLE',
    noteSimple: '',
    tache: '',
    priorite: 'NORMALE' as 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE',
    statutTache: 'EN COURS' as 'EN COURS' | 'TERMINEE' | 'EN RETARD',
    assigneA: '',
    personneAPrevenir: '',
    dateRappel: '',
    tags: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Créer une nouvelle note
      const newNote: NoteClient = {
        idNote: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        codeUnion,
        typeNote: formData.typeNote,
        noteSimple: formData.typeNote === 'NOTE SIMPLE' ? formData.noteSimple : '',
        noteIa: '', // Pour l'instant vide, sera généré par IA plus tard
        dateCreation: new Date(),
        auteur: 'martial@groupementunion.pro', // Utilisateur connecté (à implémenter)
        traite: false,
        assigneA: formData.assigneA || undefined,
        personneAPrevenir: formData.personneAPrevenir || undefined,
        dateRappel: formData.dateRappel ? new Date(formData.dateRappel) : undefined,
        statutTache: formData.statutTache,
        tache: formData.typeNote === 'TO DO' ? formData.tache : undefined,
        priorite: formData.priorite,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        createdAt: new Date()
      };

      // Simuler un délai d'ajout
      await new Promise(resolve => setTimeout(resolve, 500));

      onNoteAdded(newNote);
      console.log('✅ Note ajoutée avec succès:', newNote);
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de la note:', error);
      alert('Erreur lors de l\'ajout de la note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      typeNote: 'NOTE SIMPLE',
      noteSimple: '',
      tache: '',
      priorite: 'NORMALE',
      statutTache: 'EN COURS',
      assigneA: '',
      personneAPrevenir: '',
      dateRappel: '',
      tags: '',
      notes: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-800">✏️ Nouvelle Note</h3>
            <CloseButton onClose={handleClose} />
          </div>
          <p className="text-gray-600 mt-1">Client: {codeUnion}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type de note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📋 Type de note *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleInputChange('typeNote', 'NOTE SIMPLE')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.typeNote === 'NOTE SIMPLE'
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="text-xl mb-1">📝</div>
                <div className="font-medium">Note simple</div>
                <div className="text-xs">Information générale</div>
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('typeNote', 'TO DO')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.typeNote === 'TO DO'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="text-xl mb-1">✅</div>
                <div className="font-medium">To-Do</div>
                <div className="text-xs">Tâche à effectuer</div>
              </button>
            </div>
          </div>

          {/* Contenu de la note */}
          {formData.typeNote === 'NOTE SIMPLE' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Contenu de la note *
              </label>
              <textarea
                value={formData.noteSimple}
                onChange={(e) => handleInputChange('noteSimple', e.target.value)}
                placeholder="Décrivez votre note..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎯 Description de la tâche *
              </label>
              <textarea
                value={formData.tache}
                onChange={(e) => handleInputChange('tache', e.target.value)}
                placeholder="Décrivez la tâche à effectuer..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                required
              />
            </div>
          )}

          {/* Priorité et statut */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🚨 Priorité
              </label>
              <select
                value={formData.priorite}
                onChange={(e) => handleInputChange('priorite', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="BASSE">🟢 Basse</option>
                <option value="NORMALE">🟡 Normale</option>
                <option value="HAUTE">🟠 Haute</option>
                <option value="URGENTE">🔴 Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📊 Statut
              </label>
              <select
                value={formData.statutTache}
                onChange={(e) => handleInputChange('statutTache', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="EN COURS">🔄 En cours</option>
                <option value="TERMINEE">✅ Terminée</option>
                <option value="EN RETARD">⏰ En retard</option>
              </select>
            </div>
          </div>

          {/* Assignation */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎯 Assigné à
              </label>
              <select
                value={formData.assigneA}
                onChange={(e) => handleInputChange('assigneA', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">Sélectionner...</option>
                {utilisateursFictifs.map(user => (
                  <option key={user.id} value={user.nom}>
                    {user.prenom} {user.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔔 Personne à prévenir
              </label>
              <select
                value={formData.personneAPrevenir}
                onChange={(e) => handleInputChange('personneAPrevenir', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">Sélectionner...</option>
                {utilisateursFictifs.map(user => (
                  <option key={user.id} value={user.nom}>
                    {user.prenom} {user.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date de rappel et tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ⏰ Date de rappel
              </label>
              <input
                type="date"
                value={formData.dateRappel}
                onChange={(e) => handleInputChange('dateRappel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏷️ Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="tag1, tag2, tag3..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
              <p className="text-xs text-gray-500 mt-1">Séparez les tags par des virgules</p>
            </div>
          </div>

          {/* Notes supplémentaires */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💬 Notes supplémentaires
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Informations complémentaires..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              ❌ Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (formData.typeNote === 'NOTE SIMPLE' && !formData.noteSimple.trim()) || (formData.typeNote === 'TO DO' && !formData.tache.trim())}
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Ajout en cours...
                </>
              ) : (
                '✅ Ajouter la note'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
