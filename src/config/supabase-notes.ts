import { supabase } from './supabase';

export interface ClientNote {
  id: string;
  codeUnion: string;
  noteSimple: string;
  dateCreation: string;
  auteur: string;
  createdAt: string;
  updatedAt: string;
}

// Fonction pour créer une nouvelle note
export const createClientNote = async (noteData: Omit<ClientNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClientNote> => {
  try {
    const { data, error } = await supabase
      .from('client_notes')
      .insert([{
        code_union: noteData.codeUnion,
        note_simple: noteData.noteSimple,
        date_creation: noteData.dateCreation,
        auteur: noteData.auteur
      }])
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      codeUnion: data.code_union,
      noteSimple: data.note_simple,
      dateCreation: data.date_creation,
      auteur: data.auteur,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Erreur lors de la création de la note:', error);
    throw error;
  }
};

// Fonction pour récupérer toutes les notes
export const fetchClientNotes = async (): Promise<ClientNote[]> => {
  try {
    const { data, error } = await supabase
      .from('client_notes')
      .select('*')
      .order('date_creation', { ascending: false });

    if (error) throw error;
    
    return (data || []).map((row: any) => ({
      id: row.id,
      codeUnion: row.code_union,
      noteSimple: row.note_simple,
      dateCreation: row.date_creation,
      auteur: row.auteur,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des notes:', error);
    throw error;
  }
};

// Fonction pour récupérer les notes d'un client spécifique
export const fetchClientNotesByCode = async (codeUnion: string): Promise<ClientNote[]> => {
  try {
    const { data, error } = await supabase
      .from('client_notes')
      .select('*')
      .eq('code_union', codeUnion)
      .order('date_creation', { ascending: false });

    if (error) throw error;
    
    return (data || []).map((row: any) => ({
      id: row.id,
      codeUnion: row.code_union,
      noteSimple: row.note_simple,
      dateCreation: row.date_creation,
      auteur: row.auteur,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des notes du client:', error);
    throw error;
  }
};

// Fonction pour mettre à jour une note
export const updateClientNote = async (noteId: string, updates: Partial<ClientNote>): Promise<ClientNote> => {
  try {
    const dbUpdates: any = {};
    if (updates.noteSimple) dbUpdates.note_simple = updates.noteSimple;
    if (updates.dateCreation) dbUpdates.date_creation = updates.dateCreation;
    if (updates.auteur) dbUpdates.auteur = updates.auteur;
    
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('client_notes')
      .update(dbUpdates)
      .eq('id', noteId)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      codeUnion: data.code_union,
      noteSimple: data.note_simple,
      dateCreation: data.date_creation,
      auteur: data.auteur,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la note:', error);
    throw error;
  }
};

// Fonction pour supprimer une note
export const deleteClientNote = async (noteId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('client_notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la suppression de la note:', error);
    throw error;
  }
};

// Fonction pour rechercher des notes
export const searchClientNotes = async (searchTerm: string): Promise<ClientNote[]> => {
  try {
    const { data, error } = await supabase
      .from('client_notes')
      .select('*')
      .or(`code_union.ilike.%${searchTerm}%,note_simple.ilike.%${searchTerm}%,auteur.ilike.%${searchTerm}%`)
      .order('date_creation', { ascending: false });

    if (error) throw error;
    
    return (data || []).map((row: any) => ({
      id: row.id,
      codeUnion: row.code_union,
      noteSimple: row.note_simple,
      dateCreation: row.date_creation,
      auteur: row.auteur,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (error) {
    console.error('Erreur lors de la recherche des notes:', error);
    throw error;
  }
};
