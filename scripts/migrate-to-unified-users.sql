-- Migration vers une structure unifiée
-- Ce script migre les données des tables commercials et user_photos vers users

-- 1. Ajouter les colonnes manquantes à la table users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS clients_assignes TEXT[],
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS role_entreprise TEXT,
ADD COLUMN IF NOT EXISTS plateformes_autorisees TEXT[];

-- 2. Migrer les données des commerciaux vers users
-- (Seulement les colonnes qui existent dans commercials)
UPDATE users 
SET 
  clients_assignes = commercials.clients
FROM commercials 
WHERE users.email = commercials.email;

-- 3. Migrer les photos des user_photos vers users
UPDATE users 
SET photo_url = user_photos.file_path
FROM user_photos 
WHERE users.id = user_photos.user_id;

-- 4. Mettre à jour le rôle pour les commerciaux
UPDATE users 
SET role = 'commercial' 
WHERE email IN (SELECT email FROM commercials);

-- 5. Vérifier la migration
SELECT 
  u.email,
  u.prenom,
  u.nom,
  u.role,
  u.clients_assignes,
  u.photo_url,
  u.role_entreprise,
  u.plateformes_autorisees
FROM users u
WHERE u.role = 'commercial'
ORDER BY u.nom;
