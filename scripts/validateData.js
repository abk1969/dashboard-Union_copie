const fetch = require('node-fetch');

console.log('🔍 Script de validation des données Supabase...\n');

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

async function validateData() {
  try {
    console.log('📊 Validation des données importées...\n');
    
    // 1. Compter le nombre total d'enregistrements
    console.log('1️⃣ Comptage des enregistrements...');
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
      console.log(`   ✅ Total des enregistrements: ${count || 'Non disponible'}`);
    } else {
      console.log('   ❌ Impossible de compter les enregistrements');
    }
    
    // 2. Vérifier la structure des données
    console.log('\n2️⃣ Vérification de la structure des données...');
    const sampleResponse = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/adherents?select=*&limit=5`,
      {
        method: 'GET',
        headers: getHeaders()
      }
    );
    
    if (sampleResponse.ok) {
      const sampleData = await sampleResponse.json();
      console.log('   ✅ Structure des données:');
      console.log('   📋 Champs disponibles:', Object.keys(sampleData[0] || {}));
      
      if (sampleData.length > 0) {
        console.log('\n   📄 Échantillon de données:');
        console.log(JSON.stringify(sampleData[0], null, 2));
      }
    } else {
      console.log('   ❌ Impossible de récupérer les données');
    }
    
    // 3. Vérifier les statistiques par groupe
    console.log('\n3️⃣ Statistiques par groupe client...');
    const groupStatsResponse = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/adherents?select=groupeClient,ca&limit=1000`,
      {
        method: 'GET',
        headers: getHeaders()
      }
    );
    
    if (groupStatsResponse.ok) {
      const groupData = await groupStatsResponse.json();
      
      // Calculer les statistiques par groupe
      const groupStats = {};
      groupData.forEach(item => {
        const group = item.groupeClient || 'Non défini';
        if (!groupStats[group]) {
          groupStats[group] = { count: 0, totalCA: 0 };
        }
        groupStats[group].count++;
        groupStats[group].totalCA += parseFloat(item.ca || 0);
      });
      
      console.log('   📊 Répartition par groupe:');
      Object.entries(groupStats).forEach(([group, stats]) => {
        console.log(`      ${group}: ${stats.count} adhérents, CA total: ${stats.totalCA.toLocaleString('fr-FR')}€`);
      });
    }
    
    // 4. Vérifier les années de données
    console.log('\n4️⃣ Vérification des années de données...');
    const yearStatsResponse = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/adherents?select=annee&limit=1000`,
      {
        method: 'GET',
        headers: getHeaders()
      }
    );
    
    if (yearStatsResponse.ok) {
      const yearData = await yearStatsResponse.json();
      const years = [...new Set(yearData.map(item => item.annee))].sort();
      console.log(`   📅 Années disponibles: ${years.join(', ')}`);
    }
    
    // 5. Vérifier les données manquantes
    console.log('\n5️⃣ Vérification des données manquantes...');
    const missingDataResponse = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/adherents?select=codeUnion,raisonSociale,groupeClient,ca&limit=1000`,
      {
        method: 'GET',
        headers: getHeaders()
      }
    );
    
    if (missingDataResponse.ok) {
      const missingData = await missingDataResponse.json();
      
      let missingCodeUnion = 0;
      let missingRaisonSociale = 0;
      let missingGroupeClient = 0;
      let missingCA = 0;
      
      missingData.forEach(item => {
        if (!item.codeUnion || item.codeUnion.trim() === '') missingCodeUnion++;
        if (!item.raisonSociale || item.raisonSociale.trim() === '') missingRaisonSociale++;
        if (!item.groupeClient || item.groupeClient.trim() === '') missingGroupeClient++;
        if (!item.ca || item.ca === 0) missingCA++;
      });
      
      console.log('   📊 Données manquantes:');
      console.log(`      Code Union: ${missingCodeUnion}`);
      console.log(`      Raison Sociale: ${missingRaisonSociale}`);
      console.log(`      Groupe Client: ${missingGroupeClient}`);
      console.log(`      CA: ${missingCA}`);
    }
    
    console.log('\n✅ Validation terminée !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la validation:', error);
  }
}

// Exécuter la validation
validateData();
