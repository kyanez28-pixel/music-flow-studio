
-- Rhythm folders
CREATE TABLE public.rhythm_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text DEFAULT '#d4a843',
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rhythm_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access rhythm_folders" ON public.rhythm_folders FOR ALL TO public USING (true) WITH CHECK (true);

-- Rhythms
CREATE TABLE public.rhythms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid REFERENCES public.rhythm_folders(id) ON DELETE SET NULL,
  name text NOT NULL,
  instrument text NOT NULL DEFAULT 'piano',
  status text NOT NULL DEFAULT 'aprendiendo',
  bpm integer DEFAULT 0,
  key text DEFAULT '',
  time_signature text DEFAULT '4/4',
  description text DEFAULT '',
  progress integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rhythms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access rhythms" ON public.rhythms FOR ALL TO public USING (true) WITH CHECK (true);

CREATE TRIGGER update_rhythms_updated_at
  BEFORE UPDATE ON public.rhythms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Rhythm images
CREATE TABLE public.rhythm_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rhythm_id uuid NOT NULL REFERENCES public.rhythms(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rhythm_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access rhythm_images" ON public.rhythm_images FOR ALL TO public USING (true) WITH CHECK (true);

-- Rhythm practice logs
CREATE TABLE public.rhythm_practice_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rhythm_id uuid NOT NULL REFERENCES public.rhythms(id) ON DELETE CASCADE,
  date text NOT NULL,
  instrument text NOT NULL DEFAULT 'piano',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rhythm_practice_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access rhythm_practice_logs" ON public.rhythm_practice_logs FOR ALL TO public USING (true) WITH CHECK (true);

-- Storage bucket for rhythm images
INSERT INTO storage.buckets (id, name, public) VALUES ('rhythm-images', 'rhythm-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read rhythm-images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'rhythm-images');
CREATE POLICY "Public insert rhythm-images" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'rhythm-images');
CREATE POLICY "Public delete rhythm-images" ON storage.objects FOR DELETE TO public USING (bucket_id = 'rhythm-images');
