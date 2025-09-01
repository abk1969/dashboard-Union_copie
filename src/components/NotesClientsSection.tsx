import React, { useState, useMemo } from 'react';
import { NoteClient, NoteFilter } from '../types';
import { notesClientsFictives, utilisateursFictifs } from '../data/notesData';
import { formatDate } from '../utils/formatters';

interface NotesClientsSectionProps {
  onNoteClick?: (note: NoteClient) => void;
}

export const NotesClientsSection: React.FC<NotesClientsSectionProps> = ({ onNoteClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('TOUS');
  const [selectedStatut, setSelectedStatut] = useState<string>('TOUS');
  const [selectedPriorite, setSelectedPriorite] = useState<string>('TOUS');
  const [selectedAuteur, setSelectedAuteur] = useState<string>('TOUS');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('TOUS');
  const [showFilters, setShowFilters] = useState(false);

  // Filtrage des notes
  const filteredNotes = useMemo(() => {
    return notesClientsFictives.filter(note => {
      const matchesSearch = 
        note.codeUnion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.noteSimple && note.noteSimple.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (note.tache && note.tache.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = selectedType === 'TOUS' || note.typeNote === selectedType;
      const matchesStatut = selectedStatut === 'TOUS' || note.statutTache === selectedStatut;
      const matchesPriorite = selectedPriorite === 'TOUS' || note.priorite === selectedPriorite;
      const matchesAuteur = selectedAuteur === 'TOUS' || note.auteur.toLowerCase().includes(selectedAuteur.toLowerCase());
      const matchesAssignee = selectedAssignee === 'TOUS' || (note.assigneA && note.assigneA.toLowerCase().includes(selectedAssignee.toLowerCase()));

      return matchesSearch && matchesType && matchesStatut && matchesPriorite && matchesAuteur && matchesAssignee;
    });
  }, [searchTerm, selectedType, selectedStatut, selectedPriorite, selectedAuteur, selectedAssignee]);

  // Statistiques
  const stats = useMemo(() => {
    const total = notesClientsFictives.length;
    const todos = notesClientsFictives.filter(n => n.typeNote === 'TO DO').length;
    const notes = notesClientsFictives.filter(n => n.typeNote === 'NOTE SIMPLE').length;
    const enCours = notesClientsFictives.filter(n => n.statutTache === 'EN COURS').length;
    const terminees = notesClientsFictives.filter(n => n.statutTache === 'TERMINEE').length;

    return { total, todos, notes, enCours, terminees };
  }, []);

  // Fonctions utilitaires
  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case 'URGENTE': return 'bg-red-100 text-red-800 border-red-200';
      case 'HAUTE': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'NORMALE': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'BASSE': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'TERMINEE': return 'bg-green-100 text-green-800 border-green-200';
      case 'EN COURS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'EN RETARD': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'TO DO' ? '✅' : '📝';
  };

  const handleNoteClick = (note: NoteClient) => {
    if (onNoteClick) {
      onNoteClick(note);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">📝 Notes Clients & To-Do Lists</h2>
            <p className="text-indigo-100">Gérez les notes et tâches de vos clients</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-indigo-100">Total</div>
          </div>
        </div>
      </div>

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 text-center shadow-md">
          <div className="text-2xl mb-2">📋</div>
          <div className="text-lg font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-md">
          <div className="text-2xl mb-2">✅</div>
          <div className="text-lg font-bold text-gray-800">{stats.todos}</div>
          <div className="text-sm text-gray-600">To-Do</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-md">
          <div className="text-2xl mb-2">📝</div>
          <div className="text-lg font-bold text-gray-800">{stats.notes}</div>
          <div className="text-sm text-gray-600">Notes</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-md">
          <div className="text-2xl mb-2">🔄</div>
          <div className="text-lg font-bold text-gray-800">{stats.enCours}</div>
          <div className="text-sm text-gray-600">En cours</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-md">
          <div className="text-2xl mb-2">🎯</div>
          <div className="text-lg font-bold text-gray-800">{stats.terminees}</div>
          <div className="text-sm text-gray-600">Terminées</div>
        </div>
      </div>

      {/* Recherche et filtres */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col lg:flex-row gap-4 flex-1">
            <input
              type="text"
              placeholder="Rechercher par code Union, note ou tâche..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent flex-1"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-200"
            >
              {showFilters ? '🔽' : '🔼'} Filtres
            </button>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2">
            ✏️ Nouvelle note
          </button>
        </div>

        {/* Filtres avancés */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="TOUS">Tous types</option>
                <option value="TO DO">To-Do</option>
                <option value="NOTE SIMPLE">Note simple</option>
              </select>

              <select
                value={selectedStatut}
                onChange={(e) => setSelectedStatut(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="TOUS">Tous statuts</option>
                <option value="EN COURS">En cours</option>
                <option value="TERMINEE">Terminée</option>
                <option value="EN RETARD">En retard</option>
              </select>

              <select
                value={selectedPriorite}
                onChange={(e) => setSelectedPriorite(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="TOUS">Toutes priorités</option>
                <option value="URGENTE">Urgente</option>
                <option value="HAUTE">Haute</option>
                <option value="NORMALE">Normale</option>
                <option value="BASSE">Basse</option>
              </select>

              <select
                value={selectedAuteur}
                onChange={(e) => setSelectedAuteur(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="TOUS">Tous auteurs</option>
                {utilisateursFictifs.map(user => (
                  <option key={user.id} value={user.nom}>{user.prenom} {user.nom}</option>
                ))}
              </select>

              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="TOUS">Tous assignés</option>
                {utilisateursFictifs.map(user => (
                  <option key={user.id} value={user.nom}>{user.prenom} {user.nom}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Liste des notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          📋 Notes et tâches ({filteredNotes.length})
        </h3>
        
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-600 text-lg">
              {notesClientsFictives.length === 0 
                ? "Aucune note n'a encore été créée" 
                : "Aucune note ne correspond à vos filtres"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotes.map((note) => (
              <div
                key={note.idNote}
                onClick={() => handleNoteClick(note)}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getTypeIcon(note.typeNote)}</span>
                      <span className="font-medium text-gray-900">{note.codeUnion}</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPrioriteColor(note.priorite)}`}>
                        {note.priorite}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatutColor(note.statutTache)}`}>
                        {note.statutTache}
                      </span>
                    </div>
                    
                    {note.tache && (
                      <div className="text-gray-800 mb-2">
                        <strong>Tâche :</strong> {note.tache}
                      </div>
                    )}
                    
                    {note.noteSimple && (
                      <div className="text-gray-700 mb-2">
                        <strong>Note :</strong> {note.noteSimple}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>👤 {note.auteur}</span>
                      {note.assigneA && <span>🎯 Assigné à: {note.assigneA}</span>}
                      <span>📅 {formatDate(note.dateCreation)}</span>
                      {note.dateRappel && <span>⏰ Rappel: {formatDate(note.dateRappel)}</span>}
                    </div>
                    
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {note.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
