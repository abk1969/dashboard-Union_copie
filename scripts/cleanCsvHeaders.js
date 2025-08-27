const fs = require('fs');
const path = require('path');

console.log('🧹 Nettoyage des en-têtes CSV...');

function cleanCsvHeaders() {
  try {
    // Lire le fichier CSV original
    const csvPath = path.join(__dirname, '../public/groupementUnion_data.csv');
    const cleanCsvPath = path.join(__dirname, '../public/groupementUnion_data_clean.csv');
    
    console.log('📖 Lecture du fichier CSV...');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    // Diviser en lignes
    const lines = csvContent.split('\n');
    
    if (lines.length === 0) {
      throw new Error('Fichier CSV vide');
    }
    
    // Nettoyer la première ligne (en-têtes)
    const headers = lines[0].split(',').map(header => {
      // Enlever les guillemets et espaces
      return header.replace(/"/g, '').trim();
    });
    
    console.log('🔍 En-têtes trouvés:', headers);
    
    // Créer le nouveau contenu CSV
    const cleanLines = [
      headers.join(','), // En-têtes nettoyés
      ...lines.slice(1)  // Données (inchangées)
    ];
    
    // Écrire le fichier nettoyé
    fs.writeFileSync(cleanCsvPath, cleanLines.join('\n'), 'utf8');
    
    const originalSize = fs.statSync(csvPath).size;
    const cleanSize = fs.statSync(cleanCsvPath).size;
    
    console.log('✅ Nettoyage terminé !');
    console.log(`📁 Fichier original: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📁 Fichier nettoyé: ${(cleanSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📍 Fichier créé: ${cleanCsvPath}`);
    
    console.log('\n🎯 Prochaine étape:');
    console.log('1. Importer groupementUnion_data_clean.csv dans Supabase');
    console.log('2. Les en-têtes seront parfaits !');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
}

cleanCsvHeaders();
