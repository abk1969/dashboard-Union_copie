import { supabase } from './supabase';

export interface Client {
  id: string;
  code_union: string;
  nom_client: string;
  groupe: string;
  contact_magasin?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  telephone?: string;
  contact_responsable_pdv?: string;
  mail?: string;
  siren_siret?: string;
  agent_union?: string;
  mail_agent?: string;
  latitude?: number;
  longitude?: number;
  date_import?: string;
  statut?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Fonction pour inspecter la structure de la table clients
export const inspectClientsTable = async () => {
  try {
    console.log('🔍 Inspection de la table clients...');
    
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Erreur inspection table clients:', error);
      return;
    }

    if (clients && clients.length > 0) {
      console.log('📋 Structure de la table clients:', Object.keys(clients[0]));
      console.log('📋 Exemple de client:', clients[0]);
    } else {
      console.log('📋 Table clients vide');
    }
  } catch (error) {
    console.error('❌ Erreur inspection table clients:', error);
  }
};

// Fonction pour récupérer tous les clients
export const fetchClients = async (): Promise<Client[]> => {
  try {
    console.log('🔍 Récupération des clients...');
    
    // D'abord inspecter la structure
    await inspectClientsTable();
    
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .order('code_union', { ascending: true });

    if (error) {
      console.error('❌ Erreur récupération clients:', error);
      return [];
    }

    console.log(`✅ Clients récupérés: ${clients?.length || 0}`);
    return clients || [];
  } catch (error) {
    console.error('❌ Erreur récupération clients:', error);
    return [];
  }
};

// Fonction pour récupérer un client par son code Union
export const fetchClientByCodeUnion = async (codeUnion: string): Promise<Client | null> => {
  try {
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('code_union', codeUnion)
      .single();

    if (error) {
      console.error('❌ Erreur récupération client:', error);
      return null;
    }

    return client;
  } catch (error) {
    console.error('❌ Erreur récupération client:', error);
    return null;
  }
};

// Fonction pour mettre à jour un client
export const updateClient = async (id: string, updates: Partial<Client>): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('❌ Erreur mise à jour client:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Client mis à jour avec succès');
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur mise à jour client:', error);
    return { success: false, error: 'Erreur lors de la mise à jour' };
  }
};

// Fonction pour sauvegarder un client (alias pour compatibilité)
export const saveClient = async (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: Client; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert([client])
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur sauvegarde client:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Client sauvegardé avec succès');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur sauvegarde client:', error);
    return { success: false, error: 'Erreur lors de la sauvegarde' };
  }
};

// Fonction pour sauvegarder un commercial (alias pour compatibilité)
export const saveCommercial = async (commercial: any): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('commercials')
      .insert([commercial])
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur sauvegarde commercial:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Commercial sauvegardé avec succès');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur sauvegarde commercial:', error);
    return { success: false, error: 'Erreur lors de la sauvegarde' };
  }
};