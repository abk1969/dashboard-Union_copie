-- Script pour mettre à jour les données existantes avec des valeurs de famille
-- basées sur les sous-familles actuelles
-- Exécuter ce script APRÈS avoir ajouté la colonne famille

-- Mise à jour des familles basée sur les sous-familles existantes
UPDATE adherents 
SET famille = CASE 
    -- Freinage
    WHEN LOWER("sousFamille") LIKE '%frein%' OR 
         LOWER("sousFamille") LIKE '%plaquette%' OR 
         LOWER("sousFamille") LIKE '%disque%' OR
         LOWER("sousFamille") LIKE '%kit%frein%' THEN 'freinage'
    
    -- Embrayage
    WHEN LOWER("sousFamille") LIKE '%embrayage%' OR 
         LOWER("sousFamille") LIKE '%kit%embrayage%' THEN 'embrayage'
    
    -- Filtres
    WHEN LOWER("sousFamille") LIKE '%filtre%' OR 
         LOWER("sousFamille") LIKE '%air%' OR 
         LOWER("sousFamille") LIKE '%huile%' OR
         LOWER("sousFamille") LIKE '%habitacle%' THEN 'filtre'
    
    -- Distribution
    WHEN LOWER("sousFamille") LIKE '%distribution%' OR 
         LOWER("sousFamille") LIKE '%chaine%' OR 
         LOWER("sousFamille") LIKE '%tendeur%' OR
         LOWER("sousFamille") LIKE '%guide%' THEN 'distribution'
    
    -- Étanchéité moteur
    WHEN LOWER("sousFamille") LIKE '%joint%' OR 
         LOWER("sousFamille") LIKE '%culasse%' OR 
         LOWER("sousFamille") LIKE '%vilebrequin%' THEN 'etancheite moteur'
    
    -- Thermique
    WHEN LOWER("sousFamille") LIKE '%thermostat%' OR 
         LOWER("sousFamille") LIKE '%radiateur%' OR 
         LOWER("sousFamille") LIKE '%ventilateur%' THEN 'thermique'
    
    -- Injection
    WHEN LOWER("sousFamille") LIKE '%injecteur%' OR 
         LOWER("sousFamille") LIKE '%pompe%' OR 
         LOWER("sousFamille") LIKE '%injection%' THEN 'injection'
    
    -- Éclairage
    WHEN LOWER("sousFamille") LIKE '%phare%' OR 
         LOWER("sousFamille") LIKE '%feu%' OR 
         LOWER("sousFamille") LIKE '%ampoule%' THEN 'eclairage'
    
    -- Par défaut
    ELSE 'autre'
END
WHERE famille IS NULL OR famille = '';

-- Vérifier les résultats
SELECT 
    famille,
    COUNT(*) as nombre_enregistrements,
    COUNT(DISTINCT "sousFamille") as nombre_sous_familles
FROM adherents 
GROUP BY famille 
ORDER BY nombre_enregistrements DESC;

-- Vérifier s'il reste des enregistrements sans famille
SELECT COUNT(*) as enregistrements_sans_famille
FROM adherents 
WHERE famille IS NULL OR famille = '';
