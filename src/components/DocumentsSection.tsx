import React, { useState, useEffect } from 'react';
import { Document } from '../types';
import { DOCUMENT_TYPES, getDocumentTypeIconColor } from '../config/documentTypes';
import { DocumentService } from '../services/documentService';
import { SupabaseDocumentUploader } from './SupabaseDocumentUploader';

interface DocumentsSectionProps {
  onDocumentUploaded?: (document: Document) => void;
}

export const DocumentsSection: React.FC<DocumentsSectionProps> = ({ onDocumentUploaded }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [selectedAdherent, setSelectedAdherent] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showViewer, setShowViewer] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const allDocs = await DocumentService.getAllDocuments();
      setDocuments(allDocs);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUploaded = (document: Document) => {
    setDocuments(prev => [document, ...prev]);
    if (onDocumentUploaded) {
      onDocumentUploaded(document);
    }
    setShowUploader(false);
    setSelectedAdherent('');
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setShowViewer(true);
  };

  const handleEditDocument = (document: Document) => {
    setSelectedDocument(document);
    setShowEditor(true);
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      const success = await DocumentService.deleteDocument(documentId);
      if (success) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        console.log('✅ Document supprimé avec succès');
      } else {
        console.error('❌ Erreur lors de la suppression du document');
        alert('Erreur lors de la suppression du document');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du document');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.nomFichier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.codeUnion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || doc.typeDocument === selectedType;
    return matchesSearch && matchesType;
  });

  const documentStats = documents.reduce((acc, doc) => {
    acc[doc.typeDocument] = (acc[doc.typeDocument] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalDocuments = documents.length;

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">📁 Gestion des Documents</h2>
            <p className="text-blue-100">Consultez et gérez tous les documents des adhérents</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{totalDocuments}</div>
            <div className="text-blue-100">Documents</div>
          </div>
        </div>
      </div>

      {/* Statistiques par type */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {DOCUMENT_TYPES.map(type => (
          <div key={type.type} className="bg-white rounded-lg p-4 text-center shadow-md">
            <div className={`text-2xl mb-2 ${getDocumentTypeIconColor(type.type)}`}>
              {type.icon}
            </div>
            <div className="text-lg font-bold text-gray-800">
              {documentStats[type.type] || 0}
            </div>
            <div className="text-sm text-gray-600">{type.label}</div>
          </div>
        ))}
      </div>

      {/* Actions et recherche */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <input
              type="text"
              placeholder="Rechercher par nom de fichier ou code adhérent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1"
            />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les types</option>
              {DOCUMENT_TYPES.map(type => (
                <option key={type.type} value={type.type}>{type.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowUploader(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            📤 Ajouter un document
          </button>
        </div>
      </div>

      {/* Liste des documents */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          📋 Documents ({filteredDocuments.length})
        </h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Chargement des documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📁</div>
            <p className="text-gray-600 text-lg">
              {documents.length === 0 
                ? "Aucun document n'a encore été ajouté" 
                : "Aucun document ne correspond à votre recherche"}
            </p>
            {documents.length === 0 && (
              <button
                onClick={() => setShowUploader(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                📤 Ajouter le premier document
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fichier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adhérent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((doc) => {
                  const docType = DOCUMENT_TYPES.find(t => t.type === doc.typeDocument);
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`text-2xl mr-3 ${getDocumentTypeIconColor(doc.typeDocument)}`}>
                            {docType?.icon || '📄'}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{docType?.label || doc.typeDocument}</div>
                            <div className="text-sm text-gray-500">{docType?.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{doc.nomFichier}</div>
                        {doc.notes && (
                          <div className="text-sm text-gray-500">{doc.notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{doc.codeUnion}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(doc.dateUpload).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          doc.statut === 'actif' 
                            ? 'bg-green-100 text-green-800' 
                            : doc.statut === 'archive'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {doc.statut === 'actif' ? 'Actif' : doc.statut === 'archive' ? 'Archivé' : 'Supprimé'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleViewDocument(doc)}
                          className="text-blue-600 hover:text-blue-900 mr-3 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          👁️ Voir
                        </button>
                        <button 
                          onClick={() => handleEditDocument(doc)}
                          className="text-green-600 hover:text-green-900 mr-3 px-2 py-1 rounded hover:bg-green-50 transition-colors"
                        >
                          ✏️ Modifier
                        </button>
                        <button 
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          🗑️ Supprimer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal d'upload */}
      {showUploader && (
        <SupabaseDocumentUploader
          codeUnion={selectedAdherent}
          onDocumentUploaded={handleDocumentUploaded}
          onClose={() => {
            setShowUploader(false);
            setSelectedAdherent('');
          }}
        />
      )}

      {/* Modal de visualisation */}
      {showViewer && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">
                📄 {selectedDocument.nomFichier}
              </h3>
              <button
                onClick={() => setShowViewer(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type de document</label>
                  <p className="text-sm text-gray-900">{selectedDocument.typeDocument}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Code Union</label>
                  <p className="text-sm text-gray-900">{selectedDocument.codeUnion}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date d'upload</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedDocument.dateUpload).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Statut</label>
                  <p className="text-sm text-gray-900">{selectedDocument.statut}</p>
                </div>
              </div>
              
              {selectedDocument.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <p className="text-sm text-gray-900">{selectedDocument.notes}</p>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <a
                  href={selectedDocument.urlDrive}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  🔗 Ouvrir le document
                </a>
                <button
                  onClick={() => setShowViewer(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  ✕ Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {showEditor && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">
                ✏️ Modifier le document
              </h3>
              <button
                onClick={() => setShowEditor(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du fichier
                </label>
                <input
                  type="text"
                  value={selectedDocument.nomFichier}
                  onChange={(e) => setSelectedDocument(prev => prev ? {...prev, nomFichier: e.target.value} : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={selectedDocument.notes || ''}
                  onChange={(e) => setSelectedDocument(prev => prev ? {...prev, notes: e.target.value} : null)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={async () => {
                    if (selectedDocument) {
                      try {
                        const success = await DocumentService.updateDocument(selectedDocument.id, {
                          nomFichier: selectedDocument.nomFichier,
                          notes: selectedDocument.notes
                        });
                        if (success) {
                          setDocuments(prev => prev.map(doc => 
                            doc.id === selectedDocument.id ? selectedDocument : doc
                          ));
                          setShowEditor(false);
                          console.log('✅ Document modifié avec succès');
                        }
                      } catch (error) {
                        console.error('❌ Erreur lors de la modification:', error);
                        alert('Erreur lors de la modification du document');
                      }
                    }
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  💾 Sauvegarder
                </button>
                <button
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  ✕ Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
