-- Script pour ajouter les colonnes de coordonnées à la table clients
-- Ce script permet de stocker les coordonnées GPS pour éviter les appels API répétés

-- 1. Ajouter les colonnes latitude et longitude à la table clients
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- 2. Ajouter un index pour les requêtes géographiques
CREATE INDEX IF NOT EXISTS idx_clients_coordinates ON clients(latitude, longitude);

-- 3. Ajouter un index sur le code postal pour les requêtes de géolocalisation
CREATE INDEX IF NOT EXISTS idx_clients_code_postal ON clients(code_postal);

-- 4. Vérifier la structure de la table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
  AND column_name IN ('latitude', 'longitude', 'code_postal', 'ville')
ORDER BY ordinal_position;

-- 5. Afficher quelques exemples de données
SELECT 
  id,
  code_union,
  nom_client,
  ville,
  code_postal,
  latitude,
  longitude
FROM clients 
WHERE code_postal IS NOT NULL
LIMIT 5;
