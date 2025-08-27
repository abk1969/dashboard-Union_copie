const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, writeBatch, doc } = require('firebase/firestore');

console.log('🚀 Script d\'import Firebase pour Groupement Union...');

// Configuration Firebase RÉELLE
const firebaseConfig = {
  apiKey: "AIzaSyAgpMwtW-wbGexi4FAp2mHjI-Lx3AVYfvI",
  authDomain: "groupement-union-dashboard.firebaseapp.com",
  projectId: "groupement-union-dashboard",
  storageBucket: "groupement-union-dashboard.firebasestorage.app",
  messagingSenderId: "738021594845",
  appId: "1:738021594845:web:ae4d43a52d4a34d8a12d34"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function importData() {
  try {
    console.log('📖 Lecture du fichier JSON...');
    
    // Lire le fichier JSON
    const jsonPath = path.join(__dirname, '../public/groupementUnion_data_2025-08-26.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    if (!jsonData.data || !Array.isArray(jsonData.data)) {
      throw new Error('Structure de données invalide');
    }
    
    console.log(`📊 Données trouvées: ${jsonData.data.length} enregistrements`);
    
    // Importer par lots de 500 (limite Firebase)
    const batchSize = 500;
    const totalBatches = Math.ceil(jsonData.data.length / batchSize);
    
    console.log(`🔄 Import en ${totalBatches} lots...`);
    
    for (let i = 0; i < totalBatches; i++) {
      const batch = writeBatch(db);
      const start = i * batchSize;
      const end = Math.min(start + batchSize, jsonData.data.length);
      const batchData = jsonData.data.slice(start, end);
      
      console.log(`📦 Lot ${i + 1}/${totalBatches}: ${start + 1}-${end}`);
      
      batchData.forEach((record, index) => {
        // Créer un ID unique pour chaque document
        const docId = `adherent_${start + index + 1}`;
        const docRef = doc(db, 'adherents', docId);
        
        batch.set(docRef, {
          ...record,
          importedAt: new Date().toISOString(),
          documentId: docId
        });
      });
      
      await batch.commit();
      console.log(`✅ Lot ${i + 1} importé avec succès`);
    }
    
    console.log('🎉 Import terminé avec succès !');
    console.log(`📊 Total importé: ${jsonData.data.length} enregistrements`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
  }
}

// Lancer l'import
importData();
