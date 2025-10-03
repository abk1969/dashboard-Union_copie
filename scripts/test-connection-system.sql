-- Script de test pour vérifier le système de connexion unifié
-- Ce script teste les fonctions RPC et l'insertion de données

-- 1. Vérifier que la table existe et a la bonne structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_daily_connections'
ORDER BY ordinal_position;

-- 2. Tester l'insertion directe d'un utilisateur local
INSERT INTO user_daily_connections (
  user_id, 
  user_type, 
  user_name, 
  user_photo, 
  connection_date, 
  year, 
  month, 
  day, 
  points_earned
) VALUES (
  'local-test-123', 
  'local', 
  'Test User Local', 
  null, 
  CURRENT_DATE, 
  EXTRACT(YEAR FROM CURRENT_DATE), 
  EXTRACT(MONTH FROM CURRENT_DATE), 
  EXTRACT(DAY FROM CURRENT_DATE), 
  1
);

-- 3. Vérifier l'insertion
SELECT * FROM user_daily_connections WHERE user_id = 'local-test-123';

-- 4. Tester l'insertion d'un utilisateur connecté (simulation)
INSERT INTO user_daily_connections (
  user_id, 
  user_type, 
  user_name, 
  user_photo, 
  connection_date, 
  year, 
  month, 
  day, 
  points_earned
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000', 
  'connected', 
  'Test User Connected', 
  'https://example.com/photo.jpg', 
  CURRENT_DATE, 
  EXTRACT(YEAR FROM CURRENT_DATE), 
  EXTRACT(MONTH FROM CURRENT_DATE), 
  EXTRACT(DAY FROM CURRENT_DATE), 
  1
);

-- 5. Vérifier les deux insertions
SELECT 
  user_id,
  user_type,
  user_name,
  connection_date,
  points_earned
FROM user_daily_connections 
ORDER BY created_at DESC
LIMIT 5;

-- 6. Nettoyer les données de test
DELETE FROM user_daily_connections WHERE user_id IN ('local-test-123', '550e8400-e29b-41d4-a716-446655440000');
