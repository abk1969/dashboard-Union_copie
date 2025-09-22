// Script pour analyser votre fichier d'import et déterminer le bon mapping
const fs = require('fs');
const csv = require('csv-parser');

function analyzeImportFile(filePath) {
  console.log('🔍 Analyse du fichier d\'import...');
  console.log('=====================================');
  
  const results = [];
  let lineCount = 0;
  let maxColumns = 0;
  const columnHeaders = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ';' })) // Ajustez le séparateur si nécessaire
      .on('data', (row) => {
        lineCount++;
        const columns = Object.keys(row);
        maxColumns = Math.max(maxColumns, columns.length);
        
        if (lineCount === 1) {
          // Première ligne = en-têtes
          columnHeaders.push(...columns);
          console.log('📋 En-têtes détectés :');
          columns.forEach((header, index) => {
            console.log(`   ${index + 1}. ${header}`);
          });
        }
        
        if (lineCount <= 5) {
          // Afficher les 5 premières lignes de données
          console.log(`\n📄 Ligne ${lineCount} :`);
          columns.forEach((value, index) => {
            console.log(`   ${index + 1}. ${value}`);
          });
        }
        
        results.push(row);
      })
      .on('end', () => {
        console.log(`\n📊 Statistiques :`);
        console.log(`   Nombre de lignes : ${lineCount}`);
        console.log(`   Nombre de colonnes : ${maxColumns}`);
        
        // Proposer un mapping basé sur les en-têtes
        console.log(`\n🎯 Mapping suggéré :`);
        const suggestedMapping = {};
        
        columnHeaders.forEach((header, index) => {
          const headerLower = header.toLowerCase();
          
          if (headerLower.includes('raison') && headerLower.includes('sociale')) {
            suggestedMapping.raisonSociale = index;
          } else if (headerLower.includes('code') && headerLower.includes('union')) {
            suggestedMapping.codeUnion = index;
          } else if (headerLower.includes('groupe') && headerLower.includes('client')) {
            suggestedMapping.groupeClient = index;
          } else if (headerLower.includes('fournisseur') && !headerLower.includes('groupe')) {
            suggestedMapping.fournisseur = index;
          } else if (headerLower.includes('marque')) {
            suggestedMapping.marque = index;
          } else if (headerLower.includes('famille') && !headerLower.includes('sous')) {
            suggestedMapping.famille = index;
          } else if (headerLower.includes('sous') && headerLower.includes('famille')) {
            suggestedMapping.sousFamille = index;
          } else if (headerLower.includes('groupe') && (headerLower.includes('frs') || headerLower.includes('fournisseur'))) {
            suggestedMapping.groupeFournisseur = index;
          } else if (headerLower.includes('année') || headerLower.includes('annee')) {
            suggestedMapping.annee = index;
          } else if (headerLower.includes('ca') || headerLower.includes('chiffre')) {
            suggestedMapping.ca = index;
          }
        });
        
        console.log('Mapping suggéré :');
        Object.entries(suggestedMapping).forEach(([key, value]) => {
          console.log(`  ${key}: ${value + 1} (${columnHeaders[value]})`);
        });
        
        // Vérifier si la colonne famille existe
        if (suggestedMapping.famille === undefined) {
          console.log('\n⚠️  ATTENTION : Aucune colonne "famille" détectée !');
          console.log('   Solutions possibles :');
          console.log('   1. Votre fichier n\'a pas de colonne famille');
          console.log('   2. La colonne famille a un nom différent');
          console.log('   3. Il faut ajuster le mapping manuellement');
        }
        
        resolve({
          lineCount,
          maxColumns,
          columnHeaders,
          suggestedMapping,
          results: results.slice(0, 10) // Premières 10 lignes seulement
        });
      })
      .on('error', reject);
  });
}

// Utilisation
const filePath = process.argv[2];
if (!filePath) {
  console.log('Usage: node analyze-import-file.js <chemin-vers-fichier>');
  console.log('Exemple: node analyze-import-file.js data/import.csv');
  process.exit(1);
}

analyzeImportFile(filePath)
  .then(result => {
    console.log('\n✅ Analyse terminée !');
  })
  .catch(error => {
    console.error('❌ Erreur:', error);
  });
