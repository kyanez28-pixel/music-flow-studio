
-- Melody folders (user-created categories)
CREATE TABLE public.melody_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#d4a843',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.melody_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access melody_folders" ON public.melody_folders FOR ALL USING (true) WITH CHECK (true);

-- Melodies table
CREATE TABLE public.melodies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id UUID REFERENCES public.melody_folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  instrument TEXT NOT NULL DEFAULT 'piano' CHECK (instrument IN ('piano', 'guitarra', 'ambos')),
  status TEXT NOT NULL DEFAULT 'aprendiendo' CHECK (status IN ('aprendiendo', 'practicando', 'dominada')),
  bpm INT DEFAULT 0,
  key TEXT DEFAULT '',
  time_signature TEXT DEFAULT '4/4',
  description TEXT DEFAULT '',
  progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.melodies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access melodies" ON public.melodies FOR ALL USING (true) WITH CHECK (true);

-- Melody images
CREATE TABLE public.melody_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  melody_id UUID NOT NULL REFERENCES public.melodies(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.melody_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access melody_images" ON public.melody_images FOR ALL USING (true) WITH CHECK (true);

-- Melody practice logs
CREATE TABLE public.melody_practice_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  melody_id UUID NOT NULL REFERENCES public.melodies(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  instrument TEXT NOT NULL DEFAULT 'piano' CHECK (instrument IN ('piano', 'guitarra')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (melody_id, date, instrument)
);

ALTER TABLE public.melody_practice_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access melody_practice_logs" ON public.melody_practice_logs FOR ALL USING (true) WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_melodies_updated_at
  BEFORE UPDATE ON public.melodies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for melody images
INSERT INTO storage.buckets (id, name, public) VALUES ('melody-images', 'melody-images', true);

CREATE POLICY "Public read melody images" ON storage.objects FOR SELECT USING (bucket_id = 'melody-images');
CREATE POLICY "Public upload melody images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'melody-images');
CREATE POLICY "Public update melody images" ON storage.objects FOR UPDATE USING (bucket_id = 'melody-images');
CREATE POLICY "Public delete melody images" ON storage.objects FOR DELETE USING (bucket_id = 'melody-images');
