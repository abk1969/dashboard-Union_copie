// Script pour vérifier et corriger les données de famille dans Supabase
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://ybzajzcwxcgoxtqsimol.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliemFqemN3eGNnb3h0cXNpbW9sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4ODA4NywiZXhwIjoyMDcxODY0MDg3fQ.t6KhbnUmh5Ix3CWlYM5HxjR58GNxtug-h_GMzE9VIio';

const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction pour déterminer la famille basée sur la sous-famille
function getFamilleFromSousFamille(sousFamille) {
  if (!sousFamille) return 'autre';
  
  const sousFamilleLower = sousFamille.toLowerCase();
  
  // Freinage
  if (sousFamilleLower.includes('frein') || 
      sousFamilleLower.includes('plaquette') || 
      sousFamilleLower.includes('disque') ||
      sousFamilleLower.includes('kit') && sousFamilleLower.includes('frein')) {
    return 'freinage';
  }
  
  // Embrayage
  if (sousFamilleLower.includes('embrayage') || 
      (sousFamilleLower.includes('kit') && sousFamilleLower.includes('embrayage'))) {
    return 'embrayage';
  }
  
  // Filtres
  if (sousFamilleLower.includes('filtre') || 
      sousFamilleLower.includes('air') || 
      sousFamilleLower.includes('huile') ||
      sousFamilleLower.includes('habitacle')) {
    return 'filtre';
  }
  
  // Distribution
  if (sousFamilleLower.includes('distribution') || 
      sousFamilleLower.includes('chaine') || 
      sousFamilleLower.includes('tendeur') ||
      sousFamilleLower.includes('guide')) {
    return 'distribution';
  }
  
  // Étanchéité moteur
  if (sousFamilleLower.includes('joint') || 
      sousFamilleLower.includes('culasse') || 
      sousFamilleLower.includes('vilebrequin')) {
    return 'etancheite moteur';
  }
  
  // Thermique
  if (sousFamilleLower.includes('thermostat') || 
      sousFamilleLower.includes('radiateur') || 
      sousFamilleLower.includes('ventilateur')) {
    return 'thermique';
  }
  
  // Injection
  if (sousFamilleLower.includes('injecteur') || 
      sousFamilleLower.includes('pompe') || 
      sousFamilleLower.includes('injection')) {
    return 'injection';
  }
  
  // Éclairage
  if (sousFamilleLower.includes('phare') || 
      sousFamilleLower.includes('feu') || 
      sousFamilleLower.includes('ampoule')) {
    return 'eclairage';
  }
  
  return 'autre';
}

async function checkAndFixFamilleData() {
  try {
    console.log('🔍 Vérification des données de famille...');
    
    // Récupérer toutes les données
    const { data: adherents, error: fetchError } = await supabase
      .from('adherents')
      .select('id, sous_famille, famille');
    
    if (fetchError) {
      throw fetchError;
    }
    
    console.log(`📊 ${adherents.length} enregistrements trouvés`);
    
    // Analyser les données existantes
    const stats = {
      avecFamille: 0,
      sansFamille: 0,
      famillesUniques: new Set(),
      sousFamillesUniques: new Set()
    };
    
    adherents.forEach(adherent => {
      if (adherent.famille && adherent.famille.trim() !== '') {
        stats.avecFamille++;
        stats.famillesUniques.add(adherent.famille);
      } else {
        stats.sansFamille++;
      }
      if (adherent.sous_famille) {
        stats.sousFamillesUniques.add(adherent.sous_famille);
      }
    });
    
    console.log('\n📈 Statistiques actuelles:');
    console.log(`   Avec famille: ${stats.avecFamille}`);
    console.log(`   Sans famille: ${stats.sansFamille}`);
    console.log(`   Familles uniques: ${stats.famillesUniques.size}`);
    console.log(`   Sous-familles uniques: ${stats.sousFamillesUniques.size}`);
    
    if (stats.famillesUniques.size > 0) {
      console.log('\n🏷️ Familles existantes:');
      Array.from(stats.famillesUniques).forEach(famille => {
        console.log(`   - ${famille}`);
      });
    }
    
    // Si pas de famille, proposer de les calculer
    if (stats.sansFamille > 0) {
      console.log('\n⚠️ Des enregistrements n\'ont pas de famille définie.');
      console.log('💡 Voulez-vous que je calcule les familles basées sur les sous-familles ?');
      
      // Calculer les familles pour les enregistrements sans famille
      const updates = [];
      adherents.forEach(adherent => {
        if (!adherent.famille || adherent.famille.trim() === '') {
          const famille = getFamilleFromSousFamille(adherent.sous_famille);
          updates.push({
            id: adherent.id,
            famille: famille
          });
        }
      });
      
      if (updates.length > 0) {
        console.log(`\n🔄 Mise à jour de ${updates.length} enregistrements...`);
        
        // Mettre à jour par lots
        const batchSize = 100;
        for (let i = 0; i < updates.length; i += batchSize) {
          const batch = updates.slice(i, i + batchSize);
          
          const { error: updateError } = await supabase
            .from('adherents')
            .upsert(batch.map(item => ({
              id: item.id,
              famille: item.famille
            })));
          
          if (updateError) {
            console.error(`❌ Erreur lors de la mise à jour du lot ${i}-${i + batchSize}:`, updateError);
          } else {
            console.log(`✅ Lot ${i}-${i + batchSize} mis à jour`);
          }
        }
        
        console.log('\n✅ Mise à jour terminée !');
      }
    }
    
    // Vérifier les résultats finaux
    console.log('\n🔍 Vérification finale...');
    const { data: finalData, error: finalError } = await supabase
      .from('adherents')
      .select('famille')
      .not('famille', 'is', null)
      .neq('famille', '');
    
    if (finalError) {
      throw finalError;
    }
    
    console.log(`✅ ${finalData.length} enregistrements ont maintenant une famille définie`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter le script
checkAndFixFamilleData();
