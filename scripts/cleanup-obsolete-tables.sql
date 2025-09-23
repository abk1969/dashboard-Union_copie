-- Nettoyage des tables obsolètes
-- ATTENTION: Exécuter seulement APRÈS avoir vérifié que la migration fonctionne !

-- 1. Vérifier que toutes les données ont été migrées
SELECT 'commercials' as table_name, COUNT(*) as count FROM commercials
UNION ALL
SELECT 'user_photos' as table_name, COUNT(*) as count FROM user_photos
UNION ALL
SELECT 'users_commercials' as table_name, COUNT(*) as count FROM users WHERE role = 'commercial';

-- 2. Supprimer les tables obsolètes (DÉCOMMENTER SEULEMENT SI TOUT FONCTIONNE)
-- DROP TABLE IF EXISTS commercials;
-- DROP TABLE IF EXISTS user_photos;

-- 3. Vérifier la structure finale
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
