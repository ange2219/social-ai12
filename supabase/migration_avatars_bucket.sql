-- ══════════════════════════════════════════════════════
-- Créer le bucket avatars pour les photos de profil
-- À exécuter dans Supabase → SQL Editor
-- ══════════════════════════════════════════════════════

-- 1. Créer le bucket avatars (privé, max 5MB, images seulement)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Permettre lecture publique (pour afficher les avatars partout)
DROP POLICY IF EXISTS "avatars: public read" ON storage.objects;
CREATE POLICY "avatars: public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- 3. Permettre au service role d'uploader (via API route admin)
-- Le service role bypass RLS automatiquement — aucune policy nécessaire pour INSERT/UPDATE/DELETE
-- Les policies SELECT ci-dessus suffisent pour la lecture publique
