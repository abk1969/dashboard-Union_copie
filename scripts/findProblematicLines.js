const fetch = require('node-fetch');

console.log('🔍 Identification des lignes problématiques...\n');

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

async function findProblematicLines() {
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
    
    // Analyser les problèmes
    console.log('\n🔍 Étape 2: Identification des lignes problématiques...');
    
    const problems = {
      negativeCA: [],
      zeroCA: [],
      verySmallCA: [],
      suspiciousCA: [],
      missingData: [],
      invalidFormat: []
    };
    
    let totalCA = 0;
    let validRecords = 0;
    
    allData2025.forEach((item, index) => {
      const ca = parseFloat(item.ca || 0);
      const raisonSociale = item.raisonSociale || '';
      const fournisseur = item.fournisseur || '';
      const codeUnion = item.codeUnion || '';
      
      // CA négatifs
      if (ca < 0) {
        problems.negativeCA.push({
          index: index + 1,
          id: item.id,
          raisonSociale,
          fournisseur,
          codeUnion,
          ca: ca,
          originalCA: item.ca
        });
      }
      
      // CA zéro
      if (ca === 0) {
        problems.zeroCA.push({
          index: index + 1,
          id: item.id,
          raisonSociale,
          fournisseur,
          codeUnion,
          ca: ca,
          originalCA: item.ca
        });
      }
      
      // CA très petits (< 1€)
      if (ca > 0 && ca < 1) {
        problems.verySmallCA.push({
          index: index + 1,
          id: item.id,
          raisonSociale,
          fournisseur,
          codeUnion,
          ca: ca,
          originalCA: item.ca
        });
      }
      
      // CA suspects (très élevés)
      if (ca > 50000) {
        problems.suspiciousCA.push({
          index: index + 1,
          id: item.id,
          raisonSociale,
          fournisseur,
          codeUnion,
          ca: ca,
          originalCA: item.ca
        });
      }
      
      // Données manquantes
      if (!raisonSociale || !fournisseur || !codeUnion) {
        problems.missingData.push({
          index: index + 1,
          id: item.id,
          raisonSociale,
          fournisseur,
          codeUnion,
          ca: ca,
          originalCA: item.ca
        });
      }
      
      // Format invalide
      if (isNaN(ca) || item.ca === null || item.ca === undefined) {
        problems.invalidFormat.push({
          index: index + 1,
          id: item.id,
          raisonSociale,
          fournisseur,
          codeUnion,
          ca: ca,
          originalCA: item.ca
        });
      }
      
      // Calculer le total CA valide
      if (ca > 0) {
        totalCA += ca;
        validRecords++;
      }
    });
    
    // Afficher les résultats
    console.log('\n📊 Résultats de l\'analyse:');
    console.log(`✅ Enregistrements valides: ${validRecords}`);
    console.log(`💰 CA total valide: ${totalCA.toLocaleString('fr-FR')}€`);
    
    console.log('\n❌ CA négatifs:');
    console.log(`   Nombre: ${problems.negativeCA.length}`);
    if (problems.negativeCA.length > 0) {
      console.log('   Exemples:');
      problems.negativeCA.slice(0, 5).forEach(problem => {
        console.log(`   - Ligne ${problem.index}: ${problem.raisonSociale} | ${problem.fournisseur} | CA: ${problem.ca}€ (Original: ${problem.originalCA})`);
      });
    }
    
    console.log('\n⚠️ CA zéro:');
    console.log(`   Nombre: ${problems.zeroCA.length}`);
    if (problems.zeroCA.length > 0) {
      console.log('   Exemples:');
      problems.zeroCA.slice(0, 5).forEach(problem => {
        console.log(`   - Ligne ${problem.index}: ${problem.raisonSociale} | ${problem.fournisseur} | CA: ${problem.ca}€ (Original: ${problem.originalCA})`);
      });
    }
    
    console.log('\n🔍 CA très petits (< 1€):');
    console.log(`   Nombre: ${problems.verySmallCA.length}`);
    if (problems.verySmallCA.length > 0) {
      console.log('   Exemples:');
      problems.verySmallCA.slice(0, 5).forEach(problem => {
        console.log(`   - Ligne ${problem.index}: ${problem.raisonSociale} | ${problem.fournisseur} | CA: ${problem.ca}€ (Original: ${problem.originalCA})`);
      });
    }
    
    console.log('\n🚨 CA suspects (> 50,000€):');
    console.log(`   Nombre: ${problems.suspiciousCA.length}`);
    if (problems.suspiciousCA.length > 0) {
      console.log('   Exemples:');
      problems.suspiciousCA.slice(0, 5).forEach(problem => {
        console.log(`   - Ligne ${problem.index}: ${problem.raisonSociale} | ${problem.fournisseur} | CA: ${problem.ca.toLocaleString('fr-FR')}€ (Original: ${problem.originalCA})`);
      });
    }
    
    console.log('\n📝 Données manquantes:');
    console.log(`   Nombre: ${problems.missingData.length}`);
    if (problems.missingData.length > 0) {
      console.log('   Exemples:');
      problems.missingData.slice(0, 5).forEach(problem => {
        console.log(`   - Ligne ${problem.index}: ${problem.raisonSociale} | ${problem.fournisseur} | CA: ${problem.ca}€ (Original: ${problem.originalCA})`);
      });
    }
    
    console.log('\n🔧 Format invalide:');
    console.log(`   Nombre: ${problems.invalidFormat.length}`);
    if (problems.invalidFormat.length > 0) {
      console.log('   Exemples:');
      problems.invalidFormat.slice(0, 5).forEach(problem => {
        console.log(`   - Ligne ${problem.index}: ${problem.raisonSociale} | ${problem.fournisseur} | CA: ${problem.ca}€ (Original: ${problem.originalCA})`);
      });
    }
    
    // Calculer l'impact sur le CA total
    const negativeCAImpact = problems.negativeCA.reduce((sum, p) => sum + Math.abs(p.ca), 0);
    const zeroCAImpact = problems.zeroCA.reduce((sum, p) => sum + p.ca, 0);
    
    console.log('\n💰 Impact sur le CA total:');
    console.log(`   CA négatifs: ${negativeCAImpact.toLocaleString('fr-FR')}€`);
    console.log(`   CA zéro: ${zeroCAImpact.toLocaleString('fr-FR')}€`);
    console.log(`   Total impact: ${(negativeCAImpact + zeroCAImpact).toLocaleString('fr-FR')}€`);
    
    // Recommandations
    console.log('\n💡 Recommandations:');
    if (problems.negativeCA.length > 0) {
      console.log('   1. Vérifiez le parsing des nombres négatifs');
      console.log('   2. Vérifiez le format des cellules Excel');
    }
    if (problems.zeroCA.length > 0) {
      console.log('   3. Vérifiez s\'il y a des lignes à CA = 0 dans votre fichier');
    }
    if (problems.verySmallCA.length > 0) {
      console.log('   4. Vérifiez le parsing des nombres décimaux');
    }
    if (problems.missingData.length > 0) {
      console.log('   5. Vérifiez le mapping des colonnes');
    }
    
    console.log('\n✅ Analyse terminée !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  }
}

// Exécuter l'analyse
findProblematicLines();

