-- Script pour ajouter la colonne 'famille' à la table adherents
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- Ajouter la colonne famille à la table adherents
ALTER TABLE adherents 
ADD COLUMN famille VARCHAR(255);

-- Ajouter un commentaire pour expliquer la colonne
COMMENT ON COLUMN adherents.famille IS 'Famille de produits (freinage, embrayage, filtre, etc.)';

-- Optionnel : Créer un index sur la colonne famille pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_adherents_famille ON adherents(famille);

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'adherents' 
AND column_name = 'famille';
