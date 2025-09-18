import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { createNote } from '../config/supabase-users';

interface NotesImportProps {
  onImportComplete: () => void;
}

const NotesImport: React.FC<NotesImportProps> = ({ onImportComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResults(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setImportResults(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log('📊 Données Excel:', jsonData);

      let successCount = 0;
      const errors: string[] = [];

      for (const row of jsonData as any[]) {
        try {
          // Mapping des colonnes Excel vers notre structure
          const noteData = {
            codeUnion: row['CODE UNION'] || row['code_union'] || '',
            noteSimple: row['NOTE SIMPLE'] || row['note_simple'] || '',
            dateCreation: row['DATE CREATION'] || row['date_creation'] || '',
            auteur: row['AUTEUR'] || row['auteur'] || ''
          };

          // Validation des données
          if (!noteData.codeUnion || !noteData.auteur) {
            errors.push(`Ligne invalide: ${JSON.stringify(row)}`);
            continue;
          }
          
          // Si pas de note simple, utiliser une note par défaut
          if (!noteData.noteSimple) {
            noteData.noteSimple = `Note importée le ${new Date().toLocaleDateString('fr-FR')}`;
          }

          // Conversion de la date si nécessaire
          let dateCreation = noteData.dateCreation;
          if (typeof dateCreation === 'number') {
            // Excel date number
            const excelDate = new Date((dateCreation - 25569) * 86400 * 1000);
            dateCreation = excelDate.toISOString();
          } else if (typeof dateCreation === 'string') {
            // String date - essayer de la parser
            let parsedDate;
            
            // Essayer différents formats de date
            if (dateCreation.includes('/')) {
              // Format français DD/MM/YYYY HH:MM:SS
              const parts = dateCreation.split(' ');
              const datePart = parts[0].split('/');
              if (datePart.length === 3) {
                // DD/MM/YYYY -> YYYY-MM-DD
                parsedDate = new Date(`${datePart[2]}-${datePart[1].padStart(2, '0')}-${datePart[0].padStart(2, '0')}`);
              }
            } else {
              // Format ISO ou autre
              parsedDate = new Date(dateCreation);
            }
            
            if (parsedDate && !isNaN(parsedDate.getTime())) {
              dateCreation = parsedDate.toISOString();
            } else {
              // Si la date est invalide, utiliser la date actuelle
              console.warn(`Date invalide pour ${noteData.codeUnion}: ${dateCreation}, utilisation de la date actuelle`);
              dateCreation = new Date().toISOString();
            }
          } else {
            // Si pas de date, utiliser la date actuelle
            dateCreation = new Date().toISOString();
          }

          await createNote({
            codeUnion: noteData.codeUnion,
            noteSimple: noteData.noteSimple,
            auteur: noteData.auteur,
            dateCreation: dateCreation
          });

          successCount++;
        } catch (error) {
          console.error('Erreur lors de l\'import de la ligne:', row, error);
          errors.push(`Erreur pour ${row['CODE UNION'] || 'ligne inconnue'}: ${error}`);
        }
      }

      setImportResults({
        success: successCount,
        errors
      });

      if (successCount > 0) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      setImportResults({
        success: 0,
        errors: [`Erreur générale: ${error}`]
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">📥 Import des Notes Excel</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionner votre fichier Excel
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Format attendu: CODE UNION | NOTE SIMPLE | DATE CREATION | AUTEUR
          </p>
        </div>

        {file && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              📁 Fichier sélectionné: {file.name}
            </p>
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={!file || importing}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
        >
          {importing ? '⏳ Import en cours...' : '📥 Importer les Notes'}
        </button>

        {importResults && (
          <div className="mt-4">
            <div className="bg-green-50 p-3 rounded-lg mb-2">
              <p className="text-sm text-green-800">
                ✅ {importResults.success} notes importées avec succès
              </p>
            </div>

            {importResults.errors.length > 0 && (
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm text-red-800 font-medium mb-2">
                  ❌ Erreurs ({importResults.errors.length}):
                </p>
                <ul className="text-xs text-red-700 space-y-1">
                  {importResults.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesImport;
