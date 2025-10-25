import { createClient } from '@supabase/supabase-js';
import { AdherentData } from '../types';

// Configuration Supabase depuis les variables d'environnement
// Pour Create React App, utiliser process.env.REACT_APP_* au lieu de import.meta.env.VITE_*
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Fallback vers les valeurs hardcodées si les variables d'environnement ne sont pas définies
export const SUPABASE_CONFIG = {
  url: supabaseUrl || 'https://ybzajzcwxcgoxtqsimol.supabase.co',
  anonKey: supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliemFqemN3eGNnb3h0cXNpbW9sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4ODA4NywiZXhwIjoyMDcxODY0MDg3fQ.t6KhbnUmh5Ix3CWlYM5HxjR58GNxtug-h_GMzE9VIio',
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
  famille: string;
  sousFamille: string;
  groupeFournisseur: string;
  annee: number;
  ca: number;
  agentUnion?: string; // Agent Union assigné (enrichi depuis la table clients)
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
      
      const requestUrl = `adherents?select=codeUnion,raisonSociale,groupeClient,fournisseur,marque,famille,sousFamille,groupeFournisseur,annee,ca,regionCommerciale&limit=${pageSize}&offset=${offset}`;
      console.log('🔗 URL Supabase:', requestUrl);
      const response = await fetch(getSupabaseRestUrl(requestUrl), {
        method: 'GET',
        headers: getSupabaseHeaders()
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

// Fonction pour enrichir les données d'adhérents avec l'agent_union depuis la table clients
export const enrichAdherentsWithAgentUnion = async (adherentsData: SupabaseAdherent[]): Promise<SupabaseAdherent[]> => {
  try {
    console.log('🔄 Enrichissement des données adhérents avec agent_union...');
    
    // Récupérer tous les clients avec leur agent_union
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('code_union, agent_union')
      .not('agent_union', 'is', null)
      .neq('agent_union', '');
    
    if (clientsError) {
      console.error('❌ Erreur lors de la récupération des clients:', clientsError);
      return adherentsData; // Retourner les données originales en cas d'erreur
    }
    
    // Créer un map pour un accès rapide
    const clientsMap = new Map<string, string>();
    clients?.forEach((client: any) => {
      if (client.code_union && client.agent_union) {
        clientsMap.set(client.code_union, client.agent_union);
      }
    });
    
    console.log(`✅ ${clientsMap.size} clients avec agent_union trouvés`);
    
    // Enrichir les données d'adhérents
    const enrichedData = adherentsData.map(adherent => ({
      ...adherent,
      agentUnion: clientsMap.get(adherent.codeUnion) || 'Non assigné'
    }));
    
    console.log('✅ Données adhérents enrichies avec agent_union');
    return enrichedData;
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'enrichissement:', error);
    return adherentsData; // Retourner les données originales en cas d'erreur
  }
};

// Fonction pour enrichir les données clients avec les CA de la table adherents
export const enrichClientsWithCAData = async (clientsData: any[]): Promise<AdherentData[]> => {
  try {
    console.log('🔄 Enrichissement des données clients avec CA...');
    
    // Récupérer TOUTES les données des adhérents (CA)
    let allAdherents: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMoreData = true;
    
    while (hasMoreData) {
      const offset = page * pageSize;
      console.log(`📄 Récupération page ${page + 1} (offset: ${offset})...`);
      
      const { data: pageData, error: pageError } = await supabase
        .from('adherents')
        .select('codeUnion, raisonSociale, groupeClient, regionCommerciale, fournisseur, marque, famille, sousFamille, groupeFournisseur, annee, ca')
        .range(offset, offset + pageSize - 1);
      
      if (pageError) {
        throw new Error(`Erreur lors de la récupération des adhérents: ${pageError.message}`);
      }
      
      if (pageData && pageData.length > 0) {
        allAdherents = [...allAdherents, ...pageData];
        page++;
        
        if (pageData.length < pageSize) {
          hasMoreData = false;
        }
      } else {
        hasMoreData = false;
      }
    }
    
    console.log(`✅ Tous les adhérents récupérés: ${allAdherents.length} enregistrements`);
    
    // Créer un map des CA par code Union
    const caMap = new Map<string, { ca2024: number; ca2025: number; fournisseur: string; marque: string; famille: string; sousFamille: string; groupeFournisseur: string; regionCommerciale?: string }[]>();
    
    allAdherents.forEach(adherent => {
      const key = adherent.codeUnion;
      if (!caMap.has(key)) {
        caMap.set(key, []);
      }
      caMap.get(key)!.push({
        ca2024: adherent.annee === 2024 ? adherent.ca : 0,
        ca2025: adherent.annee === 2025 ? adherent.ca : 0,
        fournisseur: adherent.fournisseur,
        marque: adherent.marque,
        famille: adherent.famille,
        sousFamille: adherent.sousFamille,
        groupeFournisseur: adherent.groupeFournisseur,
        regionCommerciale: adherent.regionCommerciale
      });
    });
    
    console.log(`✅ ${caMap.size} clients avec données CA trouvés`);
    
    // Enrichir les données clients avec les CA
    const enrichedData: AdherentData[] = [];
    
    clientsData.forEach(client => {
      const codeUnion = client.code_union;
      const caData = caMap.get(codeUnion) || [];
      
      if (caData.length > 0) {
        // Client avec CA - créer une entrée pour chaque ligne de CA
        caData.forEach(ca => {
          enrichedData.push({
            raisonSociale: client.nom_client,
            codeUnion: codeUnion,
            groupeClient: client.groupe || '',
            regionCommerciale: ca.regionCommerciale,
            fournisseur: ca.fournisseur,
            marque: ca.marque,
            famille: ca.famille,
            sousFamille: ca.sousFamille,
            groupeFournisseur: ca.groupeFournisseur,
            annee: ca.ca2024 > 0 ? 2024 : 2025,
            ca: ca.ca2024 > 0 ? ca.ca2024 : ca.ca2025,
            agentUnion: client.agent_union || 'Non assigné'
          });
        });
      } else {
        // Client sans CA - créer une entrée avec CA = 0
        enrichedData.push({
          raisonSociale: client.nom_client,
          codeUnion: codeUnion,
          groupeClient: client.groupe || '',
          regionCommerciale: undefined,
          fournisseur: '',
          marque: '',
          famille: '',
          sousFamille: '',
          groupeFournisseur: '',
          annee: 2025,
          ca: 0,
          agentUnion: client.agent_union || 'Non assigné'
        });
      }
    });
    
    console.log(`✅ ${enrichedData.length} enregistrements enrichis créés`);
    return enrichedData;
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'enrichissement CA:', error);
    return []; // Retourner un tableau vide en cas d'erreur
  }
};
