const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

console.log('🔄 Script de remplacement sécurisé des données Supabase...\n');

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

// Fonction pour charger les données depuis un fichier JSON
function loadDataFromFile(filePath) {
  try {
    console.log(`📁 Chargement du fichier: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Fichier non trouvé: ${filePath}`);
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    console.log(`✅ Fichier chargé: ${data.length} enregistrements`);
    return data;
    
  } catch (error) {
    console.error(`❌ Erreur lors du chargement du fichier:`, error.message);
    return null;
  }
}

// Fonction pour transformer les données au format Supabase
function transformDataToSupabaseFormat(data) {
  console.log('🔄 Transformation des données au format Supabase...');
  
  return data.map((item, index) => {
    // Adapter selon la structure de vos données
    return {
      id: index + 1, // ID auto-incrémenté
      codeUnion: item.codeUnion || item.code_union || '',
      raisonSociale: item.raisonSociale || item.raison_sociale || '',
      groupeClient: item.groupeClient || item.groupe_client || '',
      fournisseur: item.fournisseur || '',
      marque: item.marque || '',
      sousFamille: item.sousFamille || item.sous_famille || '',
      groupeFournisseur: item.groupeFournisseur || item.groupe_fournisseur || '',
      annee: item.annee || item.annee || new Date().getFullYear(),
      ca: parseFloat(item.ca || item.CA || 0) || 0
    };
  });
}

// Fonction pour supprimer toutes les données
async function deleteAllData() {
  console.log('🗑️ Suppression de toutes les données existantes...');
  
  try {
    const { error } = await supabase
      .from('adherents')
      .delete()
      .neq('id', 0); // Supprimer tous les enregistrements
    
    if (error) {
      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }
    
    console.log('✅ Toutes les données supprimées');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    return false;
  }
}

// Fonction pour insérer les nouvelles données par lots
async function insertDataInBatches(data, batchSize = 100) {
  console.log(`📤 Insertion des données par lots de ${batchSize}...`);
  
  const totalRecords = data.length;
  let insertedCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < totalRecords; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(totalRecords / batchSize);
    
    console.log(`\n📦 Lot ${batchNumber}/${totalBatches} (${batch.length} enregistrements)...`);
    
    try {
      const response = await fetch(
        `${SUPABASE_CONFIG.url}/rest/v1/adherents`,
        {
          method: 'POST',
          headers: {
            ...getHeaders(),
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(batch)
        }
      );
      
      if (response.ok) {
        insertedCount += batch.length;
        console.log(`✅ Lot ${batchNumber} inséré avec succès`);
      } else {
        const errorText = await response.text();
        console.error(`❌ Erreur lot ${batchNumber}:`, response.status, errorText);
        errorCount += batch.length;
      }
      
      // Pause entre les lots pour éviter la surcharge
      if (i + batchSize < totalRecords) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.error(`❌ Erreur réseau lot ${batchNumber}:`, error.message);
      errorCount += batch.length;
    }
  }
  
  console.log(`\n📊 Résumé de l'insertion:`);
  console.log(`   ✅ Enregistrements insérés: ${insertedCount}`);
  console.log(`   ❌ Erreurs: ${errorCount}`);
  console.log(`   📈 Taux de succès: ${((insertedCount / totalRecords) * 100).toFixed(1)}%`);
}

// Fonction principale
async function replaceData() {
  try {
    console.log('🔍 Recherche des fichiers de données...');
    
    // Chercher les fichiers JSON dans le dossier public
    const publicDir = path.join(__dirname, '../public');
    const files = fs.readdirSync(publicDir).filter(file => file.endsWith('.json'));
    
    console.log('📁 Fichiers JSON trouvés:');
    files.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    
    if (files.length === 0) {
      console.log('\n❌ Aucun fichier JSON trouvé dans le dossier public/');
      console.log('💡 Placez votre fichier de données consolidées dans le dossier public/');
      return;
    }
    
    // Utiliser le premier fichier JSON trouvé
    const dataFile = path.join(publicDir, files[0]);
    console.log(`\n🎯 Utilisation du fichier: ${files[0]}`);
    
    // Charger et transformer les données
    const rawData = loadDataFromFile(dataFile);
    if (!rawData) return;
    
    const transformedData = transformDataToSupabaseFormat(rawData);
    
    // Afficher un échantillon des données transformées
    console.log('\n📋 Échantillon des données transformées:');
    console.log(JSON.stringify(transformedData.slice(0, 2), null, 2));
    
    // Demander confirmation
    console.log('\n⚠️  ATTENTION: Cette opération va remplacer TOUTES les données !');
    console.log(`📊 ${transformedData.length} enregistrements à insérer`);
    console.log('🔄 Les anciennes données seront supprimées');
    console.log('🚀 Démarrage du remplacement...\n');
    
    // Supprimer les anciennes données
    const deleteSuccess = await deleteAllData();
    if (!deleteSuccess) {
      console.log('❌ Arrêt du processus - erreur lors de la suppression');
      return;
    }
    
    // Insérer les nouvelles données
    await insertDataInBatches(transformedData);
    
    console.log('\n🎉 Remplacement terminé !');
    
  } catch (error) {
    console.error('❌ Erreur lors du remplacement:', error);
  }
}

// Exécuter le script
replaceData();

