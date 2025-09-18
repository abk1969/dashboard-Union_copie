// Configuration OpenAI - Utilise les variables d'environnement
export const OPENAI_CONFIG = {
  MODEL: 'gpt-3.5-turbo',
  MAX_TOKENS: 1000,
  TEMPERATURE: 0.7
};

// Fonction pour vérifier si la clé API est configurée
export const isOpenAIConfigured = (): boolean => {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  
  return !!(
    apiKey && 
    apiKey.startsWith('sk-') && 
    apiKey !== 'sk-votre-cle-openai-ici' &&
    apiKey.length > 20
  );
};

// Fonction pour obtenir la clé API (sécurisée)
export const getOpenAIApiKey = (): string | null => {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  
  if (!apiKey || !isOpenAIConfigured()) {
    console.warn('⚠️ Clé API OpenAI non configurée ou invalide');
    return null;
  }
  
  return apiKey;
};

// Debug info (sans exposer la clé)
export const getOpenAIDebugInfo = () => {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  
  return {
    hasKey: !!apiKey,
    startsWithSk: apiKey?.startsWith('sk-'),
    keyLength: apiKey?.length || 0,
    keyPreview: apiKey?.substring(0, 7) + '...' + apiKey?.substring(-4) || 'Non définie',
    isValid: isOpenAIConfigured()
  };
};