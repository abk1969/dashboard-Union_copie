const fetch = require('node-fetch');

const SUPABASE_URL = 'https://ybzajzcwxcgoxtqsimol.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliemFqemN3eGNnb3h0cXNpbW9sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4ODA4NywiZXhwIjoyMDcxODY0MDg3fQ.t6KhbnUmh5Ix3CWlYM5HxjR58GNxtug-h_GMzE9VIio';

async function checkDocumentsTable() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/documents?select=*`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const documents = await response.json();
      console.log(`📊 Table documents: ${documents.length} document(s) trouvé(s)\n`);
      
      documents.forEach((doc, index) => {
        console.log(`📄 Document ${index + 1}:`);
        console.log(`   ID: ${doc.id}`);
        console.log(`   Code Union: "${doc.code_union || 'VIDE'}"`);
        console.log(`   Type: ${doc.type_document}`);
        console.log(`   Nom fichier: ${doc.nom_fichier}`);
        console.log(`   URL Drive: ${doc.url_drive || 'Non définie'}`);
        console.log(`   Statut: ${doc.statut}`);
        console.log(`   Notes: ${doc.notes || 'Aucune'}`);
        console.log(`   Date upload: ${doc.date_upload}`);
        console.log('');
      });
    } else {
      console.error('❌ Erreur:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkDocumentsTable();
