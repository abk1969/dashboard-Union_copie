const fetch = require('node-fetch');

const SUPABASE_URL = 'https://ybzajzcwxcgoxtqsimol.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliemFqemN3eGNnb3h0cXNpbW9sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4ODA4NywiZXhwIjoyMDcxODY0MDg3fQ.t6KhbnUmh5Ix3CWlYM5HxjR58GNxtug-h_GMzE9VIio';

async function checkAdherentM0110() {
  try {
    // Vérifier si l'adhérent M0110 existe
    const response = await fetch(`${SUPABASE_URL}/rest/v1/adherents?codeUnion=eq.M0110&select=*`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const adherents = await response.json();
      console.log(`🔍 Recherche de l'adhérent M0110: ${adherents.length} résultat(s)\n`);
      
      if (adherents.length > 0) {
        adherents.forEach((adherent, index) => {
          console.log(`🏢 Adhérent ${index + 1}:`);
          console.log(`   Code Union: ${adherent.codeUnion}`);
          console.log(`   Raison Sociale: ${adherent.raisonSociale}`);
          console.log(`   Groupe Client: ${adherent.groupeClient}`);
          console.log(`   Fournisseur: ${adherent.fournisseur}`);
          console.log(`   Marque: ${adherent.marque}`);
          console.log(`   Année: ${adherent.annee}`);
          console.log(`   CA: ${adherent.ca}`);
          console.log('');
        });
      } else {
        console.log('❌ Aucun adhérent trouvé avec le code Union M0110');
      }
    } else {
      console.error('❌ Erreur:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkAdherentM0110();
