const fetch = require('node-fetch');

console.log('🔍 Analyse des données pour optimisation...\n');

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

async function analyzeData() {
  try {
    console.log('📊 Analyse des données dans Supabase...');
    
    // Compter le nombre total d'enregistrements
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
      console.log(`✅ Total des enregistrements: ${count || 'Non disponible'}`);
    }
    
    // Analyser les CA
    console.log('\n💰 Analyse des CA...');
    const caResponse = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/adherents?select=ca&limit=1000`,
      {
        method: 'GET',
        headers: getHeaders()
      }
    );
    
    if (caResponse.ok) {
      const caData = await caResponse.json();
      let totalCA = 0;
      let zeroCA = 0;
      let validCA = 0;
      let maxCA = 0;
      
      caData.forEach(item => {
        const ca = parseFloat(item.ca || 0);
        totalCA += ca;
        
        if (ca === 0) {
          zeroCA++;
        } else {
          validCA++;
          if (ca > maxCA) {
            maxCA = ca;
          }
        }
      });
      
      console.log(`📈 CA zéro: ${zeroCA} enregistrements (${((zeroCA/caData.length)*100).toFixed(1)}%)`);
      console.log(`📈 CA valides: ${validCA} enregistrements (${((validCA/caData.length)*100).toFixed(1)}%)`);
      console.log(`💰 CA total (échantillon): ${totalCA.toLocaleString('fr-FR')}€`);
      console.log(`🏆 CA maximum: ${maxCA.toLocaleString('fr-FR')}€`);
      
      // Estimation pour 100K lignes
      const estimatedZeroCA = Math.round((zeroCA / caData.length) * 100000);
      const estimatedValidCA = Math.round((validCA / caData.length) * 100000);
      
      console.log(`\n📊 Estimation pour 100K lignes:`);
      console.log(`   - Lignes à CA zéro: ${estimatedZeroCA.toLocaleString('fr-FR')}`);
      console.log(`   - Lignes valides: ${estimatedValidCA.toLocaleString('fr-FR')}`);
      console.log(`   - Économie possible: ${estimatedZeroCA.toLocaleString('fr-FR')} lignes`);
    }
    
    // Analyser les fournisseurs
    console.log('\n🏢 Analyse des fournisseurs...');
    const supplierResponse = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/adherents?select=fournisseur,ca&limit=1000`,
      {
        method: 'GET',
        headers: getHeaders()
      }
    );
    
    if (supplierResponse.ok) {
      const supplierData = await supplierResponse.json();
      const supplierStats = {};
      
      supplierData.forEach(item => {
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
      
      console.log('📈 Top 10 fournisseurs (échantillon de 1000):');
      Object.entries(supplierStats)
        .sort((a, b) => b[1].totalCA - a[1].totalCA)
        .slice(0, 10)
        .forEach(([supplier, stats]) => {
          const zeroPercent = ((stats.zeroCA / stats.count) * 100).toFixed(1);
          console.log(`   ${supplier}: ${stats.count} enregistrements, CA: ${stats.totalCA.toLocaleString('fr-FR')}€, Zéros: ${zeroPercent}%`);
        });
    }
    
    console.log('\n✅ Analyse terminée !');
    console.log('\n💡 Recommandations:');
    console.log('   1. Supprimer les lignes à CA = 0');
    console.log('   2. Garder seulement les données utiles');
    console.log('   3. Optimiser pour le plan gratuit');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  }
}

// Exécuter l'analyse
analyzeData();
