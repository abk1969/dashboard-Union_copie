const fetch = require('node-fetch');

console.log('🧹 Script de nettoyage des anciennes données Supabase...\n');

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

async function cleanupOldData() {
  try {
    console.log('🔍 Étape 1: Vérification des données existantes...');
    
    // Vérifier le nombre d'enregistrements actuels
    const countResponse = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/adherents?select=count`,
      {
        method: 'GET',
        headers: {
          ...getHeaders(),
          'Prefer': 'count=exact'
        }
      }
    );
    
    if (countResponse.ok) {
      const count = countResponse.headers.get('content-range');
      console.log(`📊 Données actuelles: ${count || 'Non disponible'}`);
    }
    
    console.log('\n⚠️  ATTENTION: Cette opération va supprimer TOUTES les données existantes !');
    console.log('🛡️  Pour des raisons de sécurité, la suppression est désactivée par défaut.');
    console.log('\n📋 Pour activer la suppression, décommentez les lignes ci-dessous :');
    console.log('// await deleteAllAdherents();');
    console.log('// await deleteAllDocuments();');
    
    // Décommentez ces lignes pour activer la suppression
    // await deleteAllAdherents();
    // await deleteAllDocuments();
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

async function deleteAllAdherents() {
  console.log('\n🗑️  Suppression de tous les adhérents...');
  
  const response = await fetch(
    `${SUPABASE_CONFIG.url}/rest/v1/adherents`,
    {
      method: 'DELETE',
      headers: getHeaders()
    }
  );
  
  if (response.ok) {
    console.log('✅ Tous les adhérents supprimés');
  } else {
    console.error('❌ Erreur lors de la suppression des adhérents:', response.statusText);
  }
}

async function deleteAllDocuments() {
  console.log('\n🗑️  Suppression de tous les documents...');
  
  const response = await fetch(
    `${SUPABASE_CONFIG.url}/rest/v1/documents`,
    {
      method: 'DELETE',
      headers: getHeaders()
    }
  );
  
  if (response.ok) {
    console.log('✅ Tous les documents supprimés');
  } else {
    console.error('❌ Erreur lors de la suppression des documents:', response.statusText);
  }
}

// Fonction pour sauvegarder les données avant suppression
async function backupData() {
  console.log('\n💾 Sauvegarde des données existantes...');
  
  try {
    // Sauvegarder les adhérents
    const adherentsResponse = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/adherents?select=*`,
      {
        method: 'GET',
        headers: getHeaders()
      }
    );
    
    if (adherentsResponse.ok) {
      const adherents = await adherentsResponse.json();
      const fs = require('fs');
      const path = require('path');
      
      const backupPath = path.join(__dirname, `../backups/backup_adherents_${new Date().toISOString().split('T')[0]}.json`);
      
      // Créer le dossier backups s'il n'existe pas
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      fs.writeFileSync(backupPath, JSON.stringify(adherents, null, 2));
      console.log(`✅ Sauvegarde créée: ${backupPath} (${adherents.length} enregistrements)`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error);
  }
}

// Exécuter le script
cleanupOldData();

