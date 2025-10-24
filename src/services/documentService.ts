import { Document } from '../types';
import { getSupabaseHeaders, getSupabaseRestUrl } from '../config/supabase';
import { encrypt, decrypt } from '../utils/encryption';

interface SupabaseDocument {
  id: number;
  code_union: string;
  type_document: string;
  url_drive?: string;
  nom_fichier: string;
  date_upload: string;
  statut: string;
  notes?: string;
  created_at: string;
}

const convertSupabaseDocument = (doc: SupabaseDocument): Document => {
  return {
    id: doc.id,
    codeUnion: doc.code_union,
    typeDocument: doc.type_document as any,
    urlDrive: doc.url_drive || '',
    nomFichier: decrypt(doc.nom_fichier),
    dateUpload: new Date(doc.date_upload),
    statut: doc.statut as any,
    notes: doc.notes ? decrypt(doc.notes) : undefined,
    createdAt: new Date(doc.created_at),
  };
};

export class DocumentService {
  /**
   * Récupère tous les documents d'un adhérent
   */
  static async getDocumentsByCodeUnion(codeUnion: string): Promise<Document[]> {
    try {
      const response = await fetch(
        getSupabaseRestUrl(`documents?code_union=eq.${codeUnion}&select=*`),
        {
          headers: getSupabaseHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur Supabase: ${response.status}`);
      }

      const data: SupabaseDocument[] = await response.json();
      return data.map(convertSupabaseDocument);
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      return [];
    }
  }

  /**
   * Récupère tous les documents
   */
  static async getAllDocuments(): Promise<Document[]> {
    try {
      const response = await fetch(
        getSupabaseRestUrl('documents?select=*'),
        {
          headers: getSupabaseHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur Supabase: ${response.status}`);
      }

      const data: SupabaseDocument[] = await response.json();
      return data.map(convertSupabaseDocument);
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      return [];
    }
  }

  /**
   * Ajoute un nouveau document (sans upload de fichier pour l'instant)
   */
  static async addDocument(document: Omit<Document, 'id' | 'createdAt'>): Promise<Document | null> {
    try {
      const documentData = {
        code_union: document.codeUnion,
        type_document: document.typeDocument,
        url_drive: document.urlDrive,
        nom_fichier: encrypt(document.nomFichier),
        date_upload: document.dateUpload.toISOString(),
        statut: document.statut,
        notes: document.notes ? encrypt(document.notes) : '',
      };

      console.log('📤 Tentative d\'insertion dans Supabase:', documentData);

      const response = await fetch(
        getSupabaseRestUrl('documents'),
        {
          method: 'POST',
          headers: {
            ...getSupabaseHeaders(),
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(documentData),
        }
      );

      console.log('📡 Réponse Supabase:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur Supabase:', response.status, errorText);
        throw new Error(`Erreur insertion Supabase: ${response.status} - ${errorText}`);
      }

      const insertedDoc: SupabaseDocument[] = await response.json();
      console.log('✅ Document inséré dans Supabase:', insertedDoc);
      
      if (insertedDoc.length === 0) {
        throw new Error('Aucun document retourné par Supabase après insertion');
      }

      return convertSupabaseDocument(insertedDoc[0]);
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout du document:', error);
      throw error; // Re-lancer l'erreur pour la gérer dans le composant
    }
  }

  /**
   * Met à jour un document
   */
  static async updateDocument(id: number, updates: Partial<Document>): Promise<Document | null> {
    try {
      const response = await fetch(
        getSupabaseRestUrl(`documents?id=eq.${id}`),
        {
          method: 'PATCH',
          headers: {
            ...getSupabaseHeaders(),
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur mise à jour: ${response.status}`);
      }

      const data: SupabaseDocument[] = await response.json();
      return data.length > 0 ? convertSupabaseDocument(data[0]) : null;
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      return null;
    }
  }

  /**
   * Supprime un document (soft delete)
   */
  static async deleteDocument(id: number): Promise<boolean> {
    try {
      const response = await fetch(
        getSupabaseRestUrl(`documents?id=eq.${id}`),
        {
          method: 'PATCH',
          headers: getSupabaseHeaders(),
          body: JSON.stringify({ statut: 'supprime' }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      return false;
    }
  }

  /**
   * Vérifie si la table documents existe
   */
  static async checkTableExists(): Promise<boolean> {
    try {
      const response = await fetch(
        getSupabaseRestUrl('documents?select=id&limit=1'),
        {
          headers: getSupabaseHeaders(),
        }
      );

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
