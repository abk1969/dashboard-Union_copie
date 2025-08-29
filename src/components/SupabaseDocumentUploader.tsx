import React, { useState } from 'react';
import { Document, DocumentType } from '../types';
import { DOCUMENT_TYPES, getDocumentTypeColor, getDocumentTypeIconColor } from '../config/documentTypes';
import { DocumentService } from '../services/documentService';
import { supabase } from '../config/supabase';

interface SupabaseDocumentUploaderProps {
  codeUnion: string;
  onDocumentUploaded: (document: Document) => void;
  onClose: () => void;
}

export const SupabaseDocumentUploader: React.FC<SupabaseDocumentUploaderProps> = ({
  codeUnion,
  onDocumentUploaded,
  onClose
}) => {
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [nomFichier, setNomFichier] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handleDocumentTypeSelect = (documentType: DocumentType) => {
    setSelectedDocumentType(documentType);
    setError(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-remplir le nom du fichier si vide
      if (!nomFichier.trim()) {
        setNomFichier(file.name);
      }
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedDocumentType || !selectedFile) {
      setError('Veuillez sélectionner un type de document et un fichier');
      return;
    }

    if (!nomFichier.trim()) {
      setError('Veuillez saisir un nom de fichier');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // 1. Upload du fichier vers Supabase Storage
      console.log('🚀 Début de l\'upload vers Supabase Storage...');
      setUploadProgress(10);
      
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const filePath = `documents/${codeUnion}/${fileName}`;
      
      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Erreur upload Storage: ${uploadError.message}`);
      }

      console.log('✅ Fichier uploadé vers Storage:', uploadData);
      setUploadProgress(50);

      // 2. Récupérer l'URL publique du fichier
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('🔗 URL publique récupérée:', publicUrl);
      setUploadProgress(70);

      // 3. Ajouter les métadonnées en base
      const documentData = {
        codeUnion,
        typeDocument: selectedDocumentType.type,
        urlDrive: publicUrl, // Vraie URL du fichier stocké
        nomFichier: nomFichier.trim(),
        dateUpload: new Date(),
        statut: 'actif' as const,
        notes: notes.trim(),
      };

      console.log('🔄 Tentative d\'ajout du document:', documentData);
      setUploadProgress(80);

      const document = await DocumentService.addDocument(documentData);

      if (document) {
        setUploadProgress(100);
        
        console.log('✅ Document ajouté avec succès:', document);
        
        // Délai pour montrer la progression
        setTimeout(() => {
          onDocumentUploaded(document);
          onClose();
        }, 500);
      } else {
        console.error('❌ Erreur: DocumentService.addDocument a retourné null');
        setError('Erreur lors de l\'ajout du document - Vérifiez la console pour plus de détails');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload:', error);
      setError(`Erreur lors de l'ajout du document: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Type de document */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          📋 Type de Document *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {DOCUMENT_TYPES.map((docType) => (
            <button
              key={docType.type}
              onClick={() => handleDocumentTypeSelect(docType)}
              className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                selectedDocumentType?.type === docType.type
                  ? `border-${getDocumentTypeColor(docType.type)}-500 bg-${getDocumentTypeColor(docType.type)}-50`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`text-2xl mb-2 ${getDocumentTypeIconColor(docType.type)}`}>
                {docType.icon}
              </div>
              <div className="font-medium text-gray-800">{docType.label}</div>
              <div className="text-sm text-gray-600">{docType.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Sélection de fichier */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📁 Sélectionner le Fichier *
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            {selectedFile ? (
              <div className="space-y-2">
                <div className="text-4xl">📄</div>
                <div className="font-medium text-gray-800">{selectedFile.name}</div>
                <div className="text-sm text-gray-600">
                  Taille: {getFileSize(selectedFile.size)} | 
                  Type: {selectedFile.type || 'Inconnu'}
                </div>
                <div className="text-xs text-blue-600">Cliquez pour changer de fichier</div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-4xl">📁</div>
                <div className="font-medium text-gray-800">Cliquez pour sélectionner un fichier</div>
                <div className="text-sm text-gray-600">
                  PDF, Images, Documents Office acceptés
                </div>
                <div className="text-xs text-blue-600">Glissez-déposez ou cliquez pour parcourir</div>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Nom du fichier */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📝 Nom d'affichage (optionnel)
        </label>
        <input
          type="text"
          value={nomFichier}
          onChange={(e) => setNomFichier(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Nom personnalisé pour le document..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Laissez vide pour utiliser le nom original du fichier
        </p>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📝 Notes (optionnel)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="Ajoutez des notes sur ce document..."
        />
      </div>

      {/* Barre de progression */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Upload en cours...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          disabled={isUploading}
        >
          Annuler
        </button>
        <button
          onClick={handleUpload}
          disabled={isUploading || !selectedDocumentType || !selectedFile}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? '📤 Upload en cours...' : '📤 Ajouter le Document'}
        </button>
      </div>
    </div>
  );
};
