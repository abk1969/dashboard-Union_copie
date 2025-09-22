const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://yhza1zcwxcxoxtosimol.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloemExemN3eGN4b3h0b3NpbW9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ4MDAsImV4cCI6MjA1MDU1MDgwMH0.8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 Vérification des tables existantes...');

  try {
    // Essayer de récupérer les tables
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%note%'
        ORDER BY table_name;
      `
    });

    if (error) {
      console.error('❌ Erreur lors de la vérification des tables:', error);
    } else {
      console.log('📋 Tables contenant "note":', data);
    }

    // Essayer de récupérer toutes les tables
    const { data: allTables, error: allError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `
    });

    if (allError) {
      console.error('❌ Erreur lors de la récupération de toutes les tables:', allError);
    } else {
      console.log('📋 Toutes les tables publiques:', allTables);
    }

    // Essayer d'accéder directement à client_notes
    console.log('🔍 Test d\'accès à client_notes...');
    const { data: notesData, error: notesError } = await supabase
      .from('client_notes')
      .select('*')
      .limit(1);

    if (notesError) {
      console.error('❌ Erreur d\'accès à client_notes:', notesError);
    } else {
      console.log('✅ Accès à client_notes réussi:', notesData);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkTables();

