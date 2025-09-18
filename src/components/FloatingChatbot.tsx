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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsConfigured(isOpenAIConfigured());
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Construire le contexte des données
      const contextData = {
        adherents: adherentData?.slice(0, 10) || [], // Limiter pour éviter les tokens
        tasks: tasks?.slice(0, 10) || [],
        users: users?.slice(0, 10) || []
      };

      const systemPrompt = `Tu es Maurice, l'assistant IA de l'Union Commerciale. Tu es professionnel, bienveillant et expert en analyse commerciale.

Contexte des données disponibles :
- ${contextData.adherents.length} clients dans la base
- ${contextData.tasks.length} tâches en cours
- ${contextData.users.length} utilisateurs de l'équipe

Tu peux analyser les données commerciales, répondre aux questions sur les clients, et fournir des insights stratégiques. Sois précis et utilise les données quand c'est pertinent.`;

      const userPrompt = `Question: ${userMessage}

Données contextuelles:
${JSON.stringify(contextData, null, 2)}

Réponds de manière professionnelle et utile.`;

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

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-gray-500 text-center py-4">
                <p>Bonjour ! Je suis Maurice, votre assistant IA.</p>
                <p className="text-sm mt-2">Posez-moi vos questions sur vos clients et données commerciales.</p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.content}
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
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