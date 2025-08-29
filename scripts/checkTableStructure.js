const fetch = require('node-fetch');

const SUPABASE_URL = 'https://ybzajzcwxcgoxtqsimol.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliemFqemN3eGNnb3h0cXNpbW9sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4ODA4NywiZXhwIjoyMDcxODY0MDg3fQ.t6KhbnUmh5Ix3CWlYM5HxjR58GNxtug-h_GMzE9VIio';

async function checkTableStructure() {
  try {
    console.log('🔍 Vérification de la structure de la table documents...');
    
    // Récupérer la structure de la table
    const response = await fetch(`${SUPABASE_URL}/rest/v1/documents?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Structure de la table documents:');
    console.log(JSON.stringify(result, null, 2));

    // Vérifier les colonnes disponibles
    if (result.length > 0) {
      const columns = Object.keys(result[0]);
      console.log('\n📋 Colonnes disponibles:');
      columns.forEach(col => console.log(`   - ${col}`));
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkTableStructure();
