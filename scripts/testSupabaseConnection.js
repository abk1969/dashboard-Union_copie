const fetch = require('node-fetch');

const supabaseUrl = 'https://ybzajzcwxcgoxtqsimol.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliemFqemN3eGNnb3h0cXNpb2wib2xlIjoiYW5vbiIsImlhdCI6MTc1NjI4ODA4NywiZXhwIjoyMDcxODY0MDg3fQ.zLJEdhKpcsWiGIsvAyZpsNn-YVXmgaudeSDHW4Dectc';

async function testSupabaseConnection() {
  console.log('🔍 Test de connexion à Supabase...\n');

  try {
    // Test 1: Vérifier l'existence de la table documents
    console.log('📋 Test 1: Vérification de la table documents...');
    const tableResponse = await fetch(
      `${supabaseUrl}/rest/v1/documents?select=*&limit=1`,
      {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      }
    );

    console.log(`   Status: ${tableResponse.status} ${tableResponse.statusText}`);
    
    if (tableResponse.ok) {
      const data = await tableResponse.json();
      console.log(`   ✅ Table accessible - ${data.length} document(s) trouvé(s)`);
      
      if (data.length > 0) {
        console.log('   📊 Structure du premier document:');
        console.log('   ', JSON.stringify(data[0], null, 2));
      }
    } else {
      console.log('   ❌ Table non accessible');
      const errorText = await tableResponse.text();
      console.log('   Erreur:', errorText);
    }

    console.log('');

    // Test 2: Tenter d'insérer un document de test
    console.log('📤 Test 2: Test d\'insertion d\'un document...');
    const testDocument = {
      code_union: 'TEST001',
      type_document: 'RIB',
      url_drive: 'https://example.com/test.pdf',
      nom_fichier: 'test_rib.pdf',
      date_upload: new Date().toISOString(),
      statut: 'actif',
      notes: 'Document de test - à supprimer',
    };

    console.log('   Document de test:', JSON.stringify(testDocument, null, 2));

    const insertResponse = await fetch(
      `${supabaseUrl}/rest/v1/documents`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(testDocument),
      }
    );

    console.log(`   Status: ${insertResponse.status} ${insertResponse.statusText}`);
    
    if (insertResponse.ok) {
      const insertedDoc = await insertResponse.json();
      console.log('   ✅ Document inséré avec succès!');
      console.log('   📄 Document inséré:', JSON.stringify(insertedDoc, null, 2));
      
      // Nettoyer le document de test
      console.log('   🧹 Suppression du document de test...');
      const deleteResponse = await fetch(
        `${supabaseUrl}/rest/v1/documents?id=eq.${insertedDoc[0].id}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
        }
      );
      
      if (deleteResponse.ok) {
        console.log('   ✅ Document de test supprimé');
      } else {
        console.log('   ⚠️ Impossible de supprimer le document de test');
      }
    } else {
      console.log('   ❌ Échec de l\'insertion');
      const errorText = await insertResponse.text();
      console.log('   Erreur:', errorText);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testSupabaseConnection();
