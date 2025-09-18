const fetch = require('node-fetch');

console.log('🔍 Vérification du nombre de lignes dans Supabase...\n');

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

async function checkSupabaseCount() {
  try {
    console.log('📊 Comptage des enregistrements dans Supabase...');
    
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
    } else {
      console.log('❌ Impossible de compter les enregistrements');
    }
    
    // Récupérer un échantillon pour vérifier les données
    console.log('\n🔍 Récupération d\'un échantillon...');
    const sampleResponse = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/adherents?select=*&limit=5`,
      {
        method: 'GET',
        headers: getHeaders()
      }
    );
    
    if (sampleResponse.ok) {
      const sampleData = await sampleResponse.json();
      console.log(`✅ Échantillon récupéré: ${sampleData.length} enregistrements`);
      
      if (sampleData.length > 0) {
        console.log('\n📋 Échantillon des données:');
        console.log(JSON.stringify(sampleData[0], null, 2));
        
        // Vérifier les années
        const years = [...new Set(sampleData.map(item => item.annee))];
        console.log(`\n📅 Années dans l'échantillon: ${years.join(', ')}`);
      }
    } else {
      console.log('❌ Impossible de récupérer l\'échantillon');
    }
    
    // Statistiques par année
    console.log('\n📊 Statistiques par année...');
    const yearStatsResponse = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/adherents?select=annee&limit=1000`,
      {
        method: 'GET',
        headers: getHeaders()
      }
    );
    
    if (yearStatsResponse.ok) {
      const yearData = await yearStatsResponse.json();
      const yearStats = {};
      yearData.forEach(item => {
        const year = item.annee || 'Non défini';
        yearStats[year] = (yearStats[year] || 0) + 1;
      });
      
      console.log('📈 Répartition par année (échantillon de 1000):');
      Object.entries(yearStats).forEach(([year, count]) => {
        console.log(`   ${year}: ${count} enregistrements`);
      });
    }
    
    console.log('\n✅ Vérification terminée !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

// Exécuter la vérification
checkSupabaseCount();

