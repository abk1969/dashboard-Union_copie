const fetch = require('node-fetch');

const SUPABASE_URL = 'https://ybzajzcwxcgoxtqsimol.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliemFqemN3eGNnb3h0cXNpbW9sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4ODA4NywiZXhwIjoyMDcxODY0MDg3fQ.t6KhbnUmh5Ix3CWlYM5HxjR58GNxtug-h_GMzE9VIio';

async function fixEmptyCodeUnion() {
  try {
    console.log('🔧 Correction du document avec code Union vide...\n');

    // 1. Récupérer le document avec le code Union vide
    const response = await fetch(`${SUPABASE_URL}/rest/v1/documents?code_union=is.null&select=*`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const documents = await response.json();
      console.log(`📄 ${documents.length} document(s) avec code Union vide trouvé(s)`);
      
      if (documents.length > 0) {
        const doc = documents[0];
        console.log(`   Document ID: ${doc.id}`);
        console.log(`   Nom fichier: ${doc.nom_fichier}`);
        console.log(`   Type: ${doc.type_document}`);
        
        // 2. Corriger le code Union (utiliser M0110 comme exemple)
        const updateData = {
          code_union: 'M0110' // Assigner à WARNING PIECES AUTO
        };
        
        console.log(`\n🔄 Mise à jour du code Union vers: ${updateData.code_union}`);
        
        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/documents?id=eq.${doc.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(updateData)
        });
        
        if (updateResponse.ok) {
          const updatedDoc = await updateResponse.json();
          console.log('✅ Document mis à jour avec succès');
          console.log(`   Nouveau code Union: ${updatedDoc[0].code_union}`);
        } else {
          const errorText = await updateResponse.text();
          console.error('❌ Erreur lors de la mise à jour:', updateResponse.status, errorText);
        }
      }
    } else {
      console.error('❌ Erreur lors de la récupération:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

fixEmptyCodeUnion();
