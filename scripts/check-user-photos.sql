-- Script pour vérifier les photos des utilisateurs
-- Ce script permet de voir quels utilisateurs ont des photos et lesquelles

-- 1. Vérifier la structure de la table users
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('id', 'prenom', 'nom', 'email', 'photo_url')
ORDER BY ordinal_position;

-- 2. Vérifier les utilisateurs avec photos
SELECT 
  id,
  prenom,
  nom,
  email,
  photo_url,
  CASE 
    WHEN photo_url IS NOT NULL THEN 'Avec photo'
    ELSE 'Sans photo'
  END as statut_photo
FROM users 
ORDER BY prenom, nom;

-- 3. Compter les utilisateurs avec et sans photos
SELECT 
  COUNT(*) as total_utilisateurs,
  COUNT(photo_url) as avec_photo,
  COUNT(*) - COUNT(photo_url) as sans_photo
FROM users;

-- 4. Vérifier les connexions récentes avec photos
SELECT 
  udc.user_id,
  udc.user_type,
  udc.user_name,
  udc.user_photo,
  udc.connection_date,
  udc.points_earned
FROM user_daily_connections udc
WHERE udc.connection_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY udc.connection_date DESC, udc.points_earned DESC;

-- 5. Tester la génération d'URL pour une photo (remplacer par un ID réel)
-- SELECT 
--   id,
--   prenom,
--   nom,
--   photo_url,
--   CASE 
--     WHEN photo_url IS NOT NULL THEN 
--       'https://ybzajzcwxcgoxtqsimol.supabase.co/storage/v1/object/public/user-photos/' || photo_url
--     ELSE NULL
--   END as photo_url_complete
-- FROM users 
-- WHERE photo_url IS NOT NULL
-- LIMIT 5;
