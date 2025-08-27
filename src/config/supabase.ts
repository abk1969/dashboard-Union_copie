// Configuration Supabase
const supabaseUrl = 'https://ybzajzcwxcgoxtqsimol.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliemFqemN3eGNnb3h0cXNpbW9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODgwODcsImV4cCI6MjA3MTg2NDA4N30.zLJEdhKpcsWiGIsvAyZpsNn-YVXmgaudeSDHW4Dectc';

// Types pour vos données
export interface SupabaseAdherent {
  id: number;
  codeUnion: string;
  raisonSociale: string;
  groupeClient: string;
  fournisseur: string;
  marque: string;
  sousFamille: string;
  groupeFournisseur: string;
  annee: number;
  ca: number;
}

// Fonction pour récupérer toutes les données depuis Supabase
export const fetchAdherentsData = async (): Promise<SupabaseAdherent[]> => {
  try {
    console.log('🚀 Tentative de connexion à Supabase...');
    
    let allData: SupabaseAdherent[] = [];
    let page = 0;
    const pageSize = 1000; // Taille maximale par page
    let hasMoreData = true;
    
    // Récupération par pages pour contourner la limite de 1000
    while (hasMoreData) {
      const offset = page * pageSize;
      console.log(`📄 Récupération de la page ${page + 1} (offset: ${offset})...`);
      
      const response = await fetch(`${supabaseUrl}/rest/v1/adherents?select=*&limit=${pageSize}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const pageData = await response.json();
      console.log(`✅ Page ${page + 1} récupérée:`, pageData.length, 'enregistrements');
      
      if (pageData.length === 0) {
        hasMoreData = false;
      } else {
        allData = [...allData, ...pageData];
        page++;
        
        // Si on a moins de pageSize enregistrements, c'est la dernière page
        if (pageData.length < pageSize) {
          hasMoreData = false;
        }
      }
    }
    
    console.log('✅ Toutes les données récupérées depuis Supabase:', allData.length, 'enregistrements');
    return allData;
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération depuis Supabase:', error);
    return [];
  }
};
