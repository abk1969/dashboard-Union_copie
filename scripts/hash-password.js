
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('--- Script de Hachage de Mot de Passe ---');
console.log('Ce script génère un hash bcrypt sécurisé pour un mot de passe.');
console.log('Utilisez ce hash pour vos variables d\'environnement (ex: REACT_APP_ADMIN_PASSWORD_HASH).\n');

rl.question('Veuillez entrer le mot de passe à hacher: ', (password) => {
  if (!password) {
    console.error('\nErreur: Le mot de passe ne peut pas être vide.');
    rl.close();
    return;
  }

  // Le "salt round" détermine la complexité du hash. 10 est un bon équilibre.
  const saltRounds = 10;

  console.log('\n🔄 Génération du hash...');

  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      console.error('❌ Erreur lors de la génération du hash:', err);
    } else {
      console.log('\n✅ Hash généré avec succès !');
      console.log('----------------------------------------------------');
      console.log(hash);
      console.log('----------------------------------------------------');
      console.log('\nCopiez ce hash et utilisez-le comme valeur pour votre variable d\'environnement.');
    }
    rl.close();
  });
});
