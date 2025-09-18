const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

console.log('🔍 Comparaison ligne par ligne avec Excel...\n');

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

async function compareWithExcel() {
  try {
    console.log('📊 Étape 1: Récupération de toutes les données 2025...');
    
    // Récupérer toutes les données 2025
    let allData2025 = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const response = await fetch(
        `${SUPABASE_CONFIG.url}/rest/v1/adherents?select=*&annee=eq.2025&limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: getHeaders()
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        allData2025 = allData2025.concat(data);
        
        if (data.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }
        
        console.log(`📥 Récupéré ${data.length} enregistrements (Total: ${allData2025.length})`);
      } else {
        console.log('❌ Erreur lors de la récupération:', response.status);
        hasMore = false;
      }
    }
    
    console.log(`\n✅ Total des données 2025 récupérées: ${allData2025.length}`);
    
    // Analyser les données
    console.log('\n🔍 Étape 2: Analyse détaillée des données...');
    
    let totalCA = 0;
    let positiveCA = 0;
    let negativeCA = 0;
    let zeroCA = 0;
    
    const caDistribution = {
      '0-1': 0,
      '1-10': 0,
      '10-100': 0,
      '100-1000': 0,
      '1000-10000': 0,
      '10000+': 0
    };
    
    const supplierStats = {};
    const monthStats = {};
    
    allData2025.forEach((item, index) => {
      const ca = parseFloat(item.ca || 0);
      const supplier = item.fournisseur || 'Non défini';
      const mois = item.mois || 'Non défini';
      
      totalCA += ca;
      
      if (ca > 0) {
        positiveCA++;
      } else if (ca < 0) {
        negativeCA++;
      } else {
        zeroCA++;
      }
      
      // Distribution des CA
      if (ca >= 0 && ca < 1) caDistribution['0-1']++;
      else if (ca >= 1 && ca < 10) caDistribution['1-10']++;
      else if (ca >= 10 && ca < 100) caDistribution['10-100']++;
      else if (ca >= 100 && ca < 1000) caDistribution['100-1000']++;
      else if (ca >= 1000 && ca < 10000) caDistribution['1000-10000']++;
      else if (ca >= 10000) caDistribution['10000+']++;
      
      // Stats par fournisseur
      if (!supplierStats[supplier]) {
        supplierStats[supplier] = { count: 0, totalCA: 0 };
      }
      supplierStats[supplier].count++;
      supplierStats[supplier].totalCA += ca;
      
      // Stats par mois
      if (!monthStats[mois]) {
        monthStats[mois] = { count: 0, totalCA: 0 };
      }
      monthStats[mois].count++;
      monthStats[mois].totalCA += ca;
    });
    
    // Afficher les résultats
    console.log('\n📊 Résultats de l\'analyse:');
    console.log(`💰 CA total: ${totalCA.toLocaleString('fr-FR')}€`);
    console.log(`📈 CA positifs: ${positiveCA} enregistrements`);
    console.log(`📉 CA négatifs: ${negativeCA} enregistrements`);
    console.log(`📊 CA zéro: ${zeroCA} enregistrements`);
    
    console.log('\n📊 Distribution des CA:');
    Object.entries(caDistribution).forEach(([range, count]) => {
      const percentage = ((count / allData2025.length) * 100).toFixed(1);
      console.log(`   ${range}€: ${count} enregistrements (${percentage}%)`);
    });
    
    console.log('\n🏢 Top 15 fournisseurs par CA total:');
    Object.entries(supplierStats)
      .sort((a, b) => b[1].totalCA - a[1].totalCA)
      .slice(0, 15)
      .forEach(([supplier, stats]) => {
        const percentage = ((stats.totalCA / totalCA) * 100).toFixed(1);
        console.log(`   ${supplier}: ${stats.count} enregistrements, CA: ${stats.totalCA.toLocaleString('fr-FR')}€ (${percentage}%)`);
      });
    
    console.log('\n📅 Répartition par mois:');
    Object.entries(monthStats).forEach(([mois, stats]) => {
      const percentage = ((stats.totalCA / totalCA) * 100).toFixed(1);
      console.log(`   ${mois}: ${stats.count} enregistrements, CA: ${stats.totalCA.toLocaleString('fr-FR')}€ (${percentage}%)`);
    });
    
    // Analyser les différences
    const expectedCA = 12795899;
    const difference = expectedCA - totalCA;
    const percentage = ((difference / expectedCA) * 100).toFixed(2);
    
    console.log('\n📊 Comparaison avec l\'attendu:');
    console.log(`💰 CA attendu: ${expectedCA.toLocaleString('fr-FR')}€`);
    console.log(`💰 CA importé: ${totalCA.toLocaleString('fr-FR')}€`);
    console.log(`❌ Différence: ${difference.toLocaleString('fr-FR')}€ (${percentage}%)`);
    
    // Analyser les lignes manquantes potentielles
    console.log('\n🔍 Analyse des lignes manquantes:');
    
    // Vérifier s'il y a des patterns dans les données manquantes
    const missingPatterns = {
      'Fournisseurs vides': 0,
      'Codes Union vides': 0,
      'Raisons sociales vides': 0,
      'CA invalides': 0
    };
    
    allData2025.forEach(item => {
      if (!item.fournisseur || item.fournisseur.trim() === '') missingPatterns['Fournisseurs vides']++;
      if (!item.codeUnion || item.codeUnion.trim() === '') missingPatterns['Codes Union vides']++;
      if (!item.raisonSociale || item.raisonSociale.trim() === '') missingPatterns['Raisons sociales vides']++;
      if (isNaN(parseFloat(item.ca))) missingPatterns['CA invalides']++;
    });
    
    console.log('📋 Patterns de données manquantes:');
    Object.entries(missingPatterns).forEach(([pattern, count]) => {
      if (count > 0) {
        console.log(`   ${pattern}: ${count} enregistrements`);
      }
    });
    
    // Recommandations
    console.log('\n💡 Recommandations pour identifier les lignes manquantes:');
    console.log('   1. Vérifiez le nombre total de lignes dans votre fichier Excel');
    console.log('   2. Vérifiez s\'il y a des lignes vides ou corrompues');
    console.log('   3. Vérifiez le format des nombres (virgules vs points)');
    console.log('   4. Vérifiez le mapping des colonnes');
    console.log('   5. Vérifiez s\'il y a des filtres appliqués dans Excel');
    
    // Sauvegarder un échantillon pour comparaison
    const sampleData = allData2025.slice(0, 100).map(item => ({
      id: item.id,
      codeUnion: item.codeUnion,
      raisonSociale: item.raisonSociale,
      fournisseur: item.fournisseur,
      ca: item.ca,
      annee: item.annee
    }));
    
    const sampleFile = path.join(__dirname, '..', 'backups', `sample_data_${new Date().toISOString().split('T')[0]}.json`);
    const backupDir = path.dirname(sampleFile);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    fs.writeFileSync(sampleFile, JSON.stringify(sampleData, null, 2));
    console.log(`\n💾 Échantillon sauvegardé: ${sampleFile}`);
    
    console.log('\n✅ Analyse terminée !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  }
}

// Exécuter l'analyse
compareWithExcel();

