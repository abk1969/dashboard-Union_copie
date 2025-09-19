// Script de debug pour vérifier les utilisateurs dans Supabase
// Remplacez les valeurs par vos vraies clés Supabase

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

async function debugUsers() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('🔄 Debug des utilisateurs...');
    
    // 1. Lister tous les utilisateurs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, prenom, nom, email');
    
    if (usersError) {
      console.error('❌ Erreur utilisateurs:', usersError);
      return;
    }
    
    console.log('👥 Utilisateurs trouvés:', users.length);
    users.forEach(user => {
      console.log(`  - ${user.prenom} ${user.nom} (${user.email}) - ID: ${user.id}`);
    });
    
    // 2. Chercher Vanessa spécifiquement
    const vanessaUsers = users.filter(user => 
      user.email && user.email.toLowerCase().includes('vanessa')
    );
    
    console.log('🔍 Utilisateurs Vanessa:', vanessaUsers);
    
    // 3. Vérifier les photos
    const { data: photos, error: photosError } = await supabase
      .from('user_photos')
      .select('user_id, file_path');
    
    if (photosError) {
      console.error('❌ Erreur photos:', photosError);
    } else {
      console.log('📸 Photos trouvées:', photos.length);
      photos.forEach(photo => {
        const user = users.find(u => u.id === photo.user_id);
        console.log(`  - ${user?.prenom || 'Unknown'} (${photo.user_id}): ${photo.file_path}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

debugUsers();
