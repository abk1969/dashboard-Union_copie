const fetch = require('node-fetch');

console.log('🔍 Analyse des marques "empty" et leur impact...\n');

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

async function analyzeEmptyBrands() {
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
    
    // Analyser les marques
    console.log('\n🔍 Étape 2: Analyse des marques...');
    
    const brandStats = {};
    let totalCA = 0;
    let emptyBrandCA = 0;
    let emptyBrandCount = 0;
    
    allData2025.forEach((item, index) => {
      const ca = parseFloat(item.ca || 0);
      const marque = item.marque || '';
      const fournisseur = item.fournisseur || '';
      const raisonSociale = item.raisonSociale || '';
      
      totalCA += ca;
      
      // Analyser les marques
      if (!brandStats[marque]) {
        brandStats[marque] = { count: 0, totalCA: 0, fournisseurs: new Set() };
      }
      
      brandStats[marque].count++;
      brandStats[marque].totalCA += ca;
      brandStats[marque].fournisseurs.add(fournisseur);
      
      // Compter les marques vides
      if (marque === '' || marque === 'empty' || marque === null || marque === undefined) {
        emptyBrandCA += ca;
        emptyBrandCount++;
      }
    });
    
    // Afficher les résultats
    console.log('\n📊 Résultats de l\'analyse des marques:');
    console.log(`💰 CA total: ${totalCA.toLocaleString('fr-FR')}€`);
    console.log(`📊 Marques vides: ${emptyBrandCount} enregistrements`);
    console.log(`💰 CA des marques vides: ${emptyBrandCA.toLocaleString('fr-FR')}€`);
    console.log(`📈 Pourcentage des marques vides: ${((emptyBrandCount / allData2025.length) * 100).toFixed(1)}%`);
    console.log(`💰 Pourcentage CA des marques vides: ${((emptyBrandCA / totalCA) * 100).toFixed(1)}%`);
    
    // Top 20 marques par CA
    console.log('\n🏷️ Top 20 marques par CA total:');
    Object.entries(brandStats)
      .sort((a, b) => b[1].totalCA - a[1].totalCA)
      .slice(0, 20)
      .forEach(([marque, stats]) => {
        const percentage = ((stats.totalCA / totalCA) * 100).toFixed(1);
        const fournisseurs = Array.from(stats.fournisseurs).slice(0, 3).join(', ');
        console.log(`   ${marque || 'VIDE'}: ${stats.count} enregistrements, CA: ${stats.totalCA.toLocaleString('fr-FR')}€ (${percentage}%) - Fournisseurs: ${fournisseurs}`);
      });
    
    // Analyser les marques vides par fournisseur
    console.log('\n🔍 Analyse des marques vides par fournisseur:');
    const emptyBrandBySupplier = {};
    
    allData2025.forEach(item => {
      const marque = item.marque || '';
      const fournisseur = item.fournisseur || '';
      const ca = parseFloat(item.ca || 0);
      
      if (marque === '' || marque === 'empty' || marque === null || marque === undefined) {
        if (!emptyBrandBySupplier[fournisseur]) {
          emptyBrandBySupplier[fournisseur] = { count: 0, totalCA: 0 };
        }
        emptyBrandBySupplier[fournisseur].count++;
        emptyBrandBySupplier[fournisseur].totalCA += ca;
      }
    });
    
    console.log('📊 Top 10 fournisseurs avec marques vides:');
    Object.entries(emptyBrandBySupplier)
      .sort((a, b) => b[1].totalCA - a[1].totalCA)
      .slice(0, 10)
      .forEach(([fournisseur, stats]) => {
        const percentage = ((stats.totalCA / emptyBrandCA) * 100).toFixed(1);
        console.log(`   ${fournisseur || 'VIDE'}: ${stats.count} enregistrements, CA: ${stats.totalCA.toLocaleString('fr-FR')}€ (${percentage}% des marques vides)`);
      });
    
    // Analyser les autres champs vides
    console.log('\n🔍 Analyse des autres champs vides:');
    
    const emptyFields = {
      'marque': 0,
      'fournisseur': 0,
      'raisonSociale': 0,
      'codeUnion': 0,
      'sousFamille': 0,
      'groupeFournisseur': 0
    };
    
    allData2025.forEach(item => {
      if (!item.marque || item.marque.trim() === '') emptyFields.marque++;
      if (!item.fournisseur || item.fournisseur.trim() === '') emptyFields.fournisseur++;
      if (!item.raisonSociale || item.raisonSociale.trim() === '') emptyFields.raisonSociale++;
      if (!item.codeUnion || item.codeUnion.trim() === '') emptyFields.codeUnion++;
      if (!item.sousFamille || item.sousFamille.trim() === '') emptyFields.sousFamille++;
      if (!item.groupeFournisseur || item.groupeFournisseur.trim() === '') emptyFields.groupeFournisseur++;
    });
    
    console.log('📋 Champs vides:');
    Object.entries(emptyFields).forEach(([field, count]) => {
      const percentage = ((count / allData2025.length) * 100).toFixed(1);
      console.log(`   ${field}: ${count} enregistrements (${percentage}%)`);
    });
    
    // Calculer l'impact sur la différence
    const expectedCA = 12795899;
    const difference = expectedCA - totalCA;
    const percentage = ((difference / expectedCA) * 100).toFixed(2);
    
    console.log('\n📊 Impact sur la différence:');
    console.log(`💰 CA attendu: ${expectedCA.toLocaleString('fr-FR')}€`);
    console.log(`💰 CA importé: ${totalCA.toLocaleString('fr-FR')}€`);
    console.log(`❌ Différence: ${difference.toLocaleString('fr-FR')}€ (${percentage}%)`);
    console.log(`💰 CA des marques vides: ${emptyBrandCA.toLocaleString('fr-FR')}€`);
    
    if (emptyBrandCA > 0) {
      console.log(`\n💡 Les marques vides représentent ${emptyBrandCA.toLocaleString('fr-FR')}€`);
      console.log(`   Si ces données sont valides, elles font partie du total attendu`);
      console.log(`   Si elles sont des erreurs de parsing, elles expliquent une partie de la différence`);
    }
    
    console.log('\n✅ Analyse terminée !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  }
}

// Exécuter l'analyse
analyzeEmptyBrands();

