const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateTasksAuteur() {
  try {
    console.log('🔄 Mise à jour des tâches sans auteur...');
    
    // Récupérer toutes les tâches
    const { data: tasks, error: fetchError } = await supabase
      .from('todo_tasks')
      .select('*');
    
    if (fetchError) {
      throw fetchError;
    }
    
    console.log(`📋 ${tasks.length} tâches trouvées`);
    
    // Filtrer les tâches sans auteur
    const tasksWithoutAuteur = tasks.filter(task => !task.auteur);
    console.log(`⚠️ ${tasksWithoutAuteur.length} tâches sans auteur`);
    
    if (tasksWithoutAuteur.length === 0) {
      console.log('✅ Toutes les tâches ont déjà un auteur');
      return;
    }
    
    // Mettre à jour les tâches sans auteur
    const { error: updateError } = await supabase
      .from('todo_tasks')
      .update({ auteur: 'Commercial' })
      .is('auteur', null);
    
    if (updateError) {
      throw updateError;
    }
    
    console.log('✅ Tâches mises à jour avec succès');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

updateTasksAuteur();
