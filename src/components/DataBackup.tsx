import React, { useState, useEffect, useCallback } from 'react';
import { AdherentData } from '../types';

interface DataBackupProps {
  allAdherentData: AdherentData[];
  onDataRestored: (data: AdherentData[]) => void;
}

const DataBackup: React.FC<DataBackupProps> = ({ allAdherentData, onDataRestored }) => {
  const [lastBackup, setLastBackup] = useState<string>('');
  const [backupStatus, setBackupStatus] = useState<'idle' | 'backing-up' | 'restoring' | 'success' | 'error'>('idle');
  const [backupMessage, setBackupMessage] = useState<string>('');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(true);

  const performAutoBackup = useCallback(() => {
    try {
      const timestamp = new Date().toISOString();
      const backupData = {
        timestamp,
        data: allAdherentData,
        version: '1.0'
      };
      
      localStorage.setItem('groupementUnion_backup', JSON.stringify(backupData));
      setLastBackup(timestamp);
      
      console.log('🔄 Sauvegarde automatique effectuée:', backupData.data.length, 'enregistrements');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde automatique:', error);
    }
  }, [allAdherentData]);

  // Charger la dernière sauvegarde au démarrage
  useEffect(() => {
    loadLastBackupInfo();
  }, []);

  // Sauvegarder automatiquement toutes les 5 minutes
  useEffect(() => {
    if (!autoBackupEnabled) return;

    const interval = setInterval(() => {
      if (allAdherentData.length > 0) {
        performAutoBackup();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [allAdherentData, autoBackupEnabled, performAutoBackup]);

  const performManualBackup = async () => {
    setBackupStatus('backing-up');
    setBackupMessage('Sauvegarde en cours...');

    try {
      const backupData = {
        data: allAdherentData,
        timestamp: new Date().toISOString(),
        count: allAdherentData.length,
        version: '1.0',
        description: 'Sauvegarde manuelle'
      };

      // Sauvegarde locale
      localStorage.setItem('groupementUnion_backup', JSON.stringify(backupData));
      
      // Sauvegarde fichier
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `groupementUnion_backup_${new Date().toISOString().split('T')[0]}_${new Date().getHours()}-${new Date().getMinutes()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setLastBackup(new Date().toLocaleString('fr-FR'));
      setBackupStatus('success');
      setBackupMessage(`✅ Sauvegarde réussie ! ${backupData.count} enregistrements sauvegardés`);
      
      setTimeout(() => setBackupStatus('idle'), 3000);
    } catch (error) {
      setBackupStatus('error');
      setBackupMessage(`❌ Erreur lors de la sauvegarde: ${error}`);
      setTimeout(() => setBackupStatus('idle'), 5000);
    }
  };

  const restoreFromBackup = async (file?: File) => {
    setBackupStatus('restoring');
    setBackupMessage('Restauration en cours...');

    try {
      let backupData;

      if (file) {
        // Restaurer depuis un fichier
        const text = await file.text();
        backupData = JSON.parse(text);
      } else {
        // Restaurer depuis le localStorage
        const localBackup = localStorage.getItem('groupementUnion_backup');
        if (!localBackup) {
          throw new Error('Aucune sauvegarde locale trouvée');
        }
        backupData = JSON.parse(localBackup);
      }

      // Valider les données de sauvegarde
      if (!backupData.data || !Array.isArray(backupData.data)) {
        throw new Error('Format de sauvegarde invalide');
      }

      // Restaurer les données
      onDataRestored(backupData.data);
      
      setBackupStatus('success');
      setBackupMessage(`✅ Restauration réussie ! ${backupData.data.length} enregistrements restaurés`);
      
      setTimeout(() => setBackupStatus('idle'), 3000);
    } catch (error) {
      setBackupStatus('error');
      setBackupMessage(`❌ Erreur lors de la restauration: ${error}`);
      setTimeout(() => setBackupStatus('idle'), 5000);
    }
  };

  const loadLastBackupInfo = () => {
    try {
      const localBackup = localStorage.getItem('groupementUnion_backup');
      if (localBackup) {
        const backupData = JSON.parse(localBackup);
        setLastBackup(backupData.timestamp);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des informations de sauvegarde:', error);
    }
  };

  const clearBackup = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer la sauvegarde locale ? Cette action est irréversible.')) {
      localStorage.removeItem('groupementUnion_backup');
      setLastBackup('');
      setBackupMessage('🗑️ Sauvegarde locale supprimée');
      setTimeout(() => setBackupMessage(''), 3000);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      restoreFromBackup(file);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">💾 Sauvegarde & Restauration</h3>
          <p className="text-gray-600 mt-1">
            Protégez vos données avec des sauvegardes automatiques et manuelles
          </p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          {allAdherentData.length} enregistrements
        </div>
      </div>

      {/* Statut de la sauvegarde */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center">
            <span className="text-blue-600 text-2xl mr-3">🔄</span>
            <div>
              <div className="text-sm font-medium text-blue-800">Sauvegarde Auto</div>
              <div className="text-xs text-blue-600">
                {autoBackupEnabled ? 'Activée (5 min)' : 'Désactivée'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center">
            <span className="text-green-600 text-2xl mr-3">💾</span>
            <div>
              <div className="text-sm font-medium text-green-800">Dernière Sauvegarde</div>
              <div className="text-xs text-green-600">
                {lastBackup ? new Date(lastBackup).toLocaleString('fr-FR') : 'Aucune'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center">
            <span className="text-purple-600 text-2xl mr-3">📊</span>
            <div>
              <div className="text-sm font-medium text-purple-800">Enregistrements</div>
              <div className="text-xs text-purple-600">
                {allAdherentData.length.toLocaleString('fr-FR')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions de sauvegarde */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={performManualBackup}
          disabled={backupStatus === 'backing-up' || allAdherentData.length === 0}
          className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {backupStatus === 'backing-up' ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Sauvegarde...
            </>
          ) : (
            <>
              <span className="mr-2">💾</span>
              Sauvegarder Maintenant
            </>
          )}
        </button>

        <button
          onClick={() => document.getElementById('restore-file')?.click()}
          disabled={backupStatus === 'restoring'}
          className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {backupStatus === 'restoring' ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Restauration...
            </>
          ) : (
            <>
              <span className="mr-2">📁</span>
              Restaurer depuis Fichier
            </>
          )}
        </button>
      </div>

      {/* Restauration depuis sauvegarde locale */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => restoreFromBackup()}
          disabled={backupStatus === 'restoring' || !lastBackup}
          className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <span className="mr-2">🔄</span>
          Restaurer Sauvegarde Locale
        </button>

        <button
          onClick={clearBackup}
          disabled={!lastBackup}
          className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <span className="mr-2">🗑️</span>
          Supprimer Sauvegarde Locale
        </button>
      </div>

      {/* Configuration */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-800">Sauvegarde Automatique</div>
            <div className="text-xs text-gray-600">Sauvegarde automatique toutes les 5 minutes</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoBackupEnabled}
              onChange={(e) => setAutoBackupEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Messages de statut */}
      {backupMessage && (
        <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${
          backupStatus === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
          backupStatus === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
          'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          {backupMessage}
        </div>
      )}

      {/* Fichier caché pour la restauration */}
      <input
        id="restore-file"
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Informations de sécurité */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <span className="text-yellow-600 text-lg mr-3 mt-0.5">⚠️</span>
          <div className="text-yellow-800 text-sm">
            <div className="font-medium mb-1">Conseils de Sécurité :</div>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Conservez vos fichiers de sauvegarde dans un endroit sûr</li>
              <li>Faites des sauvegardes régulières avant les mises à jour</li>
              <li>La sauvegarde locale est limitée à votre navigateur</li>
              <li>Testez la restauration sur des données de test d'abord</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataBackup;
