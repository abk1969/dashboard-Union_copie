const fetch = require('node-fetch');

// Configuration Supabase (utilisez votre clé service_role)
const SUPABASE_URL = 'https://ybzajzcwxcgoxtqsimol.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliemFqemN3eGNnb3h0cXNpbW9sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4ODA4NywiZXhwIjoyMDcxODY0MDg3fQ.t6KhbnUmh5Ix3CWlYM5HxjR58GNxtug-h_GMzE9VIio';

async function testDocumentsAPI() {
  console.log('🧪 Test de l\'API Documents Supabase...\n');

  try {
    // Test 1: Vérifier si la table existe et récupérer tous les documents
    console.log('1️⃣ Test de récupération de tous les documents...');
    const allDocsResponse = await fetch(`${SUPABASE_URL}/rest/v1/documents?select=*`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${allDocsResponse.status} ${allDocsResponse.statusText}`);
    
    if (allDocsResponse.ok) {
      const allDocs = await allDocsResponse.json();
      console.log(`   ✅ ${allDocs.length} document(s) trouvé(s) dans la table`);
      
      if (allDocs.length > 0) {
        console.log('   📄 Premier document:');
        console.log('      - ID:', allDocs[0].id);
        console.log('      - Code Union:', allDocs[0].code_union);
        console.log('      - Type:', allDocs[0].type_document);
        console.log('      - Nom fichier:', allDocs[0].nom_fichier);
        console.log('      - URL Drive:', allDocs[0].url_drive || 'Non définie');
      }
    } else {
      const errorText = await allDocsResponse.text();
      console.log(`   ❌ Erreur: ${errorText}`);
    }

    console.log('');

    // Test 2: Tester la récupération par code Union (si des documents existent)
    if (allDocsResponse.ok) {
      const allDocs = await allDocsResponse.json();
      if (allDocs.length > 0) {
        const testCodeUnion = allDocs[0].code_union;
        console.log(`2️⃣ Test de récupération par code Union: ${testCodeUnion}`);
        
        const byCodeUnionResponse = await fetch(`${SUPABASE_URL}/rest/v1/documents?code_union=eq.${testCodeUnion}&select=*`, {
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        console.log(`   Status: ${byCodeUnionResponse.status} ${byCodeUnionResponse.statusText}`);
        
        if (byCodeUnionResponse.ok) {
          const docsByCode = await byCodeUnionResponse.json();
          console.log(`   ✅ ${docsByCode.length} document(s) trouvé(s) pour ${testCodeUnion}`);
        } else {
          const errorText = await byCodeUnionResponse.text();
          console.log(`   ❌ Erreur: ${errorText}`);
        }
      }
    }

    console.log('');

    // Test 3: Tester l'ajout d'un document de test
    console.log('3️⃣ Test d\'ajout d\'un document de test...');
    
    const testDocument = {
      code_union: 'TEST001',
      type_document: 'rib',
      url_drive: 'https://example.com/test.pdf',
      nom_fichier: 'test-document.pdf',
      date_upload: new Date().toISOString(),
      statut: 'actif',
      notes: 'Document de test pour vérifier l\'API'
    };

    const addDocResponse = await fetch(`${SUPABASE_URL}/rest/v1/documents`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testDocument)
    });

    console.log(`   Status: ${addDocResponse.status} ${addDocResponse.statusText}`);
    
    if (addDocResponse.ok) {
      const addedDoc = await addDocResponse.json();
      console.log('   ✅ Document de test ajouté avec succès');
      console.log('      - ID:', addedDoc[0].id);
      
      // Nettoyer: supprimer le document de test
      console.log('   🧹 Suppression du document de test...');
      const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/documents?id=eq.${addedDoc[0].id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      });
      
      if (deleteResponse.ok) {
        console.log('   ✅ Document de test supprimé');
      } else {
        console.log('   ⚠️ Impossible de supprimer le document de test');
      }
    } else {
      const errorText = await addDocResponse.text();
      console.log(`   ❌ Erreur lors de l'ajout: ${errorText}`);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter le test
testDocumentsAPI();
