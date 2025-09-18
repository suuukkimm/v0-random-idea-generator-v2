-- Create tables for user-contributed content
CREATE TABLE IF NOT EXISTS public.problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'anonymous'
);

CREATE TABLE IF NOT EXISTS public.keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'anonymous'
);

CREATE TABLE IF NOT EXISTS public.metaphors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'anonymous'
);

-- Create daily inspiration table
CREATE TABLE IF NOT EXISTS public.daily_inspirations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  problem_id UUID REFERENCES public.problems(id),
  keyword_id UUID REFERENCES public.keywords(id),
  metaphor_id UUID REFERENCES public.metaphors(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial data from the original arrays
INSERT INTO public.problems (content) VALUES
  ('환경오염'),
  ('교통체증'),
  ('교육격차'),
  ('건강 불평등'),
  ('고령화 사회'),
  ('기후변화'),
  ('디지털 격차'),
  ('도시 혼잡'),
  ('에너지 고갈'),
  ('사회적 고립')
ON CONFLICT DO NOTHING;

INSERT INTO public.keywords (content) VALUES
  ('무지개'),
  ('드론'),
  ('숲'),
  ('바다'),
  ('고양이'),
  ('우주'),
  ('레트로'),
  ('빙고게임'),
  ('감정'),
  ('카페')
ON CONFLICT DO NOTHING;

INSERT INTO public.metaphors (content) VALUES
  ('보드게임'),
  ('타로 카드'),
  ('만화 캐릭터'),
  ('향수'),
  ('뮤직비디오'),
  ('텐트'),
  ('미술관'),
  ('퍼즐'),
  ('놀이공원'),
  ('운동화')
ON CONFLICT DO NOTHING;

-- Enable RLS (Row Level Security) - allowing public read access for this app
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metaphors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_inspirations ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access and anonymous insert
CREATE POLICY "Allow public read access to problems" ON public.problems FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert to problems" ON public.problems FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to keywords" ON public.keywords FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert to keywords" ON public.keywords FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to metaphors" ON public.metaphors FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert to metaphors" ON public.metaphors FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to daily inspirations" ON public.daily_inspirations FOR SELECT USING (true);
CREATE POLICY "Allow insert to daily inspirations" ON public.daily_inspirations FOR INSERT WITH CHECK (true);
