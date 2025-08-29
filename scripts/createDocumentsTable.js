const fetch = require('node-fetch');

console.log('🚀 Création de la table Documents sur Supabase...');

// Configuration Supabase (depuis votre config)
const supabaseUrl = 'https://ybzajzcwxcgoxtqsimol.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliemFqemN3eGNnb3h0cXNpbW9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODgwODcsImV4cCI6MjA3MTg2NDA4N30.zLJEdhKpcsWiGIsvAyZpsNn-YVXmgaudeSDHW4Dectc';

// SQL pour créer la table Documents
const createTableSQL = `
-- Table pour les documents
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  code_union VARCHAR(50) NOT NULL,
  type_document VARCHAR(100) NOT NULL,
  url_drive TEXT,
  nom_fichier VARCHAR(255),
  date_upload TIMESTAMP DEFAULT NOW(),
  statut VARCHAR(50) DEFAULT 'actif',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_documents_code_union ON documents(code_union);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type_document);

-- Commentaires sur la table
COMMENT ON TABLE documents IS 'Table de gestion des documents des adhérents (RIB, KBIS, Contrats, etc.)';
COMMENT ON COLUMN documents.type_document IS 'Type de document: RIB, KBIS, PIECES_IDENTITE, CONTRAT_UNION, PHOTO_ENSEIGNE, PHOTO_COMPTOIR';
COMMENT ON COLUMN documents.url_drive IS 'URL Google Drive du document';
COMMENT ON COLUMN documents.statut IS 'Statut du document: actif, archive, supprime';
`;

async function createDocumentsTable() {
  try {
    console.log('📋 Exécution du SQL de création...');
    
    // Utiliser l'API REST de Supabase pour exécuter le SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        sql: createTableSQL
      })
    });

    if (response.ok) {
      console.log('✅ Table Documents créée avec succès !');
      console.log('📁 Structure créée :');
      console.log('   - id (SERIAL PRIMARY KEY)');
      console.log('   - code_union (VARCHAR 50)');
      console.log('   - type_document (VARCHAR 100)');
      console.log('   - url_drive (TEXT)');
      console.log('   - nom_fichier (VARCHAR 255)');
      console.log('   - date_upload (TIMESTAMP)');
      console.log('   - statut (VARCHAR 50)');
      console.log('   - notes (TEXT)');
      console.log('   - created_at (TIMESTAMP)');
      console.log('   - Index sur code_union et type_document');
    } else {
      console.log('⚠️ La fonction RPC exec_sql n\'existe pas, création manuelle nécessaire');
      console.log('📋 SQL à exécuter manuellement dans Supabase :');
      console.log(createTableSQL);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création de la table:', error);
    console.log('📋 SQL à exécuter manuellement dans Supabase :');
    console.log(createTableSQL);
  }
}

// Exécuter la création
createDocumentsTable();
