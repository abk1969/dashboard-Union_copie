const fetch = require('node-fetch');

const SUPABASE_URL = 'https://ybzajzcwxcgoxtqsimol.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliemFqemN3eGNnb3h0cXNpbW9sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4ODA4NywiZXhwIjoyMDcxODY0MDg3fQ.t6KhbnUmh5Ix3CWlYM5HxjR58GNxtug-h_GMzE9VIio';

async function testClientDocuments() {
  try {
    console.log('🔍 Test de récupération des documents pour le client M0110...');
    
    // Récupérer les documents du client M0110
    const response = await fetch(`${SUPABASE_URL}/rest/v1/documents?code_union=eq.M0110`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const documents = await response.json();
    
    console.log(`✅ ${documents.length} documents trouvés pour le client M0110:`);
    documents.forEach((doc, index) => {
      console.log(`\n📄 Document ${index + 1}:`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Type: ${doc.type_document}`);
      console.log(`   Nom: ${doc.nom_fichier}`);
      console.log(`   Code Union: ${doc.code_union}`);
      console.log(`   URL Drive: ${doc.url_drive}`);
      console.log(`   Statut: ${doc.statut}`);
      console.log(`   Date: ${doc.date_upload}`);
    });

    // Test de suppression d'un document
    if (documents.length > 0) {
      const docToDelete = documents[0];
      console.log(`\n🗑️ Test de suppression du document ${docToDelete.id}...`);
      
      const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/documents?id=eq.${docToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (deleteResponse.ok) {
        console.log('✅ Document supprimé avec succès');
      } else {
        console.log('❌ Erreur lors de la suppression:', deleteResponse.status, deleteResponse.statusText);
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testClientDocuments();
