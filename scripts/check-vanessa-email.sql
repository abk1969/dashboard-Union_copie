-- Vérifier l'email exact de Vanessa dans la base de données
SELECT id, prenom, nom, email, LOWER(email) as email_lower, UPPER(email) as email_upper
FROM users 
WHERE LOWER(email) LIKE '%vanessa%' 
   OR LOWER(prenom) LIKE '%vanessa%'
   OR LOWER(nom) LIKE '%vanessa%';

-- Lister tous les utilisateurs pour voir la structure
SELECT id, prenom, nom, email 
FROM users 
ORDER BY email;

-- Vérifier s'il y a des photos pour Vanessa
SELECT u.id, u.prenom, u.nom, u.email, p.file_path
FROM users u
LEFT JOIN user_photos p ON u.id = p.user_id
WHERE LOWER(u.email) LIKE '%vanessa%' 
   OR LOWER(u.prenom) LIKE '%vanessa%';
