import React, { useState, useRef, useEffect } from 'react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsConfigured(isOpenAIConfigured());
  }, []);

  // Filtrer les clients pour l'autocomplétion
  useEffect(() => {
    if (clientSearch.length > 0) {
      const filtered = adherentData.filter(client => 
        client.raisonSociale?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        client.codeUnion?.toLowerCase().includes(clientSearch.toLowerCase())
      ).slice(0, 5);
      setFilteredClients(filtered);
    } else {
      setFilteredClients([]);
    }
  }, [clientSearch, adherentData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getClientData = (clientCode: string) => {
    const client = adherentData.find(c => c.codeUnion === clientCode);
    if (!client) return null;

    const clientTasks = tasks.filter(t => t.clientCode === clientCode);
    const clientNotes = tasks.filter(t => t.clientCode === clientCode && t.type === 'note');

    return {
      client,
      tasks: clientTasks,
      notes: clientNotes,
      stats: {
        totalCA: client.ca || 0,
        year: client.annee || 'N/A',
        supplier: client.fournisseur || 'N/A'
      }
    };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      let contextData = {};
      let systemPrompt = `Tu es Maurice, l'assistant IA expert de l'Union Commerciale. Tu es professionnel, bienveillant et spécialisé en analyse commerciale.

Tu as accès aux données suivantes :
- ${adherentData.length} clients dans la base
- ${tasks.length} tâches et notes
- ${users.length} utilisateurs de l'équipe

Tu peux analyser les données commerciales, répondre aux questions sur les clients, et fournir des insights stratégiques.`;

      // Si un client est sélectionné, inclure ses données détaillées
      if (selectedClient) {
        const clientData = getClientData(selectedClient);
        if (clientData) {
          contextData = {
            clientSelected: {
              code: selectedClient,
              raisonSociale: clientData.client.raisonSociale,
              stats: clientData.stats,
              tasks: clientData.tasks.slice(0, 10),
              notes: clientData.notes.slice(0, 10)
            }
          };
          
          systemPrompt += `\n\nCLIENT SÉLECTIONNÉ : ${clientData.client.raisonSociale} (${selectedClient})
Données du client :
- CA: ${clientData.stats.totalCA}€
- Année: ${clientData.stats.year}
- Fournisseur: ${clientData.stats.supplier}
- Tâches: ${clientData.tasks.length}
- Notes: ${clientData.notes.length}`;
        }
      } else {
        contextData = {
          adherents: adherentData.slice(0, 20),
          tasks: tasks.slice(0, 20),
          users: users.slice(0, 10)
        };
      }

      const userPrompt = `Question: ${userMessage}

Données contextuelles:
${JSON.stringify(contextData, null, 2)}

Réponds de manière professionnelle et utile. Si un client est sélectionné, concentre-toi sur ses données spécifiques.`;

      const response = await callOpenAI({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      });

      if (response.success && response.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.response! }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Désolé, je rencontre un problème technique. Veuillez réessayer plus tard.' 
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
    setClientSearch(client.raisonSociale);
    setFilteredClients([]);
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: `✅ Client sélectionné : ${client.raisonSociale} (${client.codeUnion})\n\nJe peux maintenant analyser ses données, tâches et notes. Que souhaitez-vous savoir ?` 
    }]);
  };

  const clearClientSelection = () => {
    setSelectedClient('');
    setClientSearch('');
    setFilteredClients([]);
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: '✅ Sélection de client effacée. Je peux maintenant analyser l\'ensemble de vos données.' 
    }]);
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
        <div className="bg-white rounded-lg shadow-2xl w-96 h-96 flex flex-col border border-gray-200">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🤖</span>
              <span className="font-semibold">Maurice - Assistant IA</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 text-xl"
            >
              ×
            </button>
          </div>

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
              
              {/* Liste des clients filtrés */}
              {filteredClients.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                  {filteredClients.map((client) => (
                    <button
                      key={client.codeUnion}
                      onClick={() => selectClient(client)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                    >
                      <div className="font-medium">{client.raisonSociale}</div>
                      <div className="text-gray-500 text-xs">{client.codeUnion}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {selectedClient && (
              <div className="mt-2 text-xs text-blue-600">
                ✅ Client sélectionné : {clientSearch}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-gray-500 text-center py-4">
                <p>Bonjour ! Je suis Maurice, votre assistant IA.</p>
                <p className="text-sm mt-2">Sélectionnez un client ou posez-moi vos questions sur vos données commerciales.</p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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
                placeholder="Posez votre question..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingChatbot;