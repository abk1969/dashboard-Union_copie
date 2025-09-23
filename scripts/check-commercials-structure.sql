-- Vérifier la structure de la table commercials
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'commercials' 
ORDER BY ordinal_position;

-- Vérifier les données existantes
SELECT * FROM commercials LIMIT 3;
