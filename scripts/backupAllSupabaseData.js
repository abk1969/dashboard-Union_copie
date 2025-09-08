const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

console.log('💾 Script de sauvegarde COMPLÈTE des données Supabase...\n');

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

async function backupAllSupabaseData() {
  try {
    console.log('🔍 Récupération de TOUTES les données existantes...');
    
    let allData = [];
    let page = 0;
    const pageSize = 1000; // Taille maximale par page
    let hasMoreData = true;
    
    // Récupération par pages pour contourner la limite de 1000
    while (hasMoreData) {
      const offset = page * pageSize;
      console.log(`📄 Récupération de la page ${page + 1} (offset: ${offset})...`);
      
      const response = await fetch(
        `${SUPABASE_CONFIG.url}/rest/v1/adherents?select=*&limit=${pageSize}&offset=${offset}`,
        {
          method: 'GET',
          headers: getHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const pageData = await response.json();
      console.log(`✅ Page ${page + 1} récupérée:`, pageData.length, 'enregistrements');
      
      if (pageData.length === 0) {
        hasMoreData = false;
      } else {
        allData = [...allData, ...pageData];
        page++;
        
        // Si on a moins de pageSize enregistrements, c'est la dernière page
        if (pageData.length < pageSize) {
          hasMoreData = false;
        }
      }
      
      // Pause entre les pages pour éviter la surcharge
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n✅ TOTAL récupéré: ${allData.length} enregistrements`);
    
    if (allData.length === 0) {
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
    const backupFile = path.join(backupDir, `supabase_backup_complete_${timestamp}.json`);
    
    // Sauvegarder les données
    fs.writeFileSync(backupFile, JSON.stringify(allData, null, 2));
    
    console.log(`💾 Sauvegarde complète créée: ${backupFile}`);
    console.log(`📊 ${allData.length} enregistrements sauvegardés`);
    
    // Afficher un échantillon des données sauvegardées
    console.log('\n📋 Échantillon des données sauvegardées:');
    console.log(JSON.stringify(allData.slice(0, 2), null, 2));
    
    // Statistiques par année
    const yearStats = {};
    allData.forEach(item => {
      const year = item.annee || 'Non défini';
      yearStats[year] = (yearStats[year] || 0) + 1;
    });
    
    console.log('\n📊 Répartition par année:');
    Object.entries(yearStats).forEach(([year, count]) => {
      console.log(`   ${year}: ${count} enregistrements`);
    });
    
    console.log('\n✅ Sauvegarde complète terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error);
  }
}

// Exécuter la sauvegarde
backupAllSupabaseData();
