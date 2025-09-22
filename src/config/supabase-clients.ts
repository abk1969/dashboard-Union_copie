import { supabase } from './supabase';

export interface ClientInfo {
  id?: string;
  codeUnion: string;
  nomClient: string;
  groupe: string;
  contactMagasin: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  contactResponsablePDV?: string;
  mail: string;
  sirenSiret: string;
  agentUnion: string;
  mailAgent: string;
  latitude?: number;
  longitude?: number;
  dateImport?: Date;
  statut?: 'actif' | 'inactif' | 'suspendu';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CommercialUnion {
  id?: string;
  nom: string;
  email: string;
  region: string;
  clients: string[]; // codes Union des clients
  caTotal: number;
  ca2024: number;
  ca2025: number;
  progression: number;
  nombreClients: number;
  statut: 'actif' | 'inactif';
  dateCreation: Date;
  derniereActivite?: Date;
  created_at?: string;
  updated_at?: string;
}

/**
 * Sauvegarde un client dans Supabase
 */
export async function saveClient(client: ClientInfo): Promise<{ success: boolean; error?: string; data?: ClientInfo }> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .upsert([{
        code_union: client.codeUnion,
        nom_client: client.nomClient,
        groupe: client.groupe,
        contact_magasin: client.contactMagasin,
        adresse: client.adresse,
        code_postal: client.codePostal,
        ville: client.ville,
        telephone: client.telephone,
        contact_responsable_pdv: client.contactResponsablePDV,
        mail: client.mail,
        siren_siret: client.sirenSiret,
        agent_union: client.agentUnion,
        mail_agent: client.mailAgent,
        latitude: client.latitude,
        longitude: client.longitude,
        date_import: client.dateImport?.toISOString(),
        statut: client.statut || 'actif',
        notes: client.notes
      }], {
        onConflict: 'code_union'
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la sauvegarde du client:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ClientInfo };
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du client:', error);
    return { success: false, error: 'Erreur inattendue lors de la sauvegarde' };
  }
}

/**
 * Sauvegarde un commercial dans Supabase
 */
export async function saveCommercial(commercial: CommercialUnion): Promise<{ success: boolean; error?: string; data?: CommercialUnion }> {
  try {
    const { data, error } = await supabase
      .from('commercials')
      .upsert([{
        nom: commercial.nom,
        email: commercial.email,
        region: commercial.region,
        clients: commercial.clients,
        ca_total: commercial.caTotal,
        ca_2024: commercial.ca2024,
        ca_2025: commercial.ca2025,
        progression: commercial.progression,
        nombre_clients: commercial.nombreClients,
        statut: commercial.statut,
        date_creation: commercial.dateCreation.toISOString(),
        derniere_activite: commercial.derniereActivite?.toISOString()
      }], {
        onConflict: 'email'
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la sauvegarde du commercial:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as CommercialUnion };
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du commercial:', error);
    return { success: false, error: 'Erreur inattendue lors de la sauvegarde' };
  }
}

/**
 * Récupère tous les clients
 */
export async function getClients(): Promise<{ success: boolean; data?: ClientInfo[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('nom_client');

    if (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      return { success: false, error: error.message };
    }

    // Mapper les données de la base vers le format JavaScript
    const mappedData: ClientInfo[] = (data || []).map((row: any) => ({
      id: row.id,
      codeUnion: row.code_union,
      nomClient: row.nom_client,
      groupe: row.groupe,
      contactMagasin: row.contact_magasin,
      adresse: row.adresse,
      codePostal: row.code_postal,
      ville: row.ville,
      telephone: row.telephone,
      contactResponsablePDV: row.contact_responsable_pdv,
      mail: row.mail,
      sirenSiret: row.siren_siret,
      agentUnion: row.agent_union,
      mailAgent: row.mail_agent,
      latitude: row.latitude,
      longitude: row.longitude,
      dateImport: row.date_import ? new Date(row.date_import) : undefined,
      statut: row.statut,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    return { success: true, data: mappedData };
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    return { success: false, error: 'Erreur inattendue lors de la récupération' };
  }
}

/**
 * Récupère tous les commerciaux
 */
export async function getCommercials(): Promise<{ success: boolean; data?: CommercialUnion[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('commercials')
      .select('*')
      .order('nom');

    if (error) {
      console.error('Erreur lors de la récupération des commerciaux:', error);
      return { success: false, error: error.message };
    }

    // Mapper les données de la base vers le format JavaScript
    const mappedData: CommercialUnion[] = (data || []).map((row: any) => ({
      id: row.id,
      nom: row.nom,
      email: row.email,
      region: row.region,
      clients: row.clients || [],
      caTotal: row.ca_total || 0,
      ca2024: row.ca_2024 || 0,
      ca2025: row.ca_2025 || 0,
      progression: row.progression || 0,
      nombreClients: row.nombre_clients || 0,
      statut: row.statut || 'actif',
      dateCreation: row.date_creation ? new Date(row.date_creation) : new Date(),
      derniereActivite: row.derniere_activite ? new Date(row.derniere_activite) : undefined,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    return { success: true, data: mappedData };
  } catch (error) {
    console.error('Erreur lors de la récupération des commerciaux:', error);
    return { success: false, error: 'Erreur inattendue lors de la récupération' };
  }
}

/**
 * Supprime un client
 */
export async function deleteClient(codeUnion: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('code_union', codeUnion);

    if (error) {
      console.error('Erreur lors de la suppression du client:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la suppression du client:', error);
    return { success: false, error: 'Erreur inattendue lors de la suppression' };
  }
}
