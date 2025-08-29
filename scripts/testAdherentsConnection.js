const fetch = require('node-fetch');

// Configuration Supabase
const SUPABASE_CONFIG = {
  url: 'https://ybzajzcwxcgoxtqsimol.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliemFqemN3eGNnb3h0cXNpbW9sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4ODA4NywiZXhwIjoyMDcxODY0MDg3fQ.t6KhbnUmh5Ix3CWlYM5HxjR58GNxtug-h_GMzE9VIio',
};

// Headers pour les requêtes
const getHeaders = () => ({
  'apikey': SUPABASE_CONFIG.anonKey,
  'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
  'Content-Type': 'application/json',
});

async function testAdherentsConnection() {
  console.log('🔍 Test de connexion à la table adherents...\n');
  console.log('URL:', SUPABASE_CONFIG.url);
  console.log('Clé (début):', SUPABASE_CONFIG.anonKey.substring(0, 20) + '...');
  console.log('');

  try {
    // Test 1: Vérifier l'accès à la table adherents
    console.log('📋 Test 1: Accès à la table adherents...');
    const response = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/adherents?select=*&limit=5`,
      {
        headers: getHeaders(),
      }
    );

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Succès! ${data.length} adhérent(s) trouvé(s)`);
      
      if (data.length > 0) {
        console.log('   📊 Premier adhérent:', {
          codeUnion: data[0].codeUnion,
          raisonSociale: data[0].raisonSociale,
          fournisseur: data[0].fournisseur,
          annee: data[0].annee,
          ca: data[0].ca
        });
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Erreur: ${errorText}`);
    }

    console.log('');

    // Test 2: Vérifier l'accès à la table documents
    console.log('📋 Test 2: Accès à la table documents...');
    const docResponse = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/documents?select=*&limit=1`,
      {
        headers: getHeaders(),
      }
    );

    console.log(`   Status: ${docResponse.status} ${docResponse.statusText}`);
    
    if (docResponse.ok) {
      const docData = await docResponse.json();
      console.log(`   ✅ Succès! ${docData.length} document(s) trouvé(s)`);
    } else {
      const errorText = await docResponse.text();
      console.log(`   ❌ Erreur: ${errorText}`);
    }

  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
  }
}

testAdherentsConnection();
