// Utilitaire pour déboguer les variables d'environnement
export const debugEnvironmentVariables = () => {
  console.log('🔍 Debug des variables d\'environnement :');
  console.log('REACT_APP_GOOGLE_MAPS_API_KEY:', process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? '✅ Présente' : '❌ Manquante');
  console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL ? '✅ Présente' : '❌ Manquante');
  console.log('REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? '✅ Présente' : '❌ Manquante');
  console.log('REACT_APP_OPENAI_API_KEY:', process.env.REACT_APP_OPENAI_API_KEY ? '✅ Présente' : '❌ Manquante');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('VERCEL:', process.env.VERCEL);
  
  // Vérification spécifique pour Google Maps
  if (process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
    console.log('🗝️ Clé API Google Maps trouvée :', process.env.REACT_APP_GOOGLE_MAPS_API_KEY.substring(0, 10) + '...');
  } else {
    console.log('❌ Clé API Google Maps manquante !');
  }
};
