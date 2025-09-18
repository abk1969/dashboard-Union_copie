const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

console.log('💾 Script de sauvegarde des données Supabase...\n');

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

async function backupSupabaseData() {
  try {
    console.log('🔍 Récupération des données existantes...');
    
    // Récupérer toutes les données des adhérents
    const response = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/adherents?select=*`,
      {
        method: 'GET',
        headers: getHeaders()
      }
    );
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ ${data.length} enregistrements récupérés`);
    
    if (data.length === 0) {
      console.log('ℹ️ Aucune donnée existante à sauvegarder');
      return;
    }
    
    // Créer le dossier backups s'il n'existe pas
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Générer le nom de fichier avec timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupFile = path.join(backupDir, `supabase_backup_${timestamp}.json`);
    
    // Sauvegarder les données
    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
    
    console.log(`💾 Sauvegarde créée: ${backupFile}`);
    console.log(`📊 ${data.length} enregistrements sauvegardés`);
    
    // Afficher un échantillon des données sauvegardées
    console.log('\n📋 Échantillon des données sauvegardées:');
    console.log(JSON.stringify(data.slice(0, 2), null, 2));
    
    console.log('\n✅ Sauvegarde terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error);
  }
}

// Exécuter la sauvegarde
backupSupabaseData();

