const fetch = require('node-fetch');

const SUPABASE_URL = 'https://ybzajzcwxcgoxtqsimol.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliemFqemN3eGNnb3h0cXNpbW9sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4ODA4NywiZXhwIjoyMDcxODY0MDg3fQ.t6KhbnUmh5Ix3CWlYM5HxjR58GNxtug-h_GMzE9VIio';

async function createTestDocument() {
  try {
    console.log('📤 Création d\'un document de test...');
    
    const testDocument = {
      code_union: 'M0110',
      type_document: 'RIB',
      nom_fichier: 'test_rib.pdf',
      url_drive: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view?usp=sharing',
      statut: 'actif',
      notes: 'Document de test pour vérifier l\'affichage',
      date_upload: new Date().toISOString()
    };

    console.log('📋 Document à créer:', JSON.stringify(testDocument, null, 2));

    const response = await fetch(`${SUPABASE_URL}/rest/v1/documents`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testDocument)
    });

    console.log('📡 Réponse du serveur:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Détails de l\'erreur:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Document créé avec succès:', result);

    // Vérifier que le document est bien créé
    console.log('\n🔍 Vérification du document créé...');
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/documents?code_union=eq.M0110`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const documents = await checkResponse.json();
    console.log(`📄 ${documents.length} document(s) trouvé(s) pour M0110:`);
    documents.forEach(doc => {
      console.log(`   ID: ${doc.id}, Type: ${doc.type_document}, URL: ${doc.url_drive}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createTestDocument();
