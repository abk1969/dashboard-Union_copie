const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLoadAllUsers() {
  try {
    console.log('🔄 Test de chargement de tous les utilisateurs...');
    
    // Récupérer tous les utilisateurs depuis la base de données
    const { data: allUsers, error } = await supabase
      .from('users')
      .select('id, prenom, nom, email');
    
    if (error) {
      console.error('❌ Erreur lors du chargement des utilisateurs:', error);
      return;
    }
    
    if (!allUsers || allUsers.length === 0) {
      console.warn('⚠️ Aucun utilisateur trouvé dans la base de données');
      return;
    }
    
    console.log('👥 Utilisateurs trouvés:', allUsers.length);
    console.log('👥 Détail des utilisateurs:', allUsers);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testLoadAllUsers();
