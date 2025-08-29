import React from 'react';

interface PDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string;
  documentName: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ isOpen, onClose, documentUrl, documentName }) => {
  if (!isOpen) return null;

  // Convertir l'URL Google Drive en URL directe pour le PDF
  const getDirectPDFUrl = (url: string) => {
    if (url.includes('drive.google.com')) {
      // Extraire l'ID du fichier Google Drive
      const fileId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      if (fileId) {
        // URL directe pour le PDF (version alternative)
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    return url;
  };

  const directUrl = getDirectPDFUrl(documentUrl);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">
            📄 {documentName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* PDF Content */}
        <div className="flex-1 p-4">
          {directUrl.includes('drive.google.com') ? (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center space-y-4">
                <div className="text-6xl">📄</div>
                <h4 className="text-xl font-semibold text-gray-700">
                  {documentName}
                </h4>
                <p className="text-gray-500 max-w-md">
                  Google Drive ne permet pas l'affichage direct dans l'outil pour des raisons de sécurité.
                </p>
                <div className="space-y-2">
                  <a
                    href={directUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    🔗 Ouvrir dans Google Drive
                  </a>
                  <a
                    href={documentUrl}
                    download
                    className="block w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                  >
                    📥 Télécharger le PDF
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full">
              <embed
                src={directUrl}
                type="application/pdf"
                className="w-full h-full"
                title={documentName}
              />
            </div>
          )}
        </div>

        {/* Footer avec boutons d'action */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              URL: {documentUrl}
            </div>
            <div className="space-x-2">
              <a
                href={directUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                🔗 Ouvrir dans un nouvel onglet
              </a>
              <a
                href={documentUrl}
                download
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                📥 Télécharger
              </a>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                ✕ Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
