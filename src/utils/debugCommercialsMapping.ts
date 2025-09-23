import { supabase } from '../config/supabase';

/**
 * Fonction de debug pour analyser la correspondance entre commercials et adherents
 */
export async function debugCommercialsMapping() {
  console.log('🔍 DEBUG MAPPING COMMERCIAUX/ADHÉRENTS...');
  
  try {
    // Récupérer les commerciaux
    const { data: commercials, error: commercialsError } = await supabase
      .from('commercials')
      .select('*')
      .eq('statut', 'actif');

    if (commercialsError) {
      console.error('❌ Erreur commerciaux:', commercialsError);
      return;
    }

    console.log('✅ Commerciaux récupérés:', commercials.length);

    // Récupérer les adhérents
    const { data: adherents, error: adherentsError } = await supabase
      .from('adherents')
      .select('codeUnion, raisonSociale, annee, ca')
      .limit(1000); // Limiter pour le debug

    if (adherentsError) {
      console.error('❌ Erreur adhérents:', adherentsError);
      return;
    }

    console.log('✅ Adhérents récupérés:', adherents.length);

    // Analyser chaque commercial
    commercials.forEach((commercial: any) => {
      console.log(`\n📊 COMMERCIAL: ${commercial.nom}`);
      console.log(`   Email: ${commercial.email}`);
      console.log(`   Clients assignés: ${commercial.clients?.length || 0}`);
      console.log(`   Clients array:`, commercial.clients?.slice(0, 5), '...');

      if (commercial.clients && commercial.clients.length > 0) {
        // Vérifier la correspondance
        const assignedClients = commercial.clients;
        const foundAdherents = adherents.filter((adherent: any) => 
          assignedClients.includes(adherent.codeUnion)
        );

        console.log(`   ✅ Adhérents trouvés: ${foundAdherents.length}/${assignedClients.length}`);
        
        if (foundAdherents.length === 0) {
          console.log(`   ⚠️  AUCUN ADHÉRENT TROUVÉ !`);
          console.log(`   📋 Exemples de codes Union dans adherents:`, 
            adherents.slice(0, 5).map((a: any) => a.codeUnion)
          );
          console.log(`   📋 Exemples de codes dans commercials:`, 
            assignedClients.slice(0, 5)
          );
        } else {
          // Calculer le CA
          const ca2024 = foundAdherents
            .filter((item: any) => item.annee === 2024)
            .reduce((sum: number, item: any) => sum + item.ca, 0);
          
          const ca2025 = foundAdherents
            .filter((item: any) => item.annee === 2025)
            .reduce((sum: number, item: any) => sum + item.ca, 0);

          console.log(`   💰 CA 2024: ${ca2024.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
          console.log(`   💰 CA 2025: ${ca2025.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
          console.log(`   📈 Progression: ${ca2024 > 0 ? (((ca2025 - ca2024) / ca2024) * 100).toFixed(1) : 0}%`);
        }
      }
    });

    // Analyser les formats de codes Union
    console.log('\n🔍 ANALYSE DES FORMATS DE CODES UNION:');
    const adherentCodes = adherents.map((a: any) => a.codeUnion).slice(0, 10);
    console.log('📋 Exemples codes dans adherents:', adherentCodes);
    
    const commercialCodes = commercials.flatMap((c: any) => c.clients || []).slice(0, 10);
    console.log('📋 Exemples codes dans commercials:', commercialCodes);

    // Analyser les doublons dans adherents
    const adherentCodesCount = new Map();
    adherents.forEach((a: any) => {
      const count = adherentCodesCount.get(a.codeUnion) || 0;
      adherentCodesCount.set(a.codeUnion, count + 1);
    });
    
    const duplicates = Array.from(adherentCodesCount.entries()).filter(([code, count]) => count > 1);
    console.log(`\n🔄 DOUBLONS DANS ADHÉRENTS: ${duplicates.length} codes en doublon`);
    if (duplicates.length > 0) {
      console.log('📋 Exemples de doublons:', duplicates.slice(0, 5));
    }

    // Vérifier les correspondances exactes
    const adherentCodesSet = new Set(adherents.map((a: any) => a.codeUnion));
    const commercialCodesSet = new Set(commercials.flatMap((c: any) => c.clients || []));
    
    const adherentCodesArray = Array.from(adherentCodesSet);
    const intersection = adherentCodesArray.filter(code => commercialCodesSet.has(code));
    console.log(`\n📊 CORRESPONDANCES: ${intersection.length} codes communs`);
    console.log('📋 Codes communs:', intersection.slice(0, 10));
    
    // Vérifier si les codes communs sont bien dans les listes des commerciaux
    console.log('\n🔍 VÉRIFICATION DES CODES PAR COMMERCIAL:');
    commercials.forEach((commercial: any) => {
      const commercialCodes = commercial.clients || [];
      const matchingCodes = commercialCodes.filter((code: string) => intersection.includes(code));
      console.log(`  ${commercial.nom}: ${matchingCodes.length}/${commercialCodes.length} codes trouvés dans adherents`);
      if (matchingCodes.length > 0) {
        console.log(`    Exemples: ${matchingCodes.slice(0, 3).join(', ')}`);
      }
      
      // Vérifier les codes manquants
      const missingCodes = commercialCodes.filter((code: string) => !intersection.includes(code));
      if (missingCodes.length > 0) {
        console.log(`    Codes manquants (${missingCodes.length}): ${missingCodes.slice(0, 5).join(', ')}`);
      }
    });
    
    // Vérifier les formats exacts
    console.log('\n🔍 VÉRIFICATION DES FORMATS EXACTS:');
    const adherentSample = adherents.slice(0, 5).map((a: any) => `"${a.codeUnion}"`);
    const commercialSample = commercials.flatMap((c: any) => c.clients || []).slice(0, 5).map((code: string) => `"${code}"`);
    console.log('📋 Exemples adherents:', adherentSample);
    console.log('📋 Exemples commercials:', commercialSample);
    
    // Vérifier si les codes des commerciaux sont dans adherents
    console.log('\n🔍 VÉRIFICATION DIRECTE DES CODES COMMERCIAUX:');
    commercials.forEach((commercial: any) => {
      const commercialCodes = commercial.clients || [];
      console.log(`\n📊 ${commercial.nom}:`);
      console.log(`  Codes assignés: ${commercialCodes.length}`);
      
      // Vérifier les 10 premiers codes
      const first10Codes = commercialCodes.slice(0, 10);
      console.log(`  Premiers codes: ${first10Codes.join(', ')}`);
      
      // Vérifier si ces codes sont dans adherents
      const foundInAdherents = first10Codes.filter((code: string) => 
        adherents.some((adherent: any) => adherent.codeUnion === code)
      );
      console.log(`  Trouvés dans adherents: ${foundInAdherents.length}/10`);
      if (foundInAdherents.length > 0) {
        console.log(`  Exemples trouvés: ${foundInAdherents.join(', ')}`);
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
  }
}

// Fonction pour tester depuis la console
(window as any).debugCommercialsMapping = debugCommercialsMapping;
