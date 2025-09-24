// Configuration Google Maps
export const GOOGLE_MAPS_CONFIG = {
  // Remplacez par votre vraie clé API Google Maps
  apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY_HERE',
  version: 'weekly' as const,
  libraries: ['places'] as ('places')[]
};

// Message d'erreur si la clé API n'est pas configurée
export const getGoogleMapsErrorMessage = () => {
  console.log('🔍 Debug clé API Google Maps:', {
    apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    hasApiKey: !!process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    isDefaultKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE'
  });
  
  if (!process.env.REACT_APP_GOOGLE_MAPS_API_KEY || process.env.REACT_APP_GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    return {
      title: '🗝️ Clé API Google Maps requise',
      message: 'Pour utiliser la carte géographique, veuillez configurer votre clé API Google Maps dans le fichier .env',
      instructions: [
        '1. Obtenez une clé API sur Google Cloud Console',
        '2. Activez l\'API Maps JavaScript',
        '3. Ajoutez REACT_APP_GOOGLE_MAPS_API_KEY=votre_cle dans le fichier .env',
        '4. Redémarrez l\'application'
      ]
    };
  }
  return null;
};
