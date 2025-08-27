const fs = require('fs');
const path = require('path');

console.log('🧹 Suppression des doublons codeUnion...');

function removeDuplicates() {
  try {
    // Lire le fichier CSV nettoyé
    const csvPath = path.join(__dirname, '../public/groupementUnion_data_clean.csv');
    const dedupedCsvPath = path.join(__dirname, '../public/groupementUnion_data_deduped.csv');
    
    console.log('📖 Lecture du fichier CSV...');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    // Diviser en lignes
    const lines = csvContent.split('\n');
    
    if (lines.length === 0) {
      throw new Error('Fichier CSV vide');
    }
    
    const headers = lines[0];
    const dataLines = lines.slice(1);
    
    console.log(`📊 Total des lignes: ${dataLines.length}`);
    
    // Garder une trace des codeUnion déjà vus
    const seenCodeUnions = new Set();
    const uniqueLines = [];
    
    // Traiter chaque ligne de données
    dataLines.forEach((line, index) => {
      if (line.trim()) {
        const columns = line.split(',');
        const codeUnion = columns[0]?.replace(/"/g, '').trim();
        
        if (codeUnion && !seenCodeUnions.has(codeUnion)) {
          seenCodeUnions.add(codeUnion);
          uniqueLines.push(line);
        } else if (codeUnion) {
          console.log(`⚠️ Doublon trouvé: ${codeUnion} (ligne ${index + 2})`);
        }
      }
    });
    
    // Créer le nouveau contenu CSV
    const dedupedContent = [headers, ...uniqueLines].join('\n');
    
    // Écrire le fichier sans doublons
    fs.writeFileSync(dedupedCsvPath, dedupedContent, 'utf8');
    
    const originalSize = fs.statSync(csvPath).size;
    const dedupedSize = fs.statSync(dedupedCsvPath).size;
    
    console.log('✅ Suppression des doublons terminée !');
    console.log(`📊 Lignes originales: ${dataLines.length}`);
    console.log(`📊 Lignes uniques: ${uniqueLines.length}`);
    console.log(`📊 Doublons supprimés: ${dataLines.length - uniqueLines.length}`);
    console.log(`📁 Fichier original: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📁 Fichier sans doublons: ${(dedupedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📍 Fichier créé: ${dedupedCsvPath}`);
    
    console.log('\n🎯 Prochaine étape:');
    console.log('1. Importer groupementUnion_data_deduped.csv dans Supabase');
    console.log('2. Plus de problème de doublons !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression des doublons:', error);
  }
}

removeDuplicates();
