import React, { useState, useEffect } from 'react';
import { TodoTask, NoteClient } from '../types';
import { fetchTasks, createTask, deleteTask, fetchUsers } from '../config/supabase-users';
import { getUserPhoto } from '../config/supabase-photos';
import { useUser } from '../contexts/UserContext';
import TaskDetailModal from './TaskDetailModal';

interface ClientNotesTasksProps {
  clientCode: string;
  clientName: string;
  onNavigateToReports?: () => void;
  onCloseModal?: () => void;
}

const ClientNotesTasks: React.FC<ClientNotesTasksProps> = ({ clientCode, clientName, onNavigateToReports, onCloseModal }) => {
  const { currentUser } = useUser();
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [notes, setNotes] = useState<NoteClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes'>('tasks');
  // Variable supprimée car non utilisée
  const [selectedTask, setSelectedTask] = useState<TodoTask | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [authorPhotos, setAuthorPhotos] = useState<{[key: string]: string}>({});
  // Variables pour le résumé IA
  const [summaries, setSummaries] = useState<{[key: string]: string}>({});
  const [loadingSummaries, setLoadingSummaries] = useState<{[key: string]: boolean}>({});
  // Variables supprimées car non utilisées

  // Charger les tâches et notes du client
  useEffect(() => {
    loadClientData();
  }, [clientCode]);

  const loadClientData = async () => {
    setLoading(true);
    try {
      // Charger les tâches du client (exclure les notes)
      const allTasks = await fetchTasks();
      const clientTasks = allTasks.filter(task => 
        task.clientCode === clientCode && 
        task.typeNote !== 'NOTE SIMPLE'
      );
      setTasks(clientTasks);

      // Charger les utilisateurs et leurs photos (comme dans TodoListSimple)
      let emailMap: {[key: string]: string} = {};
      let userPhotosMap: {[key: string]: string} = {};
      
      try {
        const users = await fetchUsers();
        if (users && users.length > 0) {
          // Créer le mapping email -> userId
          users.forEach(user => {
            if (user.email) {
              emailMap[user.email] = user.id;
              emailMap[user.email.toLowerCase()] = user.id;
            }
          });
          
          // Charger les photos de tous les utilisateurs
          for (const user of users) {
            try {
              const result = await getUserPhoto(user.id, user.email);
              if (result.success && result.photoUrl) {
                userPhotosMap[user.id] = result.photoUrl;
              }
            } catch (error) {
              console.log(`Photo non trouvée pour l'utilisateur: ${user.email}`);
            }
          }
          setAuthorPhotos(userPhotosMap);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
      }

      // Charger les notes du client depuis todo_tasks
      try {
        const allTasks = await fetchTasks();
        // Filtrer les notes (type_note: 'NOTE SIMPLE') pour ce client
        const clientNotes = allTasks.filter(task => 
          task.clientCode === clientCode && 
          task.typeNote === 'NOTE SIMPLE'
        );
        
        // Convertir les TodoTask en NoteClient pour la compatibilité
        const convertedNotes: NoteClient[] = clientNotes.map(note => ({
          idNote: note.id,
          codeUnion: note.clientCode,
          typeNote: 'NOTE SIMPLE' as const,
          noteSimple: note.noteSimple || note.description || '',
          dateCreation: new Date(note.createdAt),
          auteur: note.auteur || 'Inconnu',
          traite: false,
          statutTache: 'EN COURS' as const,
          priorite: 'NORMALE' as const,
          createdAt: new Date(note.createdAt)
        }));
        setNotes(convertedNotes);
        console.log('📝 Notes chargées:', convertedNotes.length, convertedNotes);

        // Charger les photos des auteurs en utilisant le mapping local
        const allAuthors = convertedNotes.map(note => note.auteur);
        const uniqueAuthors = Array.from(new Set(allAuthors));
        console.log('🔍 Auteurs trouvés:', uniqueAuthors);
        const authorPhotosMap: {[key: string]: string} = {};
        
        for (const author of uniqueAuthors) {
          // Essayer différentes variantes de l'email
          const emailVariants = [
            author,
            author.toLowerCase(),
            author.toUpperCase(),
            author.replace('@', '@').toLowerCase(),
            author.replace('@', '@').toUpperCase()
          ];
          
          let userId = null;
          for (const variant of emailVariants) {
            if (emailMap[variant]) {
              userId = emailMap[variant];
              console.log('🔍 Email variant trouvé:', variant, '-> userId:', userId);
              break;
            }
          }
          
          if (userId && userPhotosMap[userId]) {
            authorPhotosMap[author] = userPhotosMap[userId];
            console.log('✅ Photo trouvée pour', author, ':', userPhotosMap[userId]);
          } else {
            console.log('❌ Pas de photo trouvée pour', author, 'userId:', userId);
          }
        }
        
        console.log('📸 Photos finales:', authorPhotosMap);
        setAuthorPhotos(authorPhotosMap);
      } catch (error) {
        console.error('Erreur lors du chargement des notes:', error);
        // Si la table n'existe pas, afficher un message informatif
        if (error instanceof Error && error.message && error.message.includes('Could not find the table')) {
          console.log('ℹ️ Table client_notes non trouvée. Création de données de démonstration...');
          // Créer des notes de démonstration
          const demoNotes: NoteClient[] = [
            {
              idNote: 'demo-1',
              codeUnion: clientCode,
              typeNote: 'NOTE SIMPLE',
              noteSimple: 'Note de démonstration - La table client_notes doit être créée dans Supabase',
              dateCreation: new Date(),
              auteur: 'martial@groupementunion.pro',
              traite: false,
              statutTache: 'EN COURS',
              priorite: 'NORMALE',
              createdAt: new Date()
            }
          ];
          setNotes(demoNotes);
        } else {
          setNotes([]);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction supprimée - redirection vers le système officiel

  const handleTaskClick = (task: TodoTask) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleTaskUpdated = () => {
    loadClientData(); // Recharger les données
  };

  const handleTaskDeleted = () => {
    loadClientData(); // Recharger les données
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) return;

    try {
      await deleteTask(noteId);
      loadClientData(); // Recharger les données
    } catch (error) {
      console.error('Erreur lors de la suppression de la note:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;

    try {
      await deleteTask(taskId);
      loadClientData(); // Recharger les données
    } catch (error) {
      console.error('Erreur lors de la suppression de la tâche:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'prospection': return '🔍';
      case 'suivi': return '📞';
      case 'relance': return '⏰';
      case 'commercial': return '💼';
      case 'admin': return '📋';
      default: return '📝';
    }
  };

  // Fonction pour générer un résumé IA d'une note
  const generateSummary = async (noteId: string, noteText: string | undefined) => {
    if (!noteText || summaries[noteId] || loadingSummaries[noteId]) return;
    
    setLoadingSummaries(prev => ({ ...prev, [noteId]: true }));
    
    try {
      // Simulation d'un appel IA (remplacer par une vraie API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Résumé simulé basé sur la longueur et le contenu
      let summary = '';
      if (noteText.length > 200) {
        const sentences = noteText.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const keySentences = sentences.slice(0, 2);
        summary = keySentences.join('. ').trim() + '...';
        
        // Ajouter des points clés détectés
        const keywords = ['client', 'prospect', 'rencontre', 'appel', 'email', 'devis', 'commande', 'problème', 'solution'];
        const foundKeywords = keywords.filter(keyword => 
          noteText.toLowerCase().includes(keyword)
        );
        
        if (foundKeywords.length > 0) {
          summary += `\n\n🔑 Points clés: ${foundKeywords.join(', ')}`;
        }
      } else {
        summary = noteText; // Note courte, pas besoin de résumé
      }
      
      setSummaries(prev => ({ ...prev, [noteId]: summary }));
    } catch (error) {
      console.error('Erreur lors de la génération du résumé:', error);
      setSummaries(prev => ({ ...prev, [noteId]: 'Erreur lors de la génération du résumé' }));
    } finally {
      setLoadingSummaries(prev => ({ ...prev, [noteId]: false }));
    }
  };

  // Fonction pour déterminer si une note est "longue"
  const isLongNote = (text: string | undefined) => {
    const isLong = text && text.length > 150;
    console.log('🔍 isLongNote check:', { text: text?.substring(0, 50) + '...', length: text?.length, isLong });
    return isLong;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Chargement des notes et tâches...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec onglets */}
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'tasks'
                ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 Tâches ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'notes'
                ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📝 Notes ({notes.length})
          </button>
        </div>
        
        <button
          onClick={() => {
            console.log('🔍 Bouton cliqué:', { activeTab, onNavigateToReports: !!onNavigateToReports });
            if (activeTab === 'notes' && onNavigateToReports) {
              console.log('🚀 Fermeture du modal et redirection vers les rapports...');
              // Fermer le modal client d'abord
              onCloseModal?.();
              // Puis rediriger vers les rapports
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('navigateToReportsFromModal'));
              }, 100);
            } else {
              console.log('📝 Redirection vers le système officiel pour les tâches...');
              // Rediriger vers le système officiel pour les tâches
              onCloseModal?.();
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('navigateToReportsFromModal'));
              }, 100);
            }
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {activeTab === 'notes' ? '📋 Nouveau Rapport' : '➕ Ajouter'}
        </button>
      </div>

      {/* Formulaire supprimé - redirection vers le système officiel */}

      {/* Contenu des onglets */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📋</div>
              <p>Aucune tâche pour ce client</p>
              <p className="text-sm">Cliquez sur "Ajouter" pour créer une nouvelle tâche</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{getCategoryIcon(task.category)}</span>
                        <h4 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                          {task.title}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                          {task.priority.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>📅 Créé le {new Date(task.createdAt).toLocaleDateString()}</span>
                        {task.dueDate && (
                          <span>⏰ Échéance: {new Date(task.dueDate).toLocaleDateString()}</span>
                        )}
                        {task.assignedTo && (
                          <span>👤 Assigné à: {task.assignedTo}</span>
                        )}
                      </div>
                      
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <span className="text-xs text-gray-400">Cliquer pour voir</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Supprimer la tâche"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-4">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <p>Aucune note pour ce client</p>
              <p className="text-sm">Les notes apparaîtront ici une fois créées</p>
              <button
                onClick={() => {
                  // Créer une note de test
                  const testNote: NoteClient = {
                    idNote: 'test-' + Date.now(),
                    codeUnion: clientCode,
                    typeNote: 'NOTE SIMPLE',
                    noteSimple: 'Ceci est une note de test très longue pour vérifier que le système de résumé IA fonctionne correctement. Cette note contient beaucoup de texte pour tester la détection des notes longues et l\'affichage du bouton résumé IA. Elle devrait déclencher l\'affichage du badge "Longue" et du bouton "Résumé IA".',
                    dateCreation: new Date(),
                    auteur: 'Test User',
                    traite: false,
                    statutTache: 'EN COURS',
                    priorite: 'NORMALE',
                    createdAt: new Date()
                  };
                  setNotes([testNote]);
                }}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                🧪 Créer une note de test
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.idNote} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">📝</span>
                        <h4 className="font-semibold text-gray-900">
                          Note pour {clientName}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(note.priorite.toLowerCase())}`}>
                          {note.priorite}
                        </span>
                        {isLongNote(note.noteSimple) && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            📄 Longue
                          </span>
                        )}
                      </div>
                      
                      {/* Affichage du contenu de la note */}
                      <div className="mb-3">
                        {summaries[note.idNote] ? (
                          <div className="space-y-2">
                            <p className="text-gray-600 text-sm font-medium bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                              🤖 Résumé IA:
                            </p>
                            <p className="text-gray-700 text-sm whitespace-pre-line">
                              {summaries[note.idNote]}
                            </p>
                            <details className="text-xs text-gray-500">
                              <summary className="cursor-pointer hover:text-gray-700">Voir le texte complet</summary>
                              <p className="mt-2 text-gray-600 text-sm whitespace-pre-line">
                                {note.noteSimple || 'Aucun contenu'}
                              </p>
                            </details>
                          </div>
                        ) : (
                          <p className="text-gray-600 text-sm whitespace-pre-line">
                            {note.noteSimple || 'Aucun contenu'}
                          </p>
                        )}
                      </div>
                      
                      {/* Bouton Résumé IA pour les notes longues */}
                      {isLongNote(note.noteSimple) && !summaries[note.idNote] && (
                        <div className="mb-3">
                          <button
                            onClick={() => generateSummary(note.idNote, note.noteSimple)}
                            disabled={loadingSummaries[note.idNote]}
                            className="px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-medium rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                          >
                            {loadingSummaries[note.idNote] ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Génération...</span>
                              </>
                            ) : (
                              <>
                                <span>🤖</span>
                                <span>Résumé IA</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-2">
                          {authorPhotos[note.auteur] ? (
                            <img 
                              src={authorPhotos[note.auteur]} 
                              alt={`Photo de ${note.auteur}`}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                              👤
                            </div>
                          )}
                          <span>{note.auteur}</span>
                        </div>
                        <span>📅 {new Date(note.dateCreation).toLocaleDateString('fr-FR')}</span>
                        <span className="text-gray-400">•</span>
                        <span>Client: {clientCode}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteNote(note.idNote)}
                      className="ml-4 text-red-500 hover:text-red-700 transition-colors"
                      title="Supprimer la note"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de détail des tâches */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedTask(null);
        }}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />
    </div>
  );
};

export default ClientNotesTasks;
