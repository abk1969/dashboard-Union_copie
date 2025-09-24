// Test pour vérifier que la clé API Google Maps est bien chargée
require('dotenv').config();

console.log('🔍 Test de la clé API Google Maps...');
console.log('REACT_APP_GOOGLE_MAPS_API_KEY:', process.env.REACT_APP_GOOGLE_MAPS_API_KEY);

if (process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
  console.log('✅ Clé API Google Maps trouvée !');
  console.log('📝 Clé:', process.env.REACT_APP_GOOGLE_MAPS_API_KEY.substring(0, 10) + '...');
} else {
  console.log('❌ Clé API Google Maps manquante !');
}

// Test des autres variables
console.log('\n🔍 Autres variables d\'environnement :');
console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL ? '✅ Présente' : '❌ Manquante');
console.log('REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? '✅ Présente' : '❌ Manquante');
console.log('REACT_APP_OPENAI_API_KEY:', process.env.REACT_APP_OPENAI_API_KEY ? '✅ Présente' : '❌ Manquante');
