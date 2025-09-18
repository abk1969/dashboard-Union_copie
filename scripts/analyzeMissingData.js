const fetch = require('node-fetch');

console.log('🔍 Analyse des données manquantes - Debug avancé...\n');

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

async function analyzeMissingData() {
  try {
    console.log('📊 Étape 1: Analyse des données 2025 dans Supabase...');
    
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
    
    // Analyser les CA
    console.log('\n💰 Étape 2: Analyse des CA 2025...');
    
    let totalCA = 0;
    let zeroCA = 0;
    let negativeCA = 0;
    let validCA = 0;
    let maxCA = 0;
    let minCA = Infinity;
    const caValues = [];
    
    allData2025.forEach((item, index) => {
      const ca = parseFloat(item.ca || 0);
      caValues.push(ca);
      totalCA += ca;
      
      if (ca === 0) {
        zeroCA++;
      } else if (ca < 0) {
        negativeCA++;
      } else {
        validCA++;
        if (ca > maxCA) {
          maxCA = ca;
        }
        if (ca < minCA) {
          minCA = ca;
        }
      }
    });
    
    console.log(`📈 CA total 2025: ${totalCA.toLocaleString('fr-FR')}€`);
    console.log(`📈 CA zéro: ${zeroCA} enregistrements`);
    console.log(`📈 CA négatifs: ${negativeCA} enregistrements`);
    console.log(`📈 CA valides: ${validCA} enregistrements`);
    console.log(`📈 CA maximum: ${maxCA.toLocaleString('fr-FR')}€`);
    console.log(`📈 CA minimum: ${minCA.toLocaleString('fr-FR')}€`);
    
    // Analyser les fournisseurs
    console.log('\n🏢 Étape 3: Analyse par fournisseur...');
    
    const supplierStats = {};
    allData2025.forEach(item => {
      const supplier = item.fournisseur || 'Non défini';
      const ca = parseFloat(item.ca || 0);
      
      if (!supplierStats[supplier]) {
        supplierStats[supplier] = { count: 0, totalCA: 0, zeroCA: 0 };
      }
      
      supplierStats[supplier].count++;
      supplierStats[supplier].totalCA += ca;
      
      if (ca === 0) {
        supplierStats[supplier].zeroCA++;
      }
    });
    
    console.log('📊 Top 10 fournisseurs par CA total:');
    Object.entries(supplierStats)
      .sort((a, b) => b[1].totalCA - a[1].totalCA)
      .slice(0, 10)
      .forEach(([supplier, stats]) => {
        const zeroPercent = ((stats.zeroCA / stats.count) * 100).toFixed(1);
        console.log(`   ${supplier}: ${stats.count} enregistrements, CA: ${stats.totalCA.toLocaleString('fr-FR')}€, Zéros: ${zeroPercent}%`);
      });
    
    // Analyser les valeurs CA suspectes
    console.log('\n🔍 Étape 4: Analyse des valeurs CA suspectes...');
    
    const suspiciousValues = caValues.filter(ca => ca > 0 && ca < 1);
    const veryHighValues = caValues.filter(ca => ca > 100000);
    
    console.log(`⚠️ Valeurs CA < 1€: ${suspiciousValues.length} enregistrements`);
    console.log(`⚠️ Valeurs CA > 100,000€: ${veryHighValues.length} enregistrements`);
    
    if (suspiciousValues.length > 0) {
      console.log('📋 Exemples de valeurs < 1€:');
      suspiciousValues.slice(0, 5).forEach(ca => {
        console.log(`   ${ca}€`);
      });
    }
    
    if (veryHighValues.length > 0) {
      console.log('📋 Exemples de valeurs > 100,000€:');
      veryHighValues.slice(0, 5).forEach(ca => {
        console.log(`   ${ca.toLocaleString('fr-FR')}€`);
      });
    }
    
    // Calculer la différence avec l'attendu
    const expectedCA = 12795899;
    const difference = expectedCA - totalCA;
    const percentage = ((difference / expectedCA) * 100).toFixed(2);
    
    console.log('\n📊 Étape 5: Comparaison avec l\'attendu...');
    console.log(`💰 CA attendu: ${expectedCA.toLocaleString('fr-FR')}€`);
    console.log(`💰 CA importé: ${totalCA.toLocaleString('fr-FR')}€`);
    console.log(`❌ Différence: ${difference.toLocaleString('fr-FR')}€ (${percentage}%)`);
    
    if (difference > 0) {
      console.log('\n💡 Recommandations:');
      console.log('   1. Vérifiez s\'il y a des lignes filtrées dans Excel');
      console.log('   2. Vérifiez le format des nombres (virgules vs points)');
      console.log('   3. Vérifiez s\'il y a des lignes vides ou corrompues');
      console.log('   4. Vérifiez le mapping des colonnes');
    }
    
    console.log('\n✅ Analyse terminée !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  }
}

// Exécuter l'analyse
analyzeMissingData();

