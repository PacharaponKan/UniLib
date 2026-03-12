-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create books table
CREATE TABLE IF NOT EXISTS public.books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Available', 'Borrowed', 'Reserved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  reserved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Active', 'Completed', 'Cancelled')),
  UNIQUE(user_id, book_id, status)
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow anon read access for this demo)
CREATE POLICY "Allow public read access on books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Allow public read access on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert on profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access on reservations" ON public.reservations FOR SELECT USING (true);
CREATE POLICY "Allow public insert on reservations" ON public.reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on books" ON public.books FOR UPDATE USING (true);

-- Insert Mock Data
INSERT INTO public.books (title, author, isbn, category, status) VALUES
  ('Introduction to Algorithms', 'Thomas H. Cormen', '9780262033848', 'Computer Science', 'Available'),
  ('Clean Code', 'Robert C. Martin', '9780132350884', 'Software Engineering', 'Available'),
  ('The Pragmatic Programmer', 'Andrew Hunt', '9780201616224', 'Software Engineering', 'Borrowed'),
  ('Design Patterns', 'Erich Gamma', '9780201633610', 'Software Engineering', 'Available'),
  ('Artificial Intelligence: A Modern Approach', 'Stuart Russell', '9780136042594', 'Computer Science', 'Available')
ON CONFLICT (isbn) DO NOTHING;
