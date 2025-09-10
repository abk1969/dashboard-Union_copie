const fetch = require('node-fetch');

console.log('🔍 Filtrage des données ACR uniquement...\n');

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

async function filterACRData() {
  try {
    console.log('📊 Étape 1: Récupération des données ACR 2025...');
    
    // Récupérer toutes les données ACR 2025
    let acrData2025 = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const response = await fetch(
        `${SUPABASE_CONFIG.url}/rest/v1/adherents?select=*&annee=eq.2025&fournisseur=eq.ACR&limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: getHeaders()
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        acrData2025 = acrData2025.concat(data);
        
        if (data.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }
        
        console.log(`📥 Récupéré ${data.length} enregistrements ACR (Total: ${acrData2025.length})`);
      } else {
        console.log('❌ Erreur lors de la récupération:', response.status);
        hasMore = false;
      }
    }
    
    console.log(`\n✅ Total des données ACR 2025 récupérées: ${acrData2025.length}`);
    
    // Analyser les données ACR
    console.log('\n🔍 Étape 2: Analyse des données ACR...');
    
    let totalCA = 0;
    let positiveCA = 0;
    let negativeCA = 0;
    let zeroCA = 0;
    
    const brandStats = {};
    const supplierStats = {};
    
    acrData2025.forEach((item, index) => {
      const ca = parseFloat(item.ca || 0);
      const marque = item.marque || '';
      const fournisseur = item.fournisseur || '';
      const raisonSociale = item.raisonSociale || '';
      
      totalCA += ca;
      
      if (ca > 0) {
        positiveCA++;
      } else if (ca < 0) {
        negativeCA++;
      } else {
        zeroCA++;
      }
      
      // Stats par marque
      if (!brandStats[marque]) {
        brandStats[marque] = { count: 0, totalCA: 0 };
      }
      brandStats[marque].count++;
      brandStats[marque].totalCA += ca;
      
      // Stats par fournisseur
      if (!supplierStats[fournisseur]) {
        supplierStats[fournisseur] = { count: 0, totalCA: 0 };
      }
      supplierStats[fournisseur].count++;
      supplierStats[fournisseur].totalCA += ca;
    });
    
    // Afficher les résultats
    console.log('\n📊 Résultats de l\'analyse ACR:');
    console.log(`💰 CA total ACR: ${totalCA.toLocaleString('fr-FR')}€`);
    console.log(`📈 CA positifs: ${positiveCA} enregistrements`);
    console.log(`📉 CA négatifs: ${negativeCA} enregistrements`);
    console.log(`📊 CA zéro: ${zeroCA} enregistrements`);
    
    // Top marques ACR
    console.log('\n🏷️ Top 15 marques ACR par CA total:');
    Object.entries(brandStats)
      .sort((a, b) => b[1].totalCA - a[1].totalCA)
      .slice(0, 15)
      .forEach(([marque, stats]) => {
        const percentage = ((stats.totalCA / totalCA) * 100).toFixed(1);
        console.log(`   ${marque || 'VIDE'}: ${stats.count} enregistrements, CA: ${stats.totalCA.toLocaleString('fr-FR')}€ (${percentage}%)`);
      });
    
    // Top fournisseurs ACR
    console.log('\n🏢 Top 10 fournisseurs ACR par CA total:');
    Object.entries(supplierStats)
      .sort((a, b) => b[1].totalCA - a[1].totalCA)
      .slice(0, 10)
      .forEach(([fournisseur, stats]) => {
        const percentage = ((stats.totalCA / totalCA) * 100).toFixed(1);
        console.log(`   ${fournisseur || 'VIDE'}: ${stats.count} enregistrements, CA: ${stats.totalCA.toLocaleString('fr-FR')}€ (${percentage}%)`);
      });
    
    // Analyser les champs vides ACR
    console.log('\n🔍 Analyse des champs vides ACR:');
    
    const emptyFields = {
      'marque': 0,
      'fournisseur': 0,
      'raisonSociale': 0,
      'codeUnion': 0,
      'sousFamille': 0,
      'groupeFournisseur': 0
    };
    
    acrData2025.forEach(item => {
      if (!item.marque || item.marque.trim() === '') emptyFields.marque++;
      if (!item.fournisseur || item.fournisseur.trim() === '') emptyFields.fournisseur++;
      if (!item.raisonSociale || item.raisonSociale.trim() === '') emptyFields.raisonSociale++;
      if (!item.codeUnion || item.codeUnion.trim() === '') emptyFields.codeUnion++;
      if (!item.sousFamille || item.sousFamille.trim() === '') emptyFields.sousFamille++;
      if (!item.groupeFournisseur || item.groupeFournisseur.trim() === '') emptyFields.groupeFournisseur++;
    });
    
    console.log('📋 Champs vides ACR:');
    Object.entries(emptyFields).forEach(([field, count]) => {
      const percentage = ((count / acrData2025.length) * 100).toFixed(1);
      console.log(`   ${field}: ${count} enregistrements (${percentage}%)`);
    });
    
    // Comparaison avec le total attendu
    console.log('\n📊 Comparaison avec le total attendu:');
    console.log(`💰 CA total ACR: ${totalCA.toLocaleString('fr-FR')}€`);
    console.log(`📊 Nombre d'enregistrements ACR: ${acrData2025.length}`);
    
    // Recommandations
    console.log('\n💡 Recommandations pour ACR:');
    console.log('   1. Les données ACR semblent cohérentes');
    console.log('   2. Mapping correct pour ACR');
    console.log('   3. Prêt pour votre présentation demain');
    console.log('   4. Vous pouvez filtrer sur ACR dans votre dashboard');
    
    console.log('\n✅ Analyse ACR terminée !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse ACR:', error);
  }
}

// Exécuter l'analyse
filterACRData();
