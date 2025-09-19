import React, { useState, useRef, useEffect, useCallback } from 'react';
import { callOpenAI } from '../config/openai';
import { isOpenAIConfigured } from '../config/openai-config';

interface FloatingChatbotProps {
  adherentData?: any[];
  tasks?: any[];
  users?: any[];
}

const FloatingChatbot: React.FC<FloatingChatbotProps> = ({ 
  adherentData = [], 
  tasks = [], 
  users = [] 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [clientSearch, setClientSearch] = useState('');
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [showPrompts, setShowPrompts] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsConfigured(isOpenAIConfigured());
  }, []);

  // Fonction pour obtenir la liste des clients uniques (même logique que les rapports de visite)
  const getUniqueClients = useCallback(() => {
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
  }, [adherentData]);

  // Filtrer les clients pour l'autocomplétion (même logique que les rapports de visite)
  useEffect(() => {
    if (clientSearch.length > 0) {
      const searchTerm = clientSearch.toLowerCase();
      const filtered = getUniqueClients().filter(client => 
        client.codeUnion.toLowerCase().includes(searchTerm) ||
        client.raisonSociale.toLowerCase().includes(searchTerm) ||
        (client.groupeClient && client.groupeClient.toLowerCase().includes(searchTerm))
      ).slice(0, 10); // Augmenté à 10 comme dans les rapports
      setFilteredClients(filtered);
    } else {
      setFilteredClients([]);
    }
  }, [clientSearch, adherentData, getUniqueClients]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Prompts prédéfinis
  const predefinedPrompts = [
    {
      id: 'analyze-client',
      title: '📊 Brief complet',
      shortDescription: 'Analyse complète avec chiffres consolidés, évolution, notes et actions',
      prompt: `Génère un BRIEF COMPLET et détaillé de ce client en consolidant :

1. CHIFFRES CONSOLIDÉS :
   - CA total 2024 vs 2025 (montant exact + évolution %)
   - Répartition par fournisseur (top 3 avec montants et %)
   - Progression/regression par fournisseur

2. ANALYSE ÉVOLUTION :
   - Tendance générale (progression/stable/regression)
   - Fournisseurs en croissance vs en baisse
   - Points d'attention chiffrés

3. NOTES DÉTAILLÉES :
   - Liste chronologique des notes prises
   - Contenu exact de chaque note
   - Dates et contexte

4. ACTIONS & TÂCHES :
   - Tâches en cours avec statut
   - Rapports de visite récents
   - Actions prioritaires à mener
   - Suivi recommandé

5. SYNTHÈSE EXÉCUTIVE :
   - Situation actuelle en 3 points clés
   - Recommandations immédiates
   - Potentiel de développement

Utilise les données consolidées exactes et sois très précis sur les chiffres.`,
      icon: '📊'
    },
    {
      id: 'performance-summary',
      title: '📈 Résumé performance',
      shortDescription: 'Chiffres clés et performance du client',
      prompt: 'Donne-moi un résumé de la performance de ce client avec les chiffres clés.',
      icon: '📈'
    },
    {
      id: 'tasks-notes',
      title: '📝 Notes & Actions',
      shortDescription: 'Toutes les notes, tâches et rapports de visite',
      prompt: `Détaille TOUTES les notes et actions de ce client :

NOTES CHRONOLOGIQUES :
- Liste toutes les notes par date (plus récente en premier)
- Contenu exact de chaque note
- Type de note (NOTE SIMPLE, RAPPORT VISITE, etc.)
- Contexte et détails importants

TÂCHES & ACTIONS :
- Toutes les tâches en cours avec statut
- Tâches terminées récemment
- Priorités et échéances
- Actions de suivi recommandées

RAPPORTS DE VISITE :
- Détail des derniers rapports
- Points clés discutés
- Engagements pris
- Prochaines étapes planifiées

SYNTHÈSE ACTIONS :
- Actions prioritaires à mener
- Suivi recommandé
- Points d'attention`,
      icon: '📝'
    },
    {
      id: 'suppliers-analysis',
      title: '🏢 Analyse fournisseurs',
      shortDescription: 'Performance détaillée par fournisseur',
      prompt: `Analyse DÉTAILLÉE de la performance par fournisseur :

CHIFFRES PAR FOURNISSEUR :
- CA 2024 vs 2025 pour chaque fournisseur (montants exacts)
- Évolution en % et en valeur absolue
- Part de marché de chaque fournisseur
- Classement par performance

ANALYSE ÉVOLUTION :
- Fournisseurs en forte croissance (+10% et plus)
- Fournisseurs en baisse (-5% et plus)
- Fournisseurs stables
- Nouveaux fournisseurs vs anciens

RECOMMANDATIONS FOURNISSEURS :
- Actions à mener avec chaque fournisseur
- Potentiel de développement
- Risques identifiés
- Opportunités de croissance`,
      icon: '🏢'
    },
    {
      id: 'recommendations',
      title: '💡 Plan d\'action',
      shortDescription: 'Stratégie et actions recommandées',
      prompt: `Élabore un PLAN D'ACTION STRATÉGIQUE pour ce client :

ANALYSE SITUATION :
- Forces et faiblesses du client
- Opportunités et menaces
- Position concurrentielle

OBJECTIFS PRIORITAIRES :
- Objectifs CA à 3-6-12 mois
- Objectifs par fournisseur
- Objectifs de développement

ACTIONS IMMÉDIATES (0-30 jours) :
- Actions commerciales prioritaires
- Visites à planifier
- Suivi à mettre en place

ACTIONS MOYEN TERME (1-6 mois) :
- Développement de nouveaux fournisseurs
- Renforcement des relations
- Optimisation du portefeuille

MÉTRIQUES DE SUIVI :
- KPIs à surveiller
- Points de contrôle
- Indicateurs d'alerte`,
      icon: '💡'
    },
    {
      id: 'global-insights',
      title: '🌍 Vue d\'ensemble',
      shortDescription: 'Tendances globales et insights',
      prompt: 'Donne-moi une vue d\'ensemble de tous mes clients et les tendances principales.',
      icon: '🌍'
    }
  ];

  // Fonction pour obtenir les données consolidées d'un client
  const getClientData = (clientCode: string) => {
    const clientLines = adherentData.filter(c => c.codeUnion === clientCode);
    if (clientLines.length === 0) return null;

    const firstClient = clientLines[0];
    
    // Consolidation des CA par année
    const ca2024 = clientLines.filter(item => item.annee === 2024).reduce((sum, item) => sum + (item.ca || 0), 0);
    const ca2025 = clientLines.filter(item => item.annee === 2025).reduce((sum, item) => sum + (item.ca || 0), 0);
    const progression = ca2024 > 0 ? ((ca2025 - ca2024) / ca2024) * 100 : 0;

    // Tâches et notes du client avec analyse détaillée
    const clientTasks = tasks.filter(t => t.clientCode === clientCode);
    const clientNotes = tasks.filter(t => t.clientCode === clientCode && t.typeNote === 'NOTE SIMPLE');
    const clientReports = tasks.filter(t => t.clientCode === clientCode && t.typeNote === 'RAPPORT VISITE');
    
    // Analyse des notes par priorité et récence
    const recentNotes = clientNotes
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5); // 5 notes les plus récentes
    
    const urgentTasks = clientTasks.filter(t => t.priority === 'urgent' && t.status !== 'completed');
    const overdueTasks = clientTasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      return new Date(t.dueDate) < new Date();
    });
    
    // Analyse des rapports de visite
    const recentReports = clientReports
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3); // 3 rapports les plus récents
    
    // Analyse des tendances temporelles
    const notesByMonth = clientNotes.reduce((acc, note) => {
      const month = new Date(note.createdAt).toISOString().substring(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Détection des patterns et alertes
    const alerts = [];
    if (overdueTasks.length > 0) alerts.push(`${overdueTasks.length} tâche(s) en retard`);
    if (urgentTasks.length > 0) alerts.push(`${urgentTasks.length} tâche(s) urgente(s)`);
    if (clientNotes.length === 0) alerts.push('Aucune note récente');
    if (clientReports.length === 0) alerts.push('Aucun rapport de visite récent');
    
    // Analyse des fournisseurs mentionnés dans les notes
    const fournisseursMentionnes = new Set<string>();
    [...clientNotes, ...clientReports].forEach(item => {
      const content = `${item.title || ''} ${item.description || ''} ${item.noteSimple || ''} ${item.noteIa || ''}`.toLowerCase();
      fournisseursMap.forEach((_, fournisseur) => {
        if (content.includes(fournisseur.toLowerCase())) {
          fournisseursMentionnes.add(fournisseur);
        }
      });
    });

    // Performance par fournisseur
    const fournisseursMap = new Map<string, { ca2024: number; ca2025: number }>();
    clientLines.forEach(item => {
      if (!fournisseursMap.has(item.fournisseur)) {
        fournisseursMap.set(item.fournisseur, { ca2024: 0, ca2025: 0 });
      }
      const fournisseur = fournisseursMap.get(item.fournisseur)!;
      if (item.annee === 2024) fournisseur.ca2024 += item.ca || 0;
      if (item.annee === 2025) fournisseur.ca2025 += item.ca || 0;
    });

    const fournisseursPerformance = Array.from(fournisseursMap.entries())
      .map(([fournisseur, data]) => ({
        fournisseur,
        ca2024: data.ca2024,
        ca2025: data.ca2025,
        progression: data.ca2024 > 0 ? ((data.ca2025 - data.ca2024) / data.ca2024) * 100 : 0
      }))
      .sort((a, b) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));

    return {
      client: {
        codeUnion: firstClient.codeUnion,
        raisonSociale: firstClient.raisonSociale,
        groupeClient: firstClient.groupeClient,
        regionCommerciale: firstClient.regionCommerciale,
        ca2024,
        ca2025,
        progression: Math.round(progression * 10) / 10,
        statut: progression > 5 ? 'progression' : progression < -5 ? 'regression' : 'stable'
      },
      tasks: clientTasks,
      notes: clientNotes,
      reports: clientReports,
      fournisseursPerformance,
      // Nouvelles données enrichies
      recentNotes,
      recentReports,
      urgentTasks,
      overdueTasks,
      notesByMonth,
      alerts,
      fournisseursMentionnes: Array.from(fournisseursMentionnes),
      stats: {
        totalCA2024: ca2024,
        totalCA2025: ca2025,
        progression: Math.round(progression * 10) / 10,
        totalTasks: clientTasks.length,
        totalNotes: clientNotes.length,
        totalReports: clientReports.length,
        fournisseursCount: fournisseursMap.size,
        urgentTasksCount: urgentTasks.length,
        overdueTasksCount: overdueTasks.length,
        recentActivityScore: recentNotes.length + recentReports.length
      }
    };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      setIsLoading(true);

      // Si un client est sélectionné, inclure ses données consolidées
      let contextData = '';
      if (selectedClient) {
        const clientData = getClientData(selectedClient);
        if (clientData) {
          contextData = `\n\nDONNÉES CLIENT SÉLECTIONNÉ (${selectedClient}):\n` +
            `Client: ${clientData.client.raisonSociale} (${clientData.client.codeUnion})\n` +
            `Groupe: ${clientData.client.groupeClient}\n` +
            `Région: ${clientData.client.regionCommerciale}\n` +
            `CA 2024: ${clientData.stats.totalCA2024.toLocaleString()}€\n` +
            `CA 2025: ${clientData.stats.totalCA2025.toLocaleString()}€\n` +
            `Progression: ${clientData.stats.progression}%\n` +
            `Statut: ${clientData.client.statut}\n\n` +
            
            `🚨 ALERTES PRIORITAIRES:\n` +
            (clientData.alerts.length > 0 ? clientData.alerts.map(alert => `- ${alert}`).join('\n') : '- Aucune alerte') + '\n\n' +
            
            `📊 ACTIVITÉ RÉCENTE:\n` +
            `- Score d'activité: ${clientData.stats.recentActivityScore}/8\n` +
            `- Tâches urgentes: ${clientData.stats.urgentTasksCount}\n` +
            `- Tâches en retard: ${clientData.stats.overdueTasksCount}\n` +
            `- Notes récentes: ${clientData.stats.totalNotes}\n` +
            `- Rapports récents: ${clientData.stats.totalReports}\n\n` +
            
            `💰 PERFORMANCE PAR FOURNISSEUR:\n` +
            clientData.fournisseursPerformance.map(f => 
              `- ${f.fournisseur}: ${f.ca2024.toLocaleString()}€ → ${f.ca2025.toLocaleString()}€ (${f.progression.toFixed(1)}%)`
            ).join('\n') + '\n\n' +
            
            `📝 NOTES RÉCENTES DÉTAILLÉES:\n` +
            (clientData.recentNotes.length > 0 ? 
              clientData.recentNotes.map(n => 
                `- ${new Date(n.createdAt).toLocaleDateString()}: ${n.title}\n  Contenu: ${n.noteSimple || n.description || 'Aucun contenu détaillé'}\n  Auteur: ${n.auteur || 'Non spécifié'}`
              ).join('\n\n') : 
              'Aucune note récente') + '\n\n' +
            
            `📋 RAPPORTS DE VISITE RÉCENTS:\n` +
            (clientData.recentReports.length > 0 ? 
              clientData.recentReports.map(r => 
                `- ${new Date(r.createdAt).toLocaleDateString()}: ${r.title}\n  Contenu: ${r.noteSimple || r.description || 'Aucun contenu détaillé'}\n  Auteur: ${r.auteur || 'Non spécifié'}`
              ).join('\n\n') : 
              'Aucun rapport récent') + '\n\n' +
            
            `⚡ TÂCHES URGENTES/EN RETARD:\n` +
            (clientData.urgentTasks.length > 0 ? 
              clientData.urgentTasks.map(t => 
                `- URGENT: ${t.title} (${t.status}) - Échéance: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'Non définie'}`
              ).join('\n') : 
              'Aucune tâche urgente') + '\n' +
            (clientData.overdueTasks.length > 0 ? 
              clientData.overdueTasks.map(t => 
                `- EN RETARD: ${t.title} (${t.status}) - Échéance: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'Non définie'}`
              ).join('\n') : 
              'Aucune tâche en retard') + '\n\n' +
            
            `🏷️ FOURNISSEURS MENTIONNÉS DANS LES NOTES:\n` +
            (clientData.fournisseursMentionnes.length > 0 ? 
              clientData.fournisseursMentionnes.join(', ') : 
              'Aucun fournisseur mentionné dans les notes');
        }
      }

      const systemPrompt = `Tu es Maurice, l'assistant IA spécialisé dans l'analyse des données commerciales du Groupement Union.

CONTEXTE:
- Tu analyses ${adherentData.length} lignes de données clients
- ${getUniqueClients().length} clients uniques dans la base
- Données consolidées par client (CA 2024/2025, progression, fournisseurs)
- Accès aux tâches, notes et rapports de visite

DONNÉES ENRICHIES DISPONIBLES:
- Notes récentes (5 plus récentes) avec contenu détaillé
- Rapports de visite récents (3 plus récents) avec contexte
- Tâches urgentes et en retard avec priorités
- Alertes automatiques (tâches en retard, manque d'activité)
- Fournisseurs mentionnés dans les notes
- Tendances temporelles d'activité
- Score d'activité récente

EXPERTISE:
- Analyse de performance commerciale
- Consolidation de chiffres par client et fournisseur
- Recommandations stratégiques
- Suivi des actions et tâches
- Analyse contextuelle des notes et rapports

${contextData}

RÉPONDRE EN FRANÇAIS, de manière professionnelle, précise et actionnable. 
Utilise les données exactes et sois très spécifique sur les chiffres.
Analyse le CONTENU des notes, pas juste les titres génériques.
Identifie les patterns, alertes et opportunités prioritaires.`;

      const response = await callOpenAI({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]
      });

      if (response.success && response.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.response! }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Erreur: ${response.error || 'Réponse invalide de l\'API'}` 
        }]);
      }
    } catch (error) {
      console.error('Erreur Maurice:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Erreur de connexion. Vérifiez votre configuration OpenAI.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectClient = (client: any) => {
    setSelectedClient(client.codeUnion);
    setClientSearch(`${client.codeUnion} - ${client.raisonSociale}`);
    setFilteredClients([]);
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: `✅ Client sélectionné : ${client.raisonSociale} (${client.codeUnion})\n\nJe peux maintenant analyser ses données, tâches et notes. Que souhaitez-vous savoir ?` 
    }]);
  };

  const clearClientSelection = () => {
    setSelectedClient('');
    setClientSearch('');
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: '✅ Sélection de client effacée. Je peux maintenant analyser l\'ensemble de vos données.' 
    }]);
  };

  const handlePredefinedPrompt = (prompt: string) => {
    setInputValue(prompt);
    setShowPrompts(false);
    // Déclencher l'envoi automatique
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  if (!isConfigured) {
    return (
      <div className="fixed bottom-4 right-4">
        <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Maurice : Configuration OpenAI requise
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Bouton flottant */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">🤖</span>
            <span className="font-semibold">Maurice</span>
          </div>
        </button>
      )}

      {/* Interface de chat */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-[500px] h-[600px] flex flex-col border border-gray-200">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🤖</span>
              <span className="font-semibold">Maurice - Assistant IA</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  console.log('Toggle prompts:', !showPrompts);
                  setShowPrompts(!showPrompts);
                }}
                className={`text-white hover:text-gray-200 transition-colors text-sm px-2 py-1 rounded ${
                  showPrompts ? 'bg-blue-800' : 'bg-blue-700 hover:bg-blue-800'
                }`}
                title="Prompts prédéfinis"
              >
                💡 {showPrompts ? '▼' : '▶'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 text-xl"
              >
                ×
              </button>
            </div>
          </div>

          {/* Prompts prédéfinis */}
          {showPrompts && (
            <div className="p-3 bg-gray-50 border-b border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">💡 Questions rapides :</div>
              <div className="grid grid-cols-2 gap-2">
                {predefinedPrompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => handlePredefinedPrompt(prompt.prompt)}
                    className="text-left p-2 bg-white rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors text-xs"
                    disabled={isLoading}
                  >
                    <div className="flex items-center space-x-1 mb-1">
                      <span>{prompt.icon}</span>
                      <span className="font-medium">{prompt.title}</span>
                    </div>
                    <div className="text-gray-600 text-xs line-clamp-2">
                      {prompt.shortDescription || prompt.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sélection de client */}
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Rechercher un client..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {selectedClient && (
                <button
                  onClick={clearClientSelection}
                  className="absolute right-2 top-2 text-gray-500 hover:text-red-500"
                  title="Effacer la sélection"
                >
                  ✕
                </button>
              )}
            </div>
            {clientSearch && filteredClients.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {filteredClients.map((client, index) => (
                  <div
                    key={`${client.codeUnion}-${index}`}
                    onClick={() => selectClient(client)}
                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    <div className="font-medium">{client.codeUnion} - {client.raisonSociale}</div>
                    {client.groupeClient && (
                      <div className="text-gray-500 text-xs">{client.groupeClient}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {filteredClients.length} client(s) trouvé(s) sur {getUniqueClients().length} clients uniques
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">🤖</div>
                <p>Bonjour ! Je suis Maurice, votre assistant IA.</p>
                <p className="text-sm mt-1">Sélectionnez un client ou posez-moi une question !</p>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800 border border-gray-200'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    <span>Maurice réfléchit...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question ou utilisez les prompts prédéfinis..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? '...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingChatbot;