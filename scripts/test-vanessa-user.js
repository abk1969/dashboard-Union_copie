const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVanessaUser() {
  try {
    console.log('🔄 Test de recherche de Vanessa...');
    
    // Rechercher Vanessa par email exact
    const { data: vanessaExact, error: errorExact } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'VANESSA@groupementunion.pro');
    
    console.log('🔍 Recherche exacte VANESSA@groupementunion.pro:', vanessaExact);
    if (errorExact) console.error('❌ Erreur recherche exacte:', errorExact);
    
    // Rechercher Vanessa par email insensible à la casse
    const { data: vanessaCase, error: errorCase } = await supabase
      .from('users')
      .select('*')
      .ilike('email', '%vanessa%');
    
    console.log('🔍 Recherche insensible à la casse vanessa:', vanessaCase);
    if (errorCase) console.error('❌ Erreur recherche insensible:', errorCase);
    
    // Lister tous les utilisateurs
    const { data: allUsers, error: errorAll } = await supabase
      .from('users')
      .select('id, prenom, nom, email');
    
    console.log('👥 Tous les utilisateurs:', allUsers);
    if (errorAll) console.error('❌ Erreur tous utilisateurs:', errorAll);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testVanessaUser();
