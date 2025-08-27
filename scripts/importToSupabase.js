const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

console.log('🚀 Script d\'import Supabase pour Groupement Union...');

// Configuration Supabase (à remplir)
const supabaseUrl = 'VOTRE_SUPABASE_URL';
const supabaseKey = 'VOTRE_SUPABASE_ANON_KEY';

console.log('📋 Instructions :');
console.log('1. Dans votre projet Supabase, allez dans "Settings" (⚙️)');
console.log('2. Cliquez sur "API"');
console.log('3. Copiez "Project URL" et "anon public" key');
console.log('4. Remplacez les valeurs dans ce script');

console.log('\n📁 Fichier JSON à importer :');
console.log('Chemin:', path.join(__dirname, '../public/groupementUnion_data_2025-08-26.json'));

console.log('\n💡 Une fois la configuration copiée, on pourra importer vos données !');
