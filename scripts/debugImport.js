const fetch = require('node-fetch');

console.log('🔍 Debug de l'import - Analyse des données manquantes...\n');

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

async function debugImport() {
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
    
    // Rechercher ACR spécifiquement
    console.log('\n🔍 Recherche de ACR...');
    const acrResponse = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/adherents?select=*&fournisseur=eq.ACR&limit=10`,
      {
        method: 'GET',
        headers: getHeaders()
      }
    );
    
    if (acrResponse.ok) {
      const acrData = await acrResponse.json();
      console.log(`✅ ACR trouvés: ${acrData.length} enregistrements`);
      
      if (acrData.length > 0) {
        console.log('\n📋 Échantillon ACR:');
        acrData.forEach((item, index) => {
          console.log(`${index + 1}. ${item.raisonSociale} - CA: ${item.ca}€`);
        });
      }
    }
    
    // Rechercher des valeurs CA élevées
    console.log('\n🔍 Recherche de valeurs CA élevées...');
    const highCAResponse = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/adherents?select=*&ca=gte.1000000&limit=10`,
      {
        method: 'GET',
        headers: getHeaders()
      }
    );
    
    if (highCAResponse.ok) {
      const highCAData = await highCAResponse.json();
      console.log(`✅ CA élevés trouvés: ${highCAData.length} enregistrements`);
      
      if (highCAData.length > 0) {
        console.log('\n📋 Échantillon CA élevés:');
        highCAData.forEach((item, index) => {
          console.log(`${index + 1}. ${item.raisonSociale} - ${item.fournisseur} - CA: ${item.ca}€`);
        });
      }
    }
    
    // Statistiques par fournisseur
    console.log('\n📊 Statistiques par fournisseur...');
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
      let totalCA = 0;
      
      supplierData.forEach(item => {
        const supplier = item.fournisseur || 'Non défini';
        if (!supplierStats[supplier]) {
          supplierStats[supplier] = { count: 0, totalCA: 0 };
        }
        supplierStats[supplier].count++;
        supplierStats[supplier].totalCA += parseFloat(item.ca || 0);
        totalCA += parseFloat(item.ca || 0);
      });
      
      console.log('📈 Top 10 fournisseurs (échantillon de 1000):');
      Object.entries(supplierStats)
        .sort((a, b) => b[1].totalCA - a[1].totalCA)
        .slice(0, 10)
        .forEach(([supplier, stats]) => {
          console.log(`   ${supplier}: ${stats.count} enregistrements, CA total: ${stats.totalCA.toLocaleString('fr-FR')}€`);
        });
      
      console.log(`\n💰 CA total (échantillon): ${totalCA.toLocaleString('fr-FR')}€`);
    }
    
    // Vérifier les années
    console.log('\n📅 Vérification des années...');
    const yearResponse = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/adherents?select=annee&limit=1000`,
      {
        method: 'GET',
        headers: getHeaders()
      }
    );
    
    if (yearResponse.ok) {
      const yearData = await yearResponse.json();
      const yearStats = {};
      yearData.forEach(item => {
        const year = item.annee || 'Non défini';
        yearStats[year] = (yearStats[year] || 0) + 1;
      });
      
      console.log('📊 Répartition par année (échantillon de 1000):');
      Object.entries(yearStats).forEach(([year, count]) => {
        console.log(`   ${year}: ${count} enregistrements`);
      });
    }
    
    console.log('\n✅ Debug terminé !');
    
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
  }
}

// Exécuter le debug
debugImport();
