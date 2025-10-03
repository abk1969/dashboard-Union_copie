-- Script pour modifier la table user_daily_connections pour supporter les utilisateurs locaux
-- Cette approche utilise une seule table avec un champ user_type

-- 1. Ajouter les colonnes nécessaires à la table existante
ALTER TABLE user_daily_connections 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'connected' CHECK (user_type IN ('connected', 'local')),
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS user_photo TEXT;

-- 2. Mettre à jour les enregistrements existants
UPDATE user_daily_connections 
SET user_type = 'connected'
WHERE user_type IS NULL;

-- 3. Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_user_daily_connections_user_type ON user_daily_connections(user_type);
CREATE INDEX IF NOT EXISTS idx_user_daily_connections_user_id_type ON user_daily_connections(user_id, user_type);

-- 4. Modifier la contrainte de clé étrangère pour permettre les IDs locaux
-- D'abord, supprimer la contrainte existante
ALTER TABLE user_daily_connections DROP CONSTRAINT IF EXISTS user_daily_connections_user_id_fkey;

-- 5. Fonction pour enregistrer une connexion (utilisateurs connectés et locaux)
CREATE OR REPLACE FUNCTION record_user_connection_unified(
  p_user_id TEXT,
  p_user_type TEXT DEFAULT 'connected',
  p_user_name TEXT DEFAULT NULL,
  p_user_photo TEXT DEFAULT NULL,
  p_connection_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
  v_year INTEGER;
  v_month INTEGER;
  v_day INTEGER;
  v_existing_id UUID;
  v_result JSON;
BEGIN
  -- Extraire les composants de la date
  v_year := EXTRACT(YEAR FROM p_connection_date);
  v_month := EXTRACT(MONTH FROM p_connection_date);
  v_day := EXTRACT(DAY FROM p_connection_date);
  
  -- Vérifier si déjà connecté aujourd'hui
  SELECT id INTO v_existing_id
  FROM user_daily_connections
  WHERE user_id = p_user_id
    AND user_type = p_user_type
    AND connection_date = p_connection_date;
  
  IF v_existing_id IS NOT NULL THEN
    -- Déjà connecté aujourd'hui
    v_result := json_build_object(
      'success', false,
      'message', 'Déjà connecté aujourd''hui',
      'points_today', 0,
      'total_points_month', 0,
      'connection_days', 0
    );
  ELSE
    -- Enregistrer la connexion
    INSERT INTO user_daily_connections (
      user_id, user_type, user_name, user_photo, connection_date, 
      year, month, day, points_earned
    ) VALUES (
      p_user_id, p_user_type, p_user_name, p_user_photo, p_connection_date,
      v_year, v_month, v_day, 1
    );
    
    -- Calculer le score mensuel
    SELECT json_build_object(
      'success', true,
      'message', 'Connexion enregistrée',
      'points_today', 1,
      'total_points_month', COALESCE((
        SELECT SUM(points_earned)
        FROM user_daily_connections
        WHERE user_id = p_user_id
          AND user_type = p_user_type
          AND year = v_year
          AND month = v_month
      ), 0),
      'connection_days', COALESCE((
        SELECT COUNT(*)
        FROM user_daily_connections
        WHERE user_id = p_user_id
          AND user_type = p_user_type
          AND year = v_year
          AND month = v_month
      ), 0)
    ) INTO v_result;
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 6. Fonction pour obtenir le score mensuel d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_monthly_score_unified(
  p_user_id TEXT,
  p_user_type TEXT DEFAULT 'connected',
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  p_month INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_points', COALESCE(SUM(points_earned), 0),
    'connection_days', COUNT(*),
    'current_streak', COUNT(*)
  ) INTO v_result
  FROM user_daily_connections
  WHERE user_id = p_user_id
    AND user_type = p_user_type
    AND year = p_year
    AND month = p_month;
  
  RETURN COALESCE(v_result, json_build_object(
    'total_points', 0,
    'connection_days', 0,
    'current_streak', 0
  ));
END;
$$ LANGUAGE plpgsql;

-- 7. Fonction pour obtenir le classement mensuel unifié
CREATE OR REPLACE FUNCTION get_monthly_ranking_unified(
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  p_month INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)
)
RETURNS TABLE (
  rank INTEGER,
  user_id TEXT,
  user_name TEXT,
  user_photo TEXT,
  total_points BIGINT,
  connection_days BIGINT,
  current_streak BIGINT,
  user_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_scores AS (
    SELECT 
      udc.user_id,
      COALESCE(udc.user_name, u.prenom || ' ' || u.nom, u.email, 'Utilisateur Inconnu') as user_name,
      COALESCE(udc.user_photo, u.photo_url) as user_photo,
      SUM(udc.points_earned) as total_points,
      COUNT(*) as connection_days,
      COUNT(*) as current_streak,
      udc.user_type
    FROM user_daily_connections udc
    LEFT JOIN users u ON (udc.user_id = u.id AND udc.user_type = 'connected')
    WHERE udc.year = p_year AND udc.month = p_month
    GROUP BY udc.user_id, udc.user_name, udc.user_photo, u.prenom, u.nom, u.email, u.photo_url, udc.user_type
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY us.total_points DESC, us.connection_days DESC)::INTEGER as rank,
    us.user_id,
    us.user_name,
    us.user_photo,
    us.total_points,
    us.connection_days,
    us.current_streak,
    us.user_type
  FROM user_scores us
  ORDER BY us.total_points DESC, us.connection_days DESC;
END;
$$ LANGUAGE plpgsql;

-- 8. Vérifier la structure de la table modifiée
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_daily_connections'
ORDER BY ordinal_position;

-- 9. Afficher quelques exemples de données
SELECT 
  user_id,
  user_type,
  user_name,
  connection_date,
  points_earned
FROM user_daily_connections 
ORDER BY connection_date DESC
LIMIT 10;
