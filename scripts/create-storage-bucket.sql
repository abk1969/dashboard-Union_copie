-- Création du bucket de stockage pour les photos de profil
-- À exécuter dans l'éditeur SQL de Supabase

-- Créer le bucket (à faire via l'interface Supabase ou l'API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('user-photos', 'user-photos', true);

-- Politique RLS pour le bucket user-photos
-- Les utilisateurs peuvent uploader leurs propres photos
CREATE POLICY "Users can upload their own photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Les utilisateurs peuvent voir leurs propres photos
CREATE POLICY "Users can view their own photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Les utilisateurs peuvent supprimer leurs propres photos
CREATE POLICY "Users can delete their own photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Les utilisateurs peuvent mettre à jour leurs propres photos
CREATE POLICY "Users can update their own photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Les admins peuvent voir toutes les photos
CREATE POLICY "Admins can view all photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-photos' 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.roles @> '["direction_generale"]'::jsonb
    )
  );
