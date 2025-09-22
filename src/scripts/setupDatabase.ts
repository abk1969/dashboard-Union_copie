import { supabase } from '../config/supabase';

export async function setupDatabase() {
  console.log('🔄 Configuration de la base de données...');
  
  try {
    // Vérifier la connexion
    const { data: connectionTest, error: connectionError } = await supabase
      .from('clients')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.log('⚠️  Les tables n\'existent pas encore. Création nécessaire...');
      console.log('📋 Veuillez exécuter le SQL suivant dans votre console Supabase :');
      console.log('');
      console.log('-- Copiez et collez ce SQL dans Supabase SQL Editor --');
      console.log('');
      console.log(`
-- Table des clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code_union VARCHAR(50) UNIQUE NOT NULL,
  nom_client VARCHAR(255) NOT NULL,
  groupe VARCHAR(100),
  contact_magasin VARCHAR(255),
  adresse TEXT,
  code_postal VARCHAR(10),
  ville VARCHAR(100),
  telephone VARCHAR(20),
  contact_responsable_pdv VARCHAR(255),
  mail VARCHAR(255),
  siren_siret VARCHAR(20),
  agent_union VARCHAR(255),
  mail_agent VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  date_import TIMESTAMP WITH TIME ZONE,
  statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'suspendu')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des commerciaux Union
CREATE TABLE IF NOT EXISTS commercials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  region VARCHAR(100),
  clients TEXT[],
  ca_total DECIMAL(15, 2) DEFAULT 0,
  ca_2024 DECIMAL(15, 2) DEFAULT 0,
  ca_2025 DECIMAL(15, 2) DEFAULT 0,
  progression DECIMAL(5, 2) DEFAULT 0,
  nombre_clients INTEGER DEFAULT 0,
  statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif')),
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  derniere_activite TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_clients_code_union ON clients(code_union);
CREATE INDEX IF NOT EXISTS idx_clients_nom_client ON clients(nom_client);
CREATE INDEX IF NOT EXISTS idx_clients_agent_union ON clients(agent_union);
CREATE INDEX IF NOT EXISTS idx_clients_ville ON clients(ville);
CREATE INDEX IF NOT EXISTS idx_clients_statut ON clients(statut);

CREATE INDEX IF NOT EXISTS idx_commercials_email ON commercials(email);
CREATE INDEX IF NOT EXISTS idx_commercials_region ON commercials(region);
CREATE INDEX IF NOT EXISTS idx_commercials_statut ON commercials(statut);

-- Fonction pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commercials_updated_at BEFORE UPDATE ON commercials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
      console.log('');
      console.log('✅ Après avoir exécuté le SQL, relancez l\'application !');
      return { success: false, needsSetup: true };
    }

    console.log('✅ Base de données configurée !');
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  setupDatabase().then(result => {
    if (result.success) {
      console.log('🎉 Base de données prête !');
      process.exit(0);
    } else if (result.needsSetup) {
      console.log('📋 Veuillez suivre les instructions ci-dessus');
      process.exit(0);
    } else {
      console.error('💥 Erreur:', result.error);
      process.exit(1);
    }
  });
}
