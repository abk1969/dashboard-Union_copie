import React, { useState } from 'react';
import { User } from '../types/user';
import { createNote } from '../config/supabase-users';
import { callOpenAI } from '../config/openai';

interface SimpleNoteFormProps {
  users: User[];
  adherentData: any[];
  onSuccess: () => void;
  onCancel: () => void;
  preSelectedClient?: string;
}

const SimpleNoteForm: React.FC<SimpleNoteFormProps> = ({ 
  users, 
  adherentData, 
  onSuccess, 
  onCancel,
  preSelectedClient 
}) => {
  const [selectedClient, setSelectedClient] = useState<string>(preSelectedClient || '');
  const [clientSearch, setClientSearch] = useState<string>('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [simpleNote, setSimpleNote] = useState({
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    notifyUsers: [] as string[],
    aiImproved: false
  });
  const [isImprovingNote, setIsImprovingNote] = useState(false);

  // Fonction pour obtenir la liste des clients uniques
  const getUniqueClients = () => {
    const uniqueClients = adherentData.reduce((acc: any[], item) => {
      const existingClient = acc.find(client => client.codeUnion === item.codeUnion);
      if (!existingClient) {
        acc.push({
          codeUnion: item.codeUnion,
          raisonSociale: item.raisonSociale,
          groupeClient: item.groupeClient,
          regionCommerciale: item.regionCommerciale
        });
      }
      return acc;
    }, []);

    return uniqueClients.sort((a, b) => a.raisonSociale.localeCompare(b.raisonSociale));
  };

  // Fonction pour filtrer les clients selon la recherche
  const getFilteredClients = () => {
    if (!clientSearch.trim()) return [];
    
    const searchTerm = clientSearch.toLowerCase();
    return getUniqueClients().filter(client => 
      client.codeUnion.toLowerCase().includes(searchTerm) ||
      client.raisonSociale.toLowerCase().includes(searchTerm) ||
      (client.groupeClient && client.groupeClient.toLowerCase().includes(searchTerm))
    ).slice(0, 10);
  };

  // Fonction pour sélectionner un client
  const handleClientSelect = (client: any) => {
    setSelectedClient(client.codeUnion);
    setClientSearch(`${client.codeUnion} - ${client.raisonSociale}`);
    setShowClientSuggestions(false);
  };

  // Fonction pour améliorer la note avec l'IA
  const handleImproveNote = async () => {
    if (!simpleNote.content.trim()) return;
    
    setIsImprovingNote(true);
    try {
      const response = await callOpenAI({
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant qui améliore des NOTES INTERNES pour les commerciaux. Transforme des phrases courtes ou mal formulées en notes professionnelles claires. IMPORTANT: Génère une NOTE, pas un email, pas une lettre. Format: phrase courte et précise, ton professionnel mais direct.'
          },
          {
            role: 'user',
            content: `Transforme cette phrase en note professionnelle : "${simpleNote.content}"`
          }
        ]
      });
      
      if (response.success && response.response) {
        setSimpleNote({
          ...simpleNote,
          content: response.response,
          aiImproved: true
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'amélioration de la note:', error);
      alert('Erreur lors de l\'amélioration de la note');
    } finally {
      setIsImprovingNote(false);
    }
  };

  // Fonction pour créer une note simple
  const handleCreateSimpleNote = async () => {
    if (!selectedClient || !simpleNote.content.trim()) {
      alert('Veuillez sélectionner un client et saisir une note');
      return;
    }

    try {
      // Créer la note simple
      await createNote({
        codeUnion: selectedClient,
        noteSimple: simpleNote.content,
        auteur: 'Utilisateur', // TODO: Remplacer par l'utilisateur connecté
        dateCreation: new Date().toISOString().split('T')[0]
      });

      // Log des utilisateurs notifiés (pas de tâche créée pour éviter la confusion)
      if (simpleNote.notifyUsers.length > 0) {
        console.log('👥 Utilisateurs notifiés:', simpleNote.notifyUsers.join(', '));
        console.log('📝 Note avec priorité:', simpleNote.priority);
      }

      alert(`✅ Note créée avec succès !${simpleNote.notifyUsers.length > 0 ? ` (${simpleNote.notifyUsers.length} personne(s) notifiée(s))` : ''}`);
      
      // Reset du formulaire
      setSimpleNote({ 
        content: '', 
        priority: 'medium', 
        notifyUsers: [], 
        aiImproved: false 
      });
      setSelectedClient('');
      setClientSearch('');
      
      onSuccess();

    } catch (error) {
      console.error('❌ Erreur lors de la création de la note:', error);
      alert('❌ Erreur lors de la création de la note');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">📝 Note Simple pour Client</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sélection du client */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            🎯 Client *
          </label>
          <div className="relative">
            <input
              type="text"
              value={clientSearch}
              onChange={(e) => {
                setClientSearch(e.target.value);
                setShowClientSuggestions(e.target.value.length > 0);
                setSelectedClient('');
              }}
              onFocus={() => setShowClientSuggestions(clientSearch.length > 0)}
              placeholder="Tapez les premières lettres du client..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {/* Suggestions d'autocomplétion */}
            {showClientSuggestions && getFilteredClients().length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {getFilteredClients().map((client, index) => (
                  <div
                    key={`${client.codeUnion}-${index}`}
                    onClick={() => handleClientSelect(client)}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">
                      {client.codeUnion} - {client.raisonSociale}
                    </div>
                    {client.groupeClient && (
                      <div className="text-xs text-gray-500">
                        {client.groupeClient}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Zone de texte pour la note */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            📝 Note simple *
          </label>
          <textarea
            value={simpleNote.content}
            onChange={(e) => setSimpleNote({...simpleNote, content: e.target.value})}
            placeholder="Tapez votre note ici... L'IA pourra l'améliorer automatiquement !"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />
          <div className="flex justify-between items-center mt-2">
            <button
              type="button"
              onClick={handleImproveNote}
              disabled={!simpleNote.content.trim() || isImprovingNote}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {isImprovingNote ? '⏳ Amélioration...' : '🤖 Améliorer avec l\'IA'}
            </button>
            {simpleNote.aiImproved && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                ✅ Amélioré par l'IA
              </span>
            )}
          </div>
        </div>

        {/* Priorité */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            🚨 Priorité
          </label>
          <select
            value={simpleNote.priority}
            onChange={(e) => setSimpleNote({...simpleNote, priority: e.target.value as any})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="low">🟢 Basse</option>
            <option value="medium">🟡 Normale</option>
            <option value="high">🔴 Haute</option>
          </select>
        </div>

        {/* Notifications */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            👥 Notifier l'équipe
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
            {users.map(user => (
              <label key={user.id} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={simpleNote.notifyUsers.includes(user.email)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSimpleNote({
                        ...simpleNote,
                        notifyUsers: [...simpleNote.notifyUsers, user.email]
                      });
                    } else {
                      setSimpleNote({
                        ...simpleNote,
                        notifyUsers: simpleNote.notifyUsers.filter(email => email !== user.email)
                      });
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{user.email}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handleCreateSimpleNote}
          disabled={!selectedClient || !simpleNote.content.trim()}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
        >
          ✅ Créer la Note
        </button>
      </div>
    </div>
  );
};

export default SimpleNoteForm;
