import { supabase } from '../config/supabase';

export async function createClientNotesTable() {
  console.log('🚀 Création de la table client_notes...');

  try {
    // Créer la table client_notes
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS client_notes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          code_union VARCHAR(50) NOT NULL,
          note_simple TEXT NOT NULL,
          date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          auteur VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Créer un index sur code_union pour les performances
        CREATE INDEX IF NOT EXISTS idx_client_notes_code_union ON client_notes(code_union);
        
        -- Activer RLS
        ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;
        
        -- Politique RLS : tous les utilisateurs authentifiés peuvent lire/écrire
        CREATE POLICY IF NOT EXISTS "Enable all operations for authenticated users" ON client_notes
          FOR ALL USING (auth.role() = 'authenticated');
      `
    });

    if (error) {
      console.error('❌ Erreur lors de la création de la table:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Table client_notes créée avec succès !');
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur lors de la création de la table:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  createClientNotesTable().then(result => {
    if (result.success) {
      console.log('✅ Table client_notes créée avec succès !');
    } else {
      console.error('❌ Échec de la création de la table:', result.error);
    }
  });
}

