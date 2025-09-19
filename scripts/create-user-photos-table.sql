-- Création de la table pour stocker les photos de profil des utilisateurs
CREATE TABLE IF NOT EXISTS user_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_user_photos_user_id ON user_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_photos_created_at ON user_photos(created_at);

-- RLS (Row Level Security) pour la sécurité
ALTER TABLE user_photos ENABLE ROW LEVEL SECURITY;

-- Politique : les utilisateurs peuvent voir et modifier leurs propres photos
CREATE POLICY "Users can view their own photos" ON user_photos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own photos" ON user_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own photos" ON user_photos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos" ON user_photos
  FOR DELETE USING (auth.uid() = user_id);

-- Politique pour les admins : peuvent voir toutes les photos
CREATE POLICY "Admins can view all photos" ON user_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.roles @> '["direction_generale"]'::jsonb
    )
  );

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_user_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER update_user_photos_updated_at
  BEFORE UPDATE ON user_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_user_photos_updated_at();
