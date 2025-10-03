-- Script pour créer un utilisateur de test pour le système de scoring
-- Ce script crée un utilisateur fictif pour tester le système sans authentification

-- 1. Créer un utilisateur de test dans la table users
INSERT INTO users (
  id,
  prenom,
  nom,
  email,
  role,
  actif,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Utilisateur',
  'Test',
  'test@union-groupement.com',
  'admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Vérifier que l'utilisateur a été créé
SELECT 
  id,
  prenom,
  nom,
  email,
  role,
  actif
FROM users 
WHERE id = '00000000-0000-0000-0000-000000000000';
