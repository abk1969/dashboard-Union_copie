import { getClients } from '../config/supabase-clients';

async function debugClients() {
  console.log('🔍 Debug des clients importés...');
  
  try {
    const result = await getClients();
    
    if (result.success && result.data) {
      console.log(`📊 Total clients: ${result.data.length}`);
      
      // Afficher les 5 premiers clients avec tous leurs champs
      console.log('📋 Premiers 5 clients:');
      result.data.slice(0, 5).forEach((client, index) => {
        console.log(`Client ${index + 1}:`, {
          codeUnion: client.codeUnion,
          nomClient: client.nomClient,
          groupe: client.groupe,
          ville: client.ville,
          telephone: client.telephone,
          mail: client.mail,
          agentUnion: client.agentUnion
        });
      });
      
      // Chercher des clients avec des codes Union spécifiques
      const testCodes = ['M0013', 'M0158', '0013', '0158'];
      testCodes.forEach(code => {
        const found = result.data?.find(c => c.codeUnion === code);
        console.log(`🔍 Recherche "${code}":`, found ? 'TROUVÉ' : 'NON TROUVÉ');
      });
      
      // Afficher tous les codes Union uniques
      const allCodes = result.data?.map(c => c.codeUnion).filter(Boolean) || [];
      const uniqueCodes = Array.from(new Set(allCodes));
      console.log('🔢 Codes Union uniques (premiers 20):', uniqueCodes.slice(0, 20));
      
    } else {
      console.error('❌ Erreur:', result.error);
    }
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  debugClients().then(() => {
    console.log('✅ Debug terminé');
    process.exit(0);
  });
}

export { debugClients };
