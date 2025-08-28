import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface Interaction {
  id: string;
  fournisseur: string;
  type: 'appel' | 'reunion' | 'visite';
  date: Date;
  description: string;
  contact: string;
  duree?: number; // en minutes
  resultat?: string;
  prochaineAction?: string;
  statut: 'planifiee' | 'realisee' | 'reportee' | 'annulee';
  priorite: 'basse' | 'normale' | 'haute' | 'urgente';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface InteractionTrackerProps {
  fournisseur: string;
  onClose?: () => void;
}

const InteractionTracker: React.FC<InteractionTrackerProps> = ({ 
  fournisseur, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'ajouter' | 'statistiques'>('timeline');
  const [interactions, setInteractions] = useState<Interaction[]>(() => {
    const saved = localStorage.getItem(`interactions_${fournisseur}`);
    return saved ? JSON.parse(saved).map((i: any) => ({ ...i, date: new Date(i.date), createdAt: new Date(i.createdAt), updatedAt: new Date(i.updatedAt) })) : [];
  });
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<string>('tous');
  const [filterStatut, setFilterStatut] = useState<string>('tous');

  // Sauvegarder les interactions
  const saveInteractions = (newInteractions: Interaction[]) => {
    setInteractions(newInteractions);
    localStorage.setItem(`interactions_${fournisseur}`, JSON.stringify(newInteractions));
  };

  // Ajouter une nouvelle interaction
  const addInteraction = (interaction: Omit<Interaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newInteraction: Interaction = {
      ...interaction,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    saveInteractions([newInteraction, ...interactions]);
    setShowForm(false);
  };

  // Mettre à jour le statut d'une interaction
  const updateInteractionStatus = (id: string, statut: Interaction['statut']) => {
    const updated = interactions.map(i => 
      i.id === id ? { ...i, statut, updatedAt: new Date() } : i
    );
    saveInteractions(updated);
  };

  // Supprimer une interaction
  const deleteInteraction = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette interaction ?')) {
      saveInteractions(interactions.filter(i => i.id !== id));
    }
  };

  // Filtrer les interactions
  const filteredInteractions = useMemo(() => {
    return interactions.filter(interaction => {
      const typeMatch = filterType === 'tous' || interaction.type === filterType;
      const statutMatch = filterStatut === 'tous' || interaction.statut === filterStatut;
      return typeMatch && statutMatch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [interactions, filterType, filterStatut]);

  // Statistiques
  const stats = useMemo(() => {
    const total = interactions.length;
    const realisees = interactions.filter(i => i.statut === 'realisee').length;
    const planifiees = interactions.filter(i => i.statut === 'planifiee').length;
    const parType = {
      appel: interactions.filter(i => i.type === 'appel').length,
      reunion: interactions.filter(i => i.type === 'reunion').length,
      visite: interactions.filter(i => i.type === 'visite').length
    };
    return { total, realisees, planifiees, parType };
  }, [interactions]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appel': return '📞';
      case 'reunion': return '🤝';
      case 'visite': return '🏢';
      default: return '📝';
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'planifiee': return 'bg-blue-100 text-blue-800';
      case 'realisee': return 'bg-green-100 text-green-800';
      case 'reportee': return 'bg-yellow-100 text-yellow-800';
      case 'annulee': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case 'urgente': return 'bg-red-500 text-white';
      case 'haute': return 'bg-orange-500 text-white';
      case 'normale': return 'bg-blue-500 text-white';
      case 'basse': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec statistiques rapides */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">📊 Interactions {fournisseur}</h3>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            + Nouvelle Interaction
          </button>
        </div>
        
        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.realisees}</div>
            <div className="text-xs text-gray-600">Réalisées</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.planifiees}</div>
            <div className="text-xs text-gray-600">Planifiées</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.parType.reunion}</div>
            <div className="text-xs text-gray-600">Réunions</div>
          </div>
        </div>
      </div>

      {/* Navigation des onglets */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
            activeTab === 'timeline'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📅 Timeline
        </button>
        <button
          onClick={() => setActiveTab('statistiques')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
            activeTab === 'statistiques'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📊 Statistiques
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="tous">Tous les types</option>
          <option value="appel">📞 Appels</option>
          <option value="reunion">🤝 Réunions</option>
          <option value="visite">🏢 Visites</option>
        </select>
        
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="tous">Tous les statuts</option>
          <option value="planifiee">Planifiée</option>
          <option value="realisee">Réalisée</option>
          <option value="reportee">Reportée</option>
          <option value="annulee">Annulée</option>
        </select>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          {filteredInteractions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📝</div>
              <div className="text-lg">Aucune interaction trouvée</div>
              <div className="text-sm">Commencez par ajouter votre première interaction</div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInteractions.map((interaction) => (
                <div
                  key={interaction.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Header de l'interaction */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getTypeIcon(interaction.type)}</div>
                      <div>
                        <div className="font-semibold text-gray-900 capitalize">
                          {interaction.type} - {interaction.contact}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(interaction.date, 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioriteColor(interaction.priorite)}`}>
                        {interaction.priorite}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(interaction.statut)}`}>
                        {interaction.statut}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <div className="text-gray-700">{interaction.description}</div>
                  </div>

                  {/* Détails supplémentaires */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 text-sm">
                    {interaction.duree && (
                      <div className="text-gray-600">
                        <span className="font-medium">Durée :</span> {interaction.duree} min
                      </div>
                    )}
                    {interaction.resultat && (
                      <div className="text-gray-600">
                        <span className="font-medium">Résultat :</span> {interaction.resultat}
                      </div>
                    )}
                    {interaction.prochaineAction && (
                      <div className="text-gray-600">
                        <span className="font-medium">Prochaine action :</span> {interaction.prochaineAction}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {interaction.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {interaction.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex space-x-2">
                      <select
                        value={interaction.statut}
                        onChange={(e) => updateInteractionStatus(interaction.id, e.target.value as Interaction['statut'])}
                        className="px-2 py-1 text-xs border border-gray-300 rounded"
                      >
                        <option value="planifiee">Planifiée</option>
                        <option value="realisee">Réalisée</option>
                        <option value="reportee">Reportée</option>
                        <option value="annulee">Annulée</option>
                      </select>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => deleteInteraction(interaction.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'statistiques' && (
        <div className="space-y-6">
          {/* Graphiques des types d'interactions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">📊 Répartition par Type</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl mb-2">📞</div>
                <div className="text-2xl font-bold text-blue-600">{stats.parType.appel}</div>
                <div className="text-sm text-gray-600">Appels</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl mb-2">🤝</div>
                <div className="text-2xl font-bold text-green-600">{stats.parType.reunion}</div>
                <div className="text-sm text-gray-600">Réunions</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl mb-2">🏢</div>
                <div className="text-2xl font-bold text-purple-600">{stats.parType.visite}</div>
                <div className="text-sm text-gray-600">Visites</div>
              </div>
            </div>
          </div>

          {/* Évolution temporelle */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">📈 Évolution Temporelle</h4>
            <div className="text-center text-gray-500 py-8">
              <div className="text-2xl mb-2">📊</div>
              <div>Graphiques d'évolution à venir</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'ajout d'interaction */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">➕ Nouvelle Interaction</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-white hover:text-gray-200 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <InteractionForm
                fournisseur={fournisseur}
                onSubmit={addInteraction}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant formulaire d'ajout d'interaction
interface InteractionFormProps {
  fournisseur: string;
  onSubmit: (interaction: Omit<Interaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const InteractionForm: React.FC<InteractionFormProps> = ({ fournisseur, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    type: 'appel' as Interaction['type'],
    date: new Date().toISOString().slice(0, 16),
    description: '',
    contact: '',
    duree: '',
    resultat: '',
    prochaineAction: '',
    statut: 'planifiee' as Interaction['statut'],
    priorite: 'normale' as Interaction['priorite'],
    tags: [] as string[]
  });
  const [newTag, setNewTag] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      fournisseur,
      type: formData.type,
      date: new Date(formData.date),
      description: formData.description,
      contact: formData.contact,
      duree: formData.duree ? parseInt(formData.duree) : undefined,
      resultat: formData.resultat || undefined,
      prochaineAction: formData.prochaineAction || undefined,
      statut: formData.statut,
      priorite: formData.priorite,
      tags: formData.tags
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type d'interaction</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as Interaction['type'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="appel">📞 Appel</option>
            <option value="reunion">🤝 Réunion</option>
            <option value="visite">🏢 Visite</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date et heure</label>
          <input
            type="datetime-local"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Contact fournisseur</label>
        <input
          type="text"
          value={formData.contact}
          onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
          placeholder="Nom du contact"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Détails de l'interaction..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Durée (min)</label>
          <input
            type="number"
            value={formData.duree}
            onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
            placeholder="30"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
          <select
            value={formData.statut}
            onChange={(e) => setFormData({ ...formData, statut: e.target.value as Interaction['statut'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="planifiee">Planifiée</option>
            <option value="realisee">Réalisée</option>
            <option value="reportee">Reportée</option>
            <option value="annulee">Annulée</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
          <select
            value={formData.priorite}
            onChange={(e) => setFormData({ ...formData, priorite: e.target.value as Interaction['priorite'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="basse">Basse</option>
            <option value="normale">Normale</option>
            <option value="haute">Haute</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Résultat (optionnel)</label>
        <input
          type="text"
          value={formData.resultat}
          onChange={(e) => setFormData({ ...formData, resultat: e.target.value })}
          placeholder="Résultat de l'interaction..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Prochaine action (optionnel)</label>
        <input
          type="text"
          value={formData.prochaineAction}
          onChange={(e) => setFormData({ ...formData, prochaineAction: e.target.value })}
          placeholder="Action à réaliser ensuite..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Ajouter un tag..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            +
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center space-x-2"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-blue-600 hover:text-blue-800"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Créer l'interaction
        </button>
      </div>
    </form>
  );
};

export default InteractionTracker;
