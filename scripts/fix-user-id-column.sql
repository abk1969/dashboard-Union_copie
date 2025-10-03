-- Script pour modifier la colonne user_id pour accepter les IDs locaux
-- Cette modification permet d'utiliser des UUID pour les utilisateurs connectés
-- et des IDs locaux (texte) pour les utilisateurs non connectés

-- 1. Modifier le type de la colonne user_id de UUID vers TEXT
ALTER TABLE user_daily_connections 
ALTER COLUMN user_id TYPE TEXT;

-- 2. Vérifier que la modification a bien été appliquée
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_daily_connections'
  AND column_name = 'user_id';

-- 3. Tester l'insertion d'un ID local (optionnel)
-- INSERT INTO user_daily_connections (user_id, user_type, user_name, connection_date, year, month, day, points_earned)
-- VALUES ('local-test-123', 'local', 'Test User', CURRENT_DATE, 2025, 1, 29, 1);

-- 4. Vérifier la structure finale de la table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_daily_connections'
ORDER BY ordinal_position;
