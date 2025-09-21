// Script de migration pour nettoyer et normaliser les utilisateurs existants
import { supabase } from '../config/supabase';
import { generateUUIDFromEmail } from '../utils/uuidGenerator';

/**
 * Script de migration pour nettoyer les utilisateurs existants
 * À exécuter une seule fois pour stabiliser la base de données
 */
export const migrateUsers = async (): Promise<void> => {
  try {
    console.log('🔄 Début de la migration des utilisateurs...');

    // 1. Récupérer tous les utilisateurs
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*');

    if (fetchError) {
      console.error('❌ Erreur récupération utilisateurs:', fetchError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('✅ Aucun utilisateur à migrer');
      return;
    }

    console.log(`📊 ${users.length} utilisateurs trouvés`);

    // 2. Grouper par email pour identifier les doublons
    const usersByEmail = new Map<string, any[]>();
    
    for (const user of users) {
      if (!usersByEmail.has(user.email)) {
        usersByEmail.set(user.email, []);
      }
      usersByEmail.get(user.email)!.push(user);
    }

    // 3. Traiter chaque groupe d'utilisateurs
    for (const [email, userGroup] of Array.from(usersByEmail.entries())) {
      if (userGroup.length === 1) {
        // Un seul utilisateur par email, vérifier si l'ID est correct
        const user = userGroup[0];
        const expectedId = generateUUIDFromEmail(email);
        
        if (user.id !== expectedId) {
          console.log(`🔄 Migration ID pour ${email}: ${user.id} -> ${expectedId}`);
          
          // Mettre à jour l'ID
          const { error: updateError } = await supabase
            .from('users')
            .update({ id: expectedId })
            .eq('id', user.id);

          if (updateError) {
            console.error(`❌ Erreur mise à jour ID pour ${email}:`, updateError);
          } else {
            console.log(`✅ ID mis à jour pour ${email}`);
          }
        }
      } else {
        // Plusieurs utilisateurs avec le même email, garder le plus récent
        console.log(`⚠️ Doublons détectés pour ${email}: ${userGroup.length} utilisateurs`);
        
        // Trier par date de création (le plus récent en premier)
        const sortedUsers = userGroup.sort((a: any, b: any) => 
          new Date(b.dateCreation || b.created_at || 0).getTime() - 
          new Date(a.dateCreation || a.created_at || 0).getTime()
        );

        const keepUser = sortedUsers[0];
        const deleteUsers = sortedUsers.slice(1);

        // Supprimer les utilisateurs en double
        for (const userToDelete of deleteUsers) {
          console.log(`🗑️ Suppression utilisateur en double: ${userToDelete.id}`);
          
          const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', userToDelete.id);

          if (deleteError) {
            console.error(`❌ Erreur suppression utilisateur ${userToDelete.id}:`, deleteError);
          } else {
            console.log(`✅ Utilisateur en double supprimé: ${userToDelete.id}`);
          }
        }

        // Mettre à jour l'ID de l'utilisateur conservé si nécessaire
        const expectedId = generateUUIDFromEmail(email);
        if (keepUser.id !== expectedId) {
          console.log(`🔄 Migration ID pour ${email}: ${keepUser.id} -> ${expectedId}`);
          
          const { error: updateError } = await supabase
            .from('users')
            .update({ id: expectedId })
            .eq('id', keepUser.id);

          if (updateError) {
            console.error(`❌ Erreur mise à jour ID pour ${email}:`, updateError);
          } else {
            console.log(`✅ ID mis à jour pour ${email}`);
          }
        }
      }
    }

    console.log('✅ Migration des utilisateurs terminée !');
  } catch (error) {
    console.error('❌ Erreur migration utilisateurs:', error);
  }
};

// Fonction pour exécuter la migration (à appeler manuellement si nécessaire)
export const runMigration = async (): Promise<void> => {
  console.log('🚀 Exécution de la migration des utilisateurs...');
  await migrateUsers();
  console.log('🎉 Migration terminée !');
};
