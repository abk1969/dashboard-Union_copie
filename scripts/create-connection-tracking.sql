-- Script pour créer le système de tracking des connexions
-- Ce script permet de suivre les connexions des utilisateurs et calculer les scores mensuels

-- 1. Table pour tracker les connexions quotidiennes
CREATE TABLE IF NOT EXISTS user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  connection_date DATE NOT NULL,
  connection_time TIMESTAMP DEFAULT NOW(),
  points_earned INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, connection_date) -- Une seule connexion par jour par utilisateur
);

-- 2. Table pour les scores mensuels
CREATE TABLE IF NOT EXISTS user_monthly_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  total_points INTEGER DEFAULT 0,
  connection_days INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_connection_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);

-- 3. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_user_connections_user_date ON user_connections(user_id, connection_date);
CREATE INDEX IF NOT EXISTS idx_user_connections_date ON user_connections(connection_date);
CREATE INDEX IF NOT EXISTS idx_monthly_scores_user_month ON user_monthly_scores(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_scores_month_points ON user_monthly_scores(year, month, total_points DESC);

-- 4. Fonction pour enregistrer une connexion
CREATE OR REPLACE FUNCTION record_user_connection(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  current_year INTEGER := EXTRACT(YEAR FROM today_date);
  current_month INTEGER := EXTRACT(MONTH FROM today_date);
  connection_exists BOOLEAN;
  monthly_score RECORD;
  result JSON;
BEGIN
  -- Vérifier si l'utilisateur s'est déjà connecté aujourd'hui
  SELECT EXISTS(
    SELECT 1 FROM user_connections 
    WHERE user_id = p_user_id AND connection_date = today_date
  ) INTO connection_exists;
  
  -- Si pas de connexion aujourd'hui, l'enregistrer
  IF NOT connection_exists THEN
    -- Enregistrer la connexion
    INSERT INTO user_connections (user_id, connection_date, points_earned)
    VALUES (p_user_id, today_date, 1)
    ON CONFLICT (user_id, connection_date) DO NOTHING;
    
    -- Mettre à jour ou créer le score mensuel
    INSERT INTO user_monthly_scores (user_id, year, month, total_points, connection_days, last_connection_date)
    VALUES (p_user_id, current_year, current_month, 1, 1, today_date)
    ON CONFLICT (user_id, year, month) 
    DO UPDATE SET 
      total_points = user_monthly_scores.total_points + 1,
      connection_days = user_monthly_scores.connection_days + 1,
      last_connection_date = today_date,
      updated_at = NOW();
    
    -- Récupérer le score mis à jour
    SELECT * INTO monthly_score
    FROM user_monthly_scores 
    WHERE user_id = p_user_id AND year = current_year AND month = current_month;
    
    result := json_build_object(
      'success', true,
      'message', 'Connexion enregistrée',
      'points_today', 1,
      'total_points_month', monthly_score.total_points,
      'connection_days', monthly_score.connection_days
    );
  ELSE
    result := json_build_object(
      'success', false,
      'message', 'Déjà connecté aujourd\'hui',
      'points_today', 0,
      'total_points_month', 0,
      'connection_days', 0
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 5. Fonction pour obtenir le classement mensuel
CREATE OR REPLACE FUNCTION get_monthly_ranking(p_year INTEGER, p_month INTEGER)
RETURNS TABLE (
  rank INTEGER,
  user_id UUID,
  prenom TEXT,
  nom TEXT,
  email TEXT,
  photo_url TEXT,
  total_points INTEGER,
  connection_days INTEGER,
  current_streak INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY ums.total_points DESC, ums.connection_days DESC)::INTEGER as rank,
    u.id as user_id,
    u.prenom,
    u.nom,
    u.email,
    u.photo_url,
    ums.total_points,
    ums.connection_days,
    ums.current_streak
  FROM user_monthly_scores ums
  JOIN users u ON u.id = ums.user_id
  WHERE ums.year = p_year AND ums.month = p_month
  ORDER BY ums.total_points DESC, ums.connection_days DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. Vérifier la structure des tables
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('user_connections', 'user_monthly_scores')
ORDER BY table_name, ordinal_position;
