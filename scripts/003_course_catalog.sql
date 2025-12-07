-- Create course catalog table (global courses)
CREATE TABLE IF NOT EXISTS course_catalog (
                                              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    credits INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

-- Create custom course catalog table (user-specific courses)
CREATE TABLE IF NOT EXISTS custom_course_catalog (
                                                     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    credits INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, code)
    );

-- Enable RLS
ALTER TABLE course_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_course_catalog ENABLE ROW LEVEL SECURITY;

-- Everyone can read global catalog
CREATE POLICY "Anyone can read global catalog"
  ON course_catalog FOR SELECT
                                   TO authenticated
                                   USING (true);

-- Users can manage their own custom catalog
CREATE POLICY "Users can read own custom catalog"
  ON custom_course_catalog FOR SELECT
                                          TO authenticated
                                          USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom catalog"
  ON custom_course_catalog FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom catalog"
  ON custom_course_catalog FOR UPDATE
                                                 TO authenticated
                                                 USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom catalog"
  ON custom_course_catalog FOR DELETE
TO authenticated
  USING (auth.uid() = user_id);
