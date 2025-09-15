import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
export const SUPABASE_CONFIG = {
  url: 'https://ybzajzcwxcgoxtqsimol.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliemFqemN3eGNnb3h0cXNpbW9sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4ODA4NywiZXhwIjoyMDcxODY0MDg3fQ.t6KhbnUmh5Ix3CWlYM5HxjR58GNxtug-h_GMzE9VIio',
};

// Créer le client Supabase
export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// Headers par défaut pour les requêtes Supabase
export const getSupabaseHeaders = () => ({
  'apikey': SUPABASE_CONFIG.anonKey,
  'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
  'Content-Type': 'application/json',
});

// URL de base pour l'API REST
export const getSupabaseRestUrl = (endpoint: string) => 
  `${SUPABASE_CONFIG.url}/rest/v1/${endpoint}`;

// Types pour vos données
export interface SupabaseAdherent {
  id: number;
  codeUnion: string;
  raisonSociale: string;
  groupeClient: string;
  regionCommerciale?: string; // Nouvelle colonne région
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
      
      const response = await fetch(getSupabaseRestUrl(`adherents?select=*,regionCommerciale&limit=${pageSize}&offset=${offset}`), {
        method: 'GET',
        headers: getSupabaseHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const pageData = await response.json();
      console.log(`✅ Page ${page + 1} récupérée:`, pageData.length, 'enregistrements');
      
      // Debug: voir les colonnes du premier élément
      if (page === 0 && pageData.length > 0) {
        console.log('🔍 Colonnes Supabase:', Object.keys(pageData[0]));
        console.log('🌍 Premier élément regionCommerciale:', pageData[0].regionCommerciale);
      }
      
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
