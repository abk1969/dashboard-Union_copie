import React, { useState, useEffect } from 'react';
import { DocumentService } from '../services/documentService';

const DocumentTest: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testLoadDocuments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Test de chargement des documents pour M0110...');
      const docs = await DocumentService.getDocumentsByCodeUnion('M0110');
      console.log('📄 Documents récupérés:', docs);
      setDocuments(docs);
    } catch (err) {
      console.error('❌ Erreur:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const testDeleteDocument = async (id: number) => {
    try {
      console.log('🗑️ Test de suppression du document', id);
      const success = await DocumentService.deleteDocument(id);
      if (success) {
        console.log('✅ Document supprimé');
        setDocuments(prev => prev.filter(doc => doc.id !== id));
      } else {
        console.log('❌ Échec de la suppression');
      }
    } catch (err) {
      console.error('❌ Erreur lors de la suppression:', err);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🧪 Test des Documents</h2>
      
      <div className="mb-4">
        <button
          onClick={testLoadDocuments}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Chargement...' : 'Test Chargement Documents M0110'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          ❌ Erreur: {error}
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Documents trouvés: {documents.length}</h3>
        {documents.map(doc => (
          <div key={doc.id} className="border p-3 mb-2 rounded">
            <div><strong>ID:</strong> {doc.id}</div>
            <div><strong>Type:</strong> {doc.typeDocument}</div>
            <div><strong>Nom:</strong> {doc.nomFichier}</div>
            <div><strong>Code Union:</strong> {doc.codeUnion}</div>
            <div><strong>URL:</strong> {doc.urlDrive}</div>
            <button
              onClick={() => testDeleteDocument(doc.id)}
              className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              🗑️ Supprimer
            </button>
          </div>
        ))}
      </div>

      <div className="text-sm text-gray-600">
        <strong>Debug:</strong> Ce composant teste directement l'API des documents.
        Si les documents s'affichent ici mais pas dans le modal client, le problème est dans le composant ClientDetailModal.
      </div>
    </div>
  );
};

export default DocumentTest;
