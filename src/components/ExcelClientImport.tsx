import React, { useState, useCallback } from 'react';
import { ExcelImportService } from '../services/excelImportService';
import { ExcelImportResult } from '../types';

interface ExcelClientImportProps {
  onImportComplete: (result: ExcelImportResult) => void;
  onClose: () => void;
}

export const ExcelClientImport: React.FC<ExcelClientImportProps> = ({
  onImportComplete,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ExcelImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
      return;
    }

    setIsLoading(true);
    setImportResult(null);

    try {
      const result = await ExcelImportService.parseClientExcel(file);
      setImportResult(result);
      
      if (result.success) {
        onImportComplete(result);
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      setImportResult({
        success: false,
        clientsImported: 0,
        clientsUpdated: 0,
        errors: [`Erreur lors de l'import: ${error}`],
        warnings: [],
        data: [],
        commercials: []
      });
    } finally {
      setIsLoading(false);
    }
  }, [onImportComplete]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload]);

  const downloadTemplate = useCallback(() => {
    ExcelImportService.generateTemplate();
  }, []);

  const renderImportResult = () => {
    if (!importResult) return null;

    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">
          {importResult.success ? '✅ Import réussi' : '❌ Erreurs d\'import'}
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white p-3 rounded border">
            <div className="text-2xl font-bold text-green-600">{importResult.clientsImported}</div>
            <div className="text-sm text-gray-600">Clients importés</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-2xl font-bold text-blue-600">{importResult.commercials.length}</div>
            <div className="text-sm text-gray-600">Commerciaux détectés</div>
          </div>
        </div>

        {importResult.errors.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-red-600 mb-2">Erreurs :</h4>
            <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
              {importResult.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {importResult.warnings.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-yellow-600 mb-2">Avertissements :</h4>
            <ul className="list-disc list-inside text-sm text-yellow-600 space-y-1">
              {importResult.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {importResult.success && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-green-600 mb-2">Commerciaux détectés :</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {importResult.commercials.map((commercial, index) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <div className="font-medium">{commercial.nom}</div>
                    <div className="text-sm text-gray-600">{commercial.email}</div>
                    <div className="text-sm text-blue-600">{commercial.region}</div>
                    <div className="text-sm text-gray-500">{commercial.nombreClients} clients</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📊 Import Excel - Données Clients</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">📋 Instructions d'import</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Le fichier Excel doit contenir les colonnes : CODE UNION, Nom client, GROUPE, etc.</li>
              <li>• Téléchargez le template pour voir le format exact</li>
              <li>• Les données seront enrichies avec les coordonnées géographiques</li>
              <li>• Les commerciaux seront automatiquement détectés et créés</li>
            </ul>
          </div>

          {/* Zone de drop */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isLoading ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600">Traitement du fichier Excel...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-6xl">📁</div>
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    Glissez-déposez votre fichier Excel ici
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    ou cliquez pour sélectionner un fichier
                  </p>
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Sélectionner un fichier
                </label>
              </div>
            )}
          </div>

          {/* Bouton template */}
          <div className="text-center">
            <button
              onClick={downloadTemplate}
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              📥 Télécharger le template Excel
            </button>
          </div>

          {/* Résultats */}
          {renderImportResult()}

          {/* Actions */}
          {importResult && (
            <div className="flex justify-end space-x-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Fermer
              </button>
              {importResult.success && (
                <button
                  onClick={() => {
                    onImportComplete(importResult);
                    onClose();
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Confirmer l'import
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
