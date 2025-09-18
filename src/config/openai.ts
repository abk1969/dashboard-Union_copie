// Configuration pour l'API OpenAI - Version sécurisée
import { getOpenAIApiKey, OPENAI_CONFIG } from './openai-config';

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  success: boolean;
  response?: string;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatCompletionRequest {
  messages: OpenAIMessage[];
  conversationId?: string;
  maxTokens?: number;
  temperature?: number;
}

// Fonction pour appeler l'API OpenAI
export const callOpenAI = async (request: ChatCompletionRequest): Promise<OpenAIResponse> => {
  try {
    const apiKey = getOpenAIApiKey();
    
    if (!apiKey) {
      return {
        success: false,
        error: 'Clé API OpenAI non configurée. Vérifiez vos variables d\'environnement.'
      };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: OPENAI_CONFIG.MODEL,
        messages: request.messages,
        max_tokens: request.maxTokens || OPENAI_CONFIG.MAX_TOKENS,
        temperature: request.temperature || OPENAI_CONFIG.TEMPERATURE,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        return {
          success: false,
          error: 'Clé API OpenAI invalide ou expirée'
        };
      }
      
      if (response.status === 429) {
        return {
          success: false,
          error: 'Quota OpenAI dépassé. Veuillez vérifier votre compte.'
        };
      }
      
      return {
        success: false,
        error: `Erreur API OpenAI: ${response.status} - ${errorData.error?.message || 'Erreur inconnue'}`
      };
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      return {
        success: false,
        error: 'Aucune réponse générée par OpenAI'
      };
    }

    return {
      success: true,
      response: data.choices[0].message.content,
      usage: data.usage
    };

  } catch (error) {
    console.error('Erreur lors de l\'appel à OpenAI:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur de connexion à OpenAI'
    };
  }
};

// Fonction pour tester la connexion OpenAI
export const testOpenAIConnection = async (): Promise<OpenAIResponse> => {
  return callOpenAI({
    messages: [
      {
        role: 'user',
        content: 'Réponds simplement "Test réussi" pour confirmer que la connexion OpenAI fonctionne.'
      }
    ],
    maxTokens: 10
  });
};

// Fonction pour générer un message motivant
export const generateMotivationalMessage = async (): Promise<string> => {
  const fallbackMessages = [
    "Aujourd'hui est une opportunité unique de faire briller votre expertise ✨",
    "Votre présence apporte une valeur inestimable à l'équipe Union 🌟",
    "Chaque interaction que vous avez aujourd'hui peut transformer une journée ordinaire en moment extraordinaire 💫",
    "L'excellence naît de la passion que vous mettez dans votre travail quotidien 🎯",
    "Votre leadership bienveillant inspire et élève toute l'équipe vers de nouveaux sommets 🚀"
  ];

  try {
    const response = await callOpenAI({
      messages: [
        {
          role: 'system',
          content: 'Tu es un coach bienveillant qui génère des messages motivants pour une équipe commerciale. Sois inspirant, positif et chaleureux.'
        },
        {
          role: 'user',
          content: 'Génère une phrase motivante et bienveillante pour commencer une journée de travail dans une équipe commerciale. Le message doit être inspirant, chaleureux et encourager l\'excellence relationnelle. Maximum 150 caractères.'
        }
      ],
      maxTokens: 100,
      temperature: 0.8
    });

    if (response.success && response.response) {
      return response.response.trim();
    }
  } catch (error) {
    console.log('Utilisation du message de fallback:', error);
  }

  // Retourner un message de fallback si l'IA n'est pas disponible
  return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
};