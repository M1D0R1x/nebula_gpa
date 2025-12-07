-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create semesters table
CREATE TABLE IF NOT EXISTS semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  index INT NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  credits NUMERIC NOT NULL CHECK (credits > 0),
  grade TEXT NOT NULL CHECK (grade IN ('O', 'A+', 'A', 'B+', 'B', 'C', 'D', 'E', 'F', 'R', 'I')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE USING (auth.uid() = id);

-- Semesters RLS policies
CREATE POLICY "semesters_select_own" ON semesters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "semesters_insert_own" ON semesters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "semesters_update_own" ON semesters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "semesters_delete_own" ON semesters FOR DELETE USING (auth.uid() = user_id);

-- Courses RLS policies (via semester ownership)
CREATE POLICY "courses_select_own" ON courses FOR SELECT 
  USING (EXISTS (SELECT 1 FROM semesters WHERE semesters.id = courses.semester_id AND semesters.user_id = auth.uid()));
CREATE POLICY "courses_insert_own" ON courses FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM semesters WHERE semesters.id = courses.semester_id AND semesters.user_id = auth.uid()));
CREATE POLICY "courses_update_own" ON courses FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM semesters WHERE semesters.id = courses.semester_id AND semesters.user_id = auth.uid()));
CREATE POLICY "courses_delete_own" ON courses FOR DELETE 
  USING (EXISTS (SELECT 1 FROM semesters WHERE semesters.id = courses.semester_id AND semesters.user_id = auth.uid()));
