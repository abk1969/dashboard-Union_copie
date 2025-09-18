const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

console.log('🧹 Remplacement des données par les données nettoyées...\n');

// Configuration Supabase
const SUPABASE_CONFIG = {
  url: 'https://ybzajzcwxcgoxtqsimol.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliemFqemN3eGNnb3h0cXNpbW9sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4ODA4NywiZXhwIjoyMDcxODY0MDg3fQ.t6KhbnUmh5Ix3CWlYM5HxjR58GNxtug-h_GMzE9VIio',
};

// Headers pour les requêtes
const getHeaders = () => ({
  'apikey': SUPABASE_CONFIG.anonKey,
  'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
  'Content-Type': 'application/json',
});

async function replaceWithCleanData() {
  try {
    console.log('📊 Étape 1: Sauvegarde des données actuelles...');
    
    // Sauvegarder les données actuelles
    const backupResponse = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/adherents?select=*`,
      {
        method: 'GET',
        headers: getHeaders()
      }
    );
    
    if (backupResponse.ok) {
      const currentData = await backupResponse.json();
      const backupFile = path.join(__dirname, '..', 'backups', `backup_before_cleanup_${new Date().toISOString().split('T')[0]}.json`);
      
      // Créer le dossier backups s'il n'existe pas
      const backupDir = path.dirname(backupFile);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      fs.writeFileSync(backupFile, JSON.stringify(currentData, null, 2));
      console.log(`✅ Sauvegarde créée: ${backupFile}`);
      console.log(`📊 ${currentData.length} enregistrements sauvegardés`);
    }
    
    console.log('\n🗑️ Étape 2: Suppression des données actuelles...');
    
    // Supprimer toutes les données actuelles
    const deleteResponse = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/adherents?select=*`,
      {
        method: 'DELETE',
        headers: getHeaders()
      }
    );
    
    if (deleteResponse.ok) {
      console.log('✅ Données actuelles supprimées');
    } else {
      console.log('⚠️ Erreur lors de la suppression:', deleteResponse.status);
    }
    
    console.log('\n📁 Étape 3: Vérification du fichier nettoyé...');
    
    // Vérifier que le fichier existe
    const cleanDataPath = path.join(__dirname, '..', 'clean_data.json');
    if (!fs.existsSync(cleanDataPath)) {
      console.log('❌ Fichier clean_data.json non trouvé !');
      console.log('📝 Veuillez placer votre fichier Excel nettoyé dans le dossier racine et le renommer en clean_data.json');
      return;
    }
    
    const cleanData = JSON.parse(fs.readFileSync(cleanDataPath, 'utf8'));
    console.log(`✅ Fichier nettoyé trouvé: ${cleanData.length} enregistrements`);
    
    console.log('\n📤 Étape 4: Import des données nettoyées...');
    
    // Importer par lots de 1000
    const batchSize = 1000;
    const totalBatches = Math.ceil(cleanData.length / batchSize);
    let importedCount = 0;
    
    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, cleanData.length);
      const batch = cleanData.slice(start, end);
      
      const importResponse = await fetch(
        `${SUPABASE_CONFIG.url}/rest/v1/adherents`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(batch)
        }
      );
      
      if (importResponse.ok) {
        importedCount += batch.length;
        console.log(`✅ Lot ${i + 1}/${totalBatches}: ${batch.length} enregistrements importés (Total: ${importedCount})`);
      } else {
        console.log(`❌ Erreur lot ${i + 1}:`, importResponse.status, await importResponse.text());
      }
      
      // Pause entre les lots pour éviter la surcharge
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n✅ Import terminé !');
    console.log(`📊 ${importedCount} enregistrements nettoyés importés`);
    
    // Vérifier le résultat
    console.log('\n🔍 Vérification finale...');
    const finalCountResponse = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/adherents?select=count`,
      {
        method: 'GET',
        headers: {
          ...getHeaders(),
          'Prefer': 'count=exact'
        }
      }
    );
    
    if (finalCountResponse.ok) {
      const count = finalCountResponse.headers.get('content-range');
      console.log(`✅ Total final: ${count || 'Non disponible'}`);
    }
    
    console.log('\n🎉 Remplacement terminé avec succès !');
    console.log('💡 Vos données sont maintenant optimisées pour le plan gratuit Supabase');
    
  } catch (error) {
    console.error('❌ Erreur lors du remplacement:', error);
  }
}

// Exécuter le remplacement
replaceWithCleanData();

