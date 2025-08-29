const fetch = require('node-fetch');

// Configuration Supabase (copiée du fichier de config)
const SUPABASE_CONFIG = {
  url: 'https://ybzajzcwxcgoxtqsimol.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliemFqemN3eGNnb3h0cXNpb2wib2xlIjoiYW5vbiIsImlhdCI6MTc1NjI4ODA4NywiZXhwIjoyMDcxODY0MDg3fQ.zLJEdhKpcsWiGIsvAyZpsNn-YVXmgaudeSDHW4Dectc',
};

// Headers pour les requêtes
const getHeaders = () => ({
  'apikey': SUPABASE_CONFIG.anonKey,
  'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
  'Content-Type': 'application/json',
});

async function testConnection() {
  console.log('🔍 Test de connexion simple à Supabase...\n');
  console.log('URL:', SUPABASE_CONFIG.url);
  console.log('Clé (début):', SUPABASE_CONFIG.anonKey.substring(0, 20) + '...');
  console.log('');

  try {
    // Test 1: Vérifier l'accès à la table documents
    console.log('📋 Test 1: Accès à la table documents...');
    const response = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/documents?select=*&limit=1`,
      {
        headers: getHeaders(),
      }
    );

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Succès! ${data.length} document(s) trouvé(s)`);
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Erreur: ${errorText}`);
    }

  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
  }
}

testConnection();
