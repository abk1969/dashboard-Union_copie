const fs = require('fs');
const path = require('path');

console.log('🚀 Optimisation du fichier JSON...');

// Lire le fichier original
const inputPath = path.join(__dirname, '../public/groupementUnion_data_2025-08-26.json');
const outputPath = path.join(__dirname, '../public/groupementUnion_data_optimized.json');

try {
  console.log('📖 Lecture du fichier original...');
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  
  console.log(`📊 Données originales: ${data.data ? data.data.length : 0} enregistrements`);
  
  if (data.data && Array.isArray(data.data)) {
    // Optimiser chaque enregistrement
    const optimizedData = data.data.map(record => ({
      codeUnion: record.codeUnion,
      raisonSociale: record.raisonSociale,
      groupeClient: record.groupeClient,
      fournisseur: record.fournisseur,
      marque: record.marque,
      sousFamille: record.sousFamille,
      groupeFournisseur: record.groupeFournisseur,
      annee: record.annee,
      // Arrondir le CA à 2 décimales pour réduire la taille
      ca: Math.round(record.ca * 100) / 100
    }));
    
    // Créer le fichier optimisé
    const optimizedFile = {
      timestamp: new Date().toISOString(),
      count: optimizedData.length,
      data: optimizedData,
      version: '1.0-optimized'
    };
    
    // Écrire le fichier optimisé
    fs.writeFileSync(outputPath, JSON.stringify(optimizedFile, null, 0));
    
    const originalSize = fs.statSync(inputPath).size;
    const optimizedSize = fs.statSync(outputPath).size;
    
    console.log('✅ Optimisation terminée !');
    console.log(`📁 Fichier original: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📁 Fichier optimisé: ${(optimizedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📉 Réduction: ${((1 - optimizedSize / originalSize) * 100).toFixed(1)}%`);
    
    // Vérifier si le fichier est maintenant assez petit pour Vercel
    if (optimizedSize < 10 * 1024 * 1024) { // < 10MB
      console.log('🎉 Fichier optimisé prêt pour Vercel !');
    } else {
      console.log('⚠️ Fichier encore trop gros pour Vercel');
      console.log('💡 Considérer la Solution 2 ou 3');
    }
    
  } else {
    console.error('❌ Structure de données invalide');
  }
  
} catch (error) {
  console.error('❌ Erreur lors de l\'optimisation:', error);
}
