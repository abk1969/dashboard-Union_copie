import React from 'react';
import { AdherentData } from '../types';

interface DataExporterProps {
  adherentsData: AdherentData[];
}

const DataExporter: React.FC<DataExporterProps> = ({ adherentsData }) => {
  const exportToJSON = () => {
    const dataToExport = {
      timestamp: new Date().toISOString(),
      count: adherentsData.length,
      data: adherentsData,
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `groupementUnion_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    const dataToExport = {
      timestamp: new Date().toISOString(),
      count: adherentsData.length,
      data: adherentsData,
      version: '1.0'
    };

    navigator.clipboard.writeText(JSON.stringify(dataToExport, null, 2))
      .then(() => alert('Données copiées dans le presse-papiers !'))
      .catch(() => alert('Erreur lors de la copie'));
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-yellow-800">📤 Export des Données</h3>
          <p className="text-sm text-yellow-700">
            Exportez vos données pour les intégrer au déploiement Vercel
          </p>
        </div>
        <div className="text-sm text-yellow-600">
          {adherentsData.length} enregistrements
        </div>
      </div>
      
      <div className="flex gap-3 mt-3">
        <button
          onClick={exportToJSON}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          📁 Télécharger JSON
        </button>
        <button
          onClick={copyToClipboard}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
        >
          📋 Copier dans Presse-papiers
        </button>
      </div>
      
      <div className="mt-3 text-xs text-yellow-600">
        💡 <strong>Instructions :</strong> 
        1. Téléchargez le JSON, 2. Placez-le dans le dossier <code>public/</code>, 
        3. Déployez sur Vercel
      </div>
    </div>
  );
};

export default DataExporter;
