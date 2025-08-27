const fs = require('fs');
const path = require('path');

console.log('🚀 Conversion JSON → CSV pour Supabase...');

function convertJsonToCsv() {
  try {
    // Lire le fichier JSON
    const jsonPath = path.join(__dirname, '../public/groupementUnion_data_2025-08-26.json');
    const csvPath = path.join(__dirname, '../public/groupementUnion_data.csv');
    
    console.log('📖 Lecture du fichier JSON...');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    if (!jsonData.data || !Array.isArray(jsonData.data)) {
      throw new Error('Structure de données invalide');
    }
    
    console.log(`📊 Données trouvées: ${jsonData.data.length} enregistrements`);
    
    // Créer les en-têtes CSV
    const headers = [
      'codeUnion',
      'raisonSociale', 
      'groupeClient',
      'fournisseur',
      'marque',
      'sousFamille',
      'groupeFournisseur',
      'annee',
      'ca'
    ];
    
    // Créer le contenu CSV
    const csvContent = [
      headers.join(','), // En-têtes
      ...jsonData.data.map(record => [
        `"${record.codeUnion || ''}"`,
        `"${record.raisonSociale || ''}"`,
        `"${record.groupeClient || ''}"`,
        `"${record.fournisseur || ''}"`,
        `"${record.marque || ''}"`,
        `"${record.sousFamille || ''}"`,
        `"${record.groupeFournisseur || ''}"`,
        record.annee || '',
        record.ca || ''
      ].join(','))
    ].join('\n');
    
    // Écrire le fichier CSV
    fs.writeFileSync(csvPath, csvContent, 'utf8');
    
    const originalSize = fs.statSync(jsonPath).size;
    const csvSize = fs.statSync(csvPath).size;
    
    console.log('✅ Conversion terminée !');
    console.log(`📁 Fichier JSON: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📁 Fichier CSV: ${(csvSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📉 Réduction: ${((1 - csvSize / originalSize) * 100).toFixed(1)}%`);
    console.log(`📍 Fichier CSV créé: ${csvPath}`);
    
    console.log('\n🎯 Prochaine étape:');
    console.log('1. Aller dans Supabase Table Editor');
    console.log('2. Cliquer sur "Import data"');
    console.log('3. Sélectionner le fichier CSV');
    console.log('4. Importer vos données !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la conversion:', error);
  }
}

// Lancer la conversion
convertJsonToCsv();
