import { supabase } from '../config/supabase';

export async function setupClientNotes() {
  console.log('🚀 Configuration de la table client_notes...');

  try {
    // 1. Créer la table client_notes
    console.log('1. Création de la table...');
    const { error: createError } = await supabase.rpc('exec_sql', {
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
      `
    });

    if (createError) {
      console.error('❌ Erreur lors de la création de la table:', createError);
      return { success: false, error: createError.message };
    }

    // 2. Créer l'index
    console.log('2. Création de l\'index...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_client_notes_code_union ON client_notes(code_union);`
    });

    if (indexError) {
      console.warn('⚠️ Erreur lors de la création de l\'index:', indexError);
    }

    // 3. Activer RLS
    console.log('3. Activation de RLS...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON client_notes;
        CREATE POLICY "Enable all operations for authenticated users" ON client_notes
          FOR ALL USING (auth.role() = 'authenticated');
      `
    });

    if (rlsError) {
      console.warn('⚠️ Erreur lors de la configuration RLS:', rlsError);
    }

    // 4. Insérer des données de test
    console.log('4. Insertion de données de test...');
    const testNotes = [
      {
        code_union: 'M0109',
        note_simple: 'GROS PROBLEME DE LIVRAISON SUR LA COMMANDE PASSER AVEC TOTAL LE CLIENT N ARRIVE PAS A JOINDRE LE COMMERCIAL',
        auteur: 'martial@groupementunion.pro'
      },
      {
        code_union: 'M0109',
        note_simple: 'APA MARSEILLE: 1 808 000€ de CA en 2024, progression de +15% par rapport à 2023. Client très satisfait des services.',
        auteur: 'martial@groupementunion.pro'
      },
      {
        code_union: 'M0109',
        note_simple: 'Visio du 12/02/2025 / Présentation des nouveaux produits / Client intéressé par la gamme premium',
        auteur: 'martial@groupementunion.pro'
      },
      {
        code_union: 'M0013',
        note_simple: 'RELAI NPS - Client très satisfait, recommande nos services',
        auteur: 'martial@groupementunion.pro'
      },
      {
        code_union: 'M0013',
        note_simple: 'Contact: Samir Il aimerait une remise faciale sur la prochaine commande',
        auteur: 'martial@groupementunion.pro'
      },
      {
        code_union: 'M0013',
        note_simple: 'A REFUSER LA PROMO EXADIS CAR IL EST FACHER AVEC DESTOCK AULNAY',
        auteur: 'martial@groupementunion.pro'
      }
    ];

    const { error: insertError } = await supabase
      .from('client_notes')
      .upsert(testNotes, { onConflict: 'id' });

    if (insertError) {
      console.warn('⚠️ Erreur lors de l\'insertion des données de test:', insertError);
    } else {
      console.log('✅ Données de test insérées avec succès !');
    }

    console.log('✅ Configuration de client_notes terminée !');
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  setupClientNotes().then(result => {
    if (result.success) {
      console.log('✅ Configuration terminée avec succès !');
    } else {
      console.error('❌ Échec de la configuration:', result.error);
    }
  });
}

