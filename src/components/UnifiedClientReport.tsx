import React, { useState, useEffect } from 'react';
import { TodoTask } from '../types/index';
import { User } from '../types/user';
import { createTask, fetchTasks, updateTask, deleteTask, fetchUsers, createNote } from '../config/supabase-users';
// import { fetchClientNotesByCode, createClientNote, fetchClientNotes } from '../config/supabase-notes';
import { callOpenAI } from '../config/openai';
import NotesImport from './NotesImport';

interface ClientReport {
  id: string;
  clientCode: string;
  clientName: string;
  visitDate: string;
  visitType: 'prospection' | 'suivi' | 'relance' | 'commercial' | 'admin';
  keywords: string; // Mots-clés saisis par le commercial
  objectives: string; // Généré par IA
  observations: string; // Généré par IA
  actions: string; // Généré par IA
  nextVisit: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  aiGenerated: boolean; // Indique si généré par IA
}

interface UnifiedClientReportProps {
  adherentData: any[];
  tasks: TodoTask[];
  users: User[];
  onTaskUpdate: (task: TodoTask) => void;
  onTasksReload: () => void;
  autoOpenForm?: boolean;
}

const UnifiedClientReport: React.FC<UnifiedClientReportProps> = ({ adherentData, tasks, users, onTaskUpdate, onTasksReload, autoOpenForm = false }) => {
  const [reports, setReports] = useState<ClientReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [clientSearch, setClientSearch] = useState<string>('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [clientNotes, setClientNotes] = useState<any[]>([]);
  const [actionAssignments, setActionAssignments] = useState<{[key: number]: string}>({});
  
  // État pour le type de rapport (nouveau)
  const [reportType, setReportType] = useState<'visit' | 'note'>('visit');
  
  // États pour les notes simples (nouveau)
  const [simpleNote, setSimpleNote] = useState({
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    notifyUsers: [] as string[],
    aiImproved: false
  });
  const [isImprovingNote, setIsImprovingNote] = useState(false);

  // Ouvrir automatiquement le formulaire si autoOpenForm est true
  useEffect(() => {
    console.log('🔍 UnifiedClientReport - autoOpenForm:', autoOpenForm);
    if (autoOpenForm) {
      console.log('📝 UnifiedClientReport - Ouverture automatique du formulaire');
      setShowForm(true);
    }
  }, [autoOpenForm]);

  // Écouter l'événement "openQuickNote" pour ouvrir directement la note simple
  useEffect(() => {
    const handleOpenQuickNote = () => {
      console.log('⚡ Ouverture rapide de note simple');
      setReportType('note');
      setShowForm(true);
    };

    window.addEventListener('openQuickNote', handleOpenQuickNote);
    return () => window.removeEventListener('openQuickNote', handleOpenQuickNote);
  }, []);

  const [formData, setFormData] = useState<{
    clientCode: string;
    clientName: string;
    visitDate: string;
    visitType: 'prospection' | 'suivi' | 'relance' | 'commercial' | 'admin';
    keywords: string;
    objectives: string;
    observations: string;
    actions: any[] | string;
    nextVisit: string;
    assignedTo: string;
    notes: string;
  }>({
    clientCode: '',
    clientName: '',
    visitDate: new Date().toISOString().split('T')[0],
    visitType: 'commercial',
    keywords: '',
    objectives: '',
    observations: '',
    actions: [],
    nextVisit: '',
    assignedTo: '',
    notes: ''
  });

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
    setFormData(prev => ({
      ...prev,
      clientCode: client.codeUnion,
      clientName: client.raisonSociale
    }));
  };

  // Fonction pour générer le rapport avec IA
  const generateReportWithAI = async (keywords: string, visitType: string, clientName: string) => {
    try {
      setIsGeneratingAI(true);
      
      const systemPrompt = `Tu es un assistant IA spécialisé dans la rédaction de rapports de visite commerciale.
      
      À partir des mots-clés fournis par le commercial, génère un rapport de visite professionnel et structuré.
      
      Le rapport doit inclure :
      - Des objectifs clairs et mesurables
      - Des observations détaillées et pertinentes
      - Des actions concrètes à entreprendre (formatées pour créer des tâches)
      
      Sois professionnel, précis et adapté au type de visite.`;

      const userPrompt = `Génère un rapport de visite ${visitType} pour le client "${clientName}".

      Mots-clés fournis par le commercial : "${keywords}"

      Génère le rapport au format JSON :
      {
        "objectives": "Objectifs de la visite...",
        "observations": "Observations détaillées...",
        "actions": [
          {
            "title": "Titre de l'action",
            "description": "Description détaillée",
            "priority": "high|medium|low",
            "category": "commercial|admin|suivi|relance",
            "dueDate": "2024-12-31",
            "assignedTo": ""
          }
        ]
      }

      IMPORTANT : 
      - Utilise des dates valides au format YYYY-MM-DD
      - Laisse assignedTo vide (sera rempli manuellement)
      - Génère 2-3 actions maximum
      - Sois concret et actionnable`;

      const response = await callOpenAI({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      });

      // Parser la réponse JSON
      try {
        if (response.success && response.response) {
          const jsonMatch = response.response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              objectives: parsed.objectives || '',
              observations: parsed.observations || '',
              actions: parsed.actions || [] // Array d'actions
            };
          }
        }
      } catch (parseError) {
        console.warn('Erreur parsing JSON, utilisation du texte brut');
      }

      // Fallback si pas de JSON valide
      return {
        objectives: `Objectifs de la visite ${visitType} : ${keywords}`,
        observations: `Observations basées sur : ${keywords}`,
        actions: [] // Array vide en fallback
      };

    } catch (error) {
      console.error('Erreur génération IA:', error);
      return {
        objectives: `Objectifs de la visite ${visitType} : ${keywords}`,
        observations: `Observations basées sur : ${keywords}`,
        actions: [] // Array vide en cas d'erreur
      };
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Fonction pour générer le rapport automatiquement
  const handleGenerateReport = async () => {
    if (!formData.keywords.trim() || !formData.clientCode) {
      alert('Veuillez saisir des mots-clés et sélectionner un client');
      return;
    }

    const aiContent = await generateReportWithAI(
      formData.keywords,
      formData.visitType,
      formData.clientName
    );

    setFormData(prev => ({
      ...prev,
      objectives: aiContent.objectives,
      observations: aiContent.observations,
      actions: aiContent.actions
    }));

    // Si des actions sont générées, initialiser les assignations vides
    if (Array.isArray(aiContent.actions) && aiContent.actions.length > 0) {
      const initialAssignments: {[key: number]: string} = {};
      aiContent.actions.forEach((_, index) => {
        initialAssignments[index] = '';
      });
      setActionAssignments(initialAssignments);
    }
  };

  // Fonction pour créer un rapport
  const handleCreateReport = async () => {
    if (!formData.clientCode || !formData.visitDate) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      // Créer la note du rapport
      const reportNote = await createNote({
        codeUnion: formData.clientCode,
        noteSimple: `Rapport de visite ${formData.visitType}\n\nObjectifs: ${formData.objectives}\n\nObservations: ${formData.observations}\n\nActions: ${Array.isArray(formData.actions) ? formData.actions.map(a => typeof a === 'object' ? a.title : a).join(', ') : formData.actions}`,
        auteur: 'Commercial', // À remplacer par l'utilisateur connecté
        dateCreation: formData.visitDate
      });

      // Créer les tâches à partir des actions avec assignations
      if (Array.isArray(formData.actions) && formData.actions.length > 0) {
        for (let index = 0; index < formData.actions.length; index++) {
          const action = formData.actions[index];
          if (action.title && action.description) {
            await createTask({
              clientCode: formData.clientCode,
              title: action.title,
              description: action.description,
              status: 'pending',
              priority: action.priority || 'medium',
              category: action.category || 'commercial',
              assignedTo: actionAssignments[index] || action.assignedTo || '',
              dueDate: action.dueDate,
              typeNote: 'TASK'
            });
          }
        }
      }

      console.log('✅ Rapport créé avec succès:', reportNote);
      alert('✅ Rapport créé avec succès ! Les tâches ont été générées automatiquement.');
      
      // Recharger les données
      handleImportComplete();
      
      // Recharger les tâches pour l'onglet Tâches
      onTasksReload();
      
      // Reset du formulaire
      setFormData({
        clientCode: '',
        clientName: '',
        visitDate: '',
        visitType: 'prospection',
        keywords: '',
        objectives: '',
        observations: '',
        actions: [],
        nextVisit: '',
        assignedTo: '',
        notes: ''
      });
      setShowForm(false);

    } catch (error) {
      console.error('❌ Erreur lors de la création du rapport:', error);
      alert('❌ Erreur lors de la création du rapport');
    }
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

      // Reset du formulaire
      setSimpleNote({ 
        content: '', 
        priority: 'medium', 
        notifyUsers: [], 
        aiImproved: false 
      });
      setSelectedClient('');
      setClientSearch('');
      setShowForm(false);

      alert(`✅ Note créée avec succès !${simpleNote.notifyUsers.length > 0 ? ` (${simpleNote.notifyUsers.length} personne(s) notifiée(s))` : ''}`);
      
      // Recharger les données
      handleImportComplete();
      onTasksReload();

    } catch (error) {
      console.error('❌ Erreur lors de la création de la note:', error);
      alert('❌ Erreur lors de la création de la note');
    }
  };

  // Fonction pour obtenir le nom d'utilisateur par email
  const getUserNameByEmail = (email: string) => {
    const user = users.find(u => u.email === email);
    return user ? `${user.prenom} ${user.nom}` : email;
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Fonction pour obtenir l'icône du type de visite
  const getVisitTypeIcon = (type: string) => {
    switch (type) {
      case 'prospection': return '🔍';
      case 'suivi': return '📋';
      case 'relance': return '📞';
      case 'commercial': return '💼';
      case 'admin': return '⚙️';
      default: return '📝';
    }
  };

  // Charger les notes existantes
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const tasks = await fetchTasks();
        // Filtrer seulement les notes (pas les tâches)
        const notes = tasks.filter(task => task.typeNote === 'NOTE SIMPLE');
        setClientNotes(notes);
        console.log('📝 Notes chargées:', notes.length);
      } catch (error) {
        console.error('❌ Erreur chargement notes:', error);
      }
    };
    loadNotes();
  }, []);

  // Filtrer les rapports
  const filteredReports = reports.filter(report => {
    const statusMatch = filterStatus === 'all' || report.status === filterStatus;
    const userMatch = filterUser === 'all' || report.assignedTo === filterUser;
    return statusMatch && userMatch;
  });

  // Fonction pour recharger les notes après import
  const handleImportComplete = async () => {
    try {
      const tasks = await fetchTasks();
      // Filtrer seulement les notes (pas les tâches)
      const notes = tasks.filter(task => task.typeNote === 'NOTE SIMPLE');
      setClientNotes(notes);
      console.log('✅ Notes rechargées après import:', notes.length);
    } catch (error) {
      console.error('❌ Erreur rechargement notes:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📋 Rapports de Visite</h2>
          <p className="text-gray-600">Système unifié : Rapports + Tâches + IA pour commerciaux</p>
        </div>
        <div className="flex gap-2">
          {/* Boutons de création clairs */}
          <button
            onClick={() => {
              setReportType('visit');
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2"
          >
            📋 Rapport de visite complet
          </button>
          
          <button
            onClick={() => {
              setReportType('note');
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 flex items-center gap-2"
          >
            📝 Note simple rapide
          </button>
          
          <button
            onClick={() => setShowImport(!showImport)}
            className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 flex items-center gap-2"
          >
            📥 Import Notes
          </button>
        </div>
      </div>

      {/* Formulaire de création optimisé */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            {reportType === 'visit' ? '📋 Rapport de Visite Complet' : '📝 Note Simple Rapide'}
          </h3>
          
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

            {/* Formulaire de note simple */}
            {reportType === 'note' && (
              <>
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
              </>
            )}

            {/* Formulaire de rapport de visite (existant) */}
            {reportType === 'visit' && (
              <>
                {/* Date de visite */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📅 Date de visite *
              </label>
              <input
                type="date"
                value={formData.visitDate}
                onChange={(e) => setFormData({...formData, visitDate: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type de visite */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🏷️ Type de visite
              </label>
              <select
                value={formData.visitType}
                onChange={(e) => setFormData({...formData, visitType: e.target.value as any})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="prospection">🔍 Prospection</option>
                <option value="suivi">📋 Suivi</option>
                <option value="relance">📞 Relance</option>
                <option value="commercial">💼 Commercial</option>
                <option value="admin">⚙️ Administratif</option>
              </select>
            </div>

            {/* Mots-clés pour IA */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🤖 Mots-clés pour l'IA (ce que vous avez observé)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                  placeholder="Ex: client intéressé, problème technique, négociation prix, besoin formation..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleGenerateReport}
                  disabled={isGeneratingAI || !formData.keywords.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                >
                  {isGeneratingAI ? '⏳' : '🤖'}
                  {isGeneratingAI ? 'Génération...' : 'Générer'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                💡 L'IA va générer automatiquement objectifs, observations et actions
              </p>
            </div>

            {/* Objectifs générés par IA */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🎯 Objectifs (générés par IA)
              </label>
              <textarea
                value={formData.objectives}
                onChange={(e) => setFormData({...formData, objectives: e.target.value})}
                placeholder="Les objectifs seront générés automatiquement par l'IA..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
            </div>

            {/* Observations générées par IA */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                👁️ Observations (générées par IA)
              </label>
              <textarea
                value={formData.observations}
                onChange={(e) => setFormData({...formData, observations: e.target.value})}
                placeholder="Les observations seront générées automatiquement par l'IA..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
            </div>

            {/* Actions générées par IA */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ⚡ Actions (générées par IA)
              </label>
              
              {Array.isArray(formData.actions) && formData.actions.length > 0 ? (
                <div className="space-y-3">
                  {formData.actions.map((action, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {typeof action === 'object' ? action.title : action}
                          </h4>
                          {typeof action === 'object' && action.description && (
                            <p className="text-xs text-gray-600 mt-1">
                              {action.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {typeof action === 'object' && action.priority && (
                              <span className={`px-2 py-1 rounded text-xs ${
                                action.priority === 'high' ? 'bg-red-100 text-red-800' :
                                action.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {action.priority === 'high' ? '🔴 Urgent' :
                                 action.priority === 'medium' ? '🟡 Moyen' : '🟢 Faible'}
                              </span>
                            )}
                            {typeof action === 'object' && action.category && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {action.category}
                              </span>
                            )}
                            {typeof action === 'object' && action.dueDate && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                                📅 {action.dueDate}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-48">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Assigner à :
                          </label>
                          <select
                            value={actionAssignments[index] || ''}
                            onChange={(e) => setActionAssignments(prev => ({
                              ...prev,
                              [index]: e.target.value
                            }))}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Non assigné</option>
                            {users.map(user => (
                              <option key={user.id} value={user.email}>
                                {user.prenom} {user.nom}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <textarea
                  value={formData.actions}
                  onChange={(e) => setFormData({...formData, actions: e.target.value})}
                  placeholder="Les actions seront générées automatiquement par l'IA..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              )}
            </div>

            {/* Prochaine visite */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📅 Prochaine visite
              </label>
              <input
                type="date"
                value={formData.nextVisit}
                onChange={(e) => setFormData({...formData, nextVisit: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Assigné à */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                👤 Assigné à
              </label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Sélectionner un utilisateur --</option>
                {users.map(user => (
                  <option key={user.id} value={user.email}>
                    {user.prenom} {user.nom} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Notes supplémentaires */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📝 Notes supplémentaires
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Autres informations importantes..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
            </div>
              </>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={reportType === 'visit' ? handleCreateReport : handleCreateSimpleNote}
              disabled={loading || !selectedClient || (reportType === 'visit' ? !formData.visitDate : !simpleNote.content.trim())}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              {loading ? '⏳ Création...' : reportType === 'visit' ? '✅ Créer le Rapport' : '✅ Créer la Note'}
            </button>
          </div>
        </div>
      )}

      {/* Interface d'import des notes */}
      {showImport && (
        <NotesImport onImportComplete={handleImportComplete} />
      )}

      {/* Affichage des notes existantes */}
      {clientNotes.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold mb-3">📝 Notes Existantes ({clientNotes.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientNotes.slice(0, 6).map((note, index) => (
              <div key={note.id || index} className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-sm text-gray-900">{note.clientCode}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {note.noteSimple && note.noteSimple.length > 100 
                    ? note.noteSimple.substring(0, 100) + '...' 
                    : note.noteSimple || note.description || 'Pas de contenu'
                  }
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {note.auteur} • {new Date(note.createdAt).toLocaleDateString('fr-FR')}
                </div>
              </div>
            ))}
          </div>
          {clientNotes.length > 6 && (
            <div className="text-center mt-3">
              <span className="text-sm text-gray-500">
                ... et {clientNotes.length - 6} autres notes
              </span>
            </div>
          )}
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="planned">Planifiée</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Utilisateur</label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les utilisateurs</option>
              {users.map(user => (
                <option key={user.id} value={user.email}>
                  {user.prenom} {user.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des rapports */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <p>Aucun rapport de visite créé</p>
            <p className="text-sm">Cliquez sur "Nouveau Rapport" pour commencer</p>
          </div>
        ) : (
          filteredReports.map(report => (
            <div key={report.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {getVisitTypeIcon(report.visitType)} {report.clientName}
                    {report.aiGenerated && <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">🤖 IA</span>}
                  </h3>
                  <p className="text-sm text-gray-600">Code: {report.clientCode}</p>
                  <p className="text-sm text-gray-500">
                    📅 {new Date(report.visitDate).toLocaleDateString('fr-FR')}
                  </p>
                  {report.keywords && (
                    <p className="text-xs text-blue-600 mt-1">
                      🔑 Mots-clés: {report.keywords}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(report.status)}`}>
                    {report.status === 'planned' ? '📅 Planifiée' :
                     report.status === 'in_progress' ? '🔄 En cours' :
                     report.status === 'completed' ? '✅ Terminée' :
                     '❌ Annulée'}
                  </span>
                  {report.assignedTo && (
                    <span className="text-xs text-gray-500">
                      👤 {getUserNameByEmail(report.assignedTo)}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {report.objectives && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">🎯 Objectifs</h4>
                    <p className="text-sm text-gray-600">{report.objectives}</p>
                  </div>
                )}
                
                {report.observations && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">👁️ Observations</h4>
                    <p className="text-sm text-gray-600">{report.observations}</p>
                  </div>
                )}
                
                {report.actions && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">⚡ Actions</h4>
                    <p className="text-sm text-gray-600">
                      {Array.isArray(report.actions) ? report.actions.map(a => typeof a === 'object' ? a.title : a).join(', ') : report.actions}
                    </p>
                  </div>
                )}
                
                {report.nextVisit && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">📅 Prochaine visite</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(report.nextVisit).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>

              {report.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-1">📝 Notes</h4>
                  <p className="text-sm text-gray-600">{report.notes}</p>
                </div>
              )}

              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Créé le {new Date(report.createdAt).toLocaleDateString('fr-FR')} à {new Date(report.createdAt).toLocaleTimeString('fr-FR')}
                </div>
                <div className="flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    ✏️ Modifier
                  </button>
                  <button className="text-red-600 hover:text-red-800 text-sm">
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default UnifiedClientReport;
