-- Ajouter le champ auteur à la table todo_tasks s'il n'existe pas
ALTER TABLE todo_tasks 
ADD COLUMN IF NOT EXISTS auteur TEXT DEFAULT 'Commercial';

-- Mettre à jour les tâches existantes sans auteur
UPDATE todo_tasks 
SET auteur = 'Commercial' 
WHERE auteur IS NULL OR auteur = '';

-- Vérifier le résultat
SELECT 
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN auteur IS NOT NULL AND auteur != '' THEN 1 END) as tasks_with_auteur,
  COUNT(CASE WHEN auteur IS NULL OR auteur = '' THEN 1 END) as tasks_without_auteur
FROM todo_tasks;

-- Afficher quelques exemples
SELECT id, title, auteur, type_note, created_at 
FROM todo_tasks 
ORDER BY created_at DESC 
LIMIT 10;
