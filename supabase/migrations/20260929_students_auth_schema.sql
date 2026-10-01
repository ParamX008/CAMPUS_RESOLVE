-- =========================================================
-- CAMPUS SERVICE MANAGEMENT PLATFORM - SUPABASE STUDENTS & AUTH SCHEMA
-- =========================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. STUDENTS TABLE (Authoritative Institutional Student Dataset)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE,
    student_id TEXT NOT NULL UNIQUE, -- Permanent Institutional Student ID (e.g. SKF7A2Q9)
    anonymous_reporter_id TEXT NOT NULL UNIQUE, -- Permanent Anonymous Reporter ID (format AN-XXXXXXXX)
    full_name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    phone_number TEXT NOT NULL UNIQUE, -- Canonical E.164 (+91XXXXXXXXXX)
    date_of_birth DATE NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    department TEXT NOT NULL,
    university TEXT NOT NULL,
    email TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    must_change_password BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_students_student_id ON public.students (student_id);
CREATE INDEX IF NOT EXISTS idx_students_phone_number ON public.students (phone_number);
CREATE INDEX IF NOT EXISTS idx_students_anonymous_reporter_id ON public.students (anonymous_reporter_id);
CREATE INDEX IF NOT EXISTS idx_students_auth_user_id ON public.students (auth_user_id);

-- 3. PROFILES TABLE (Unified Identity reference for Staff & Students)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE,
    account_id TEXT NOT NULL UNIQUE, -- e.g. SKF7A2Q9 (Student) or ADM1001 (Admin)
    student_id TEXT UNIQUE,
    anonymous_reporter_id TEXT UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'admin')),
    admin_role TEXT CHECK (admin_role IN ('super_admin', 'department_staff')),
    phone TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    email TEXT,
    department TEXT,
    university TEXT,
    roll_number TEXT,
    gender TEXT,
    must_change_password BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id TEXT NOT NULL UNIQUE, -- e.g. CMP-1001
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    anonymous_reporter_id TEXT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    identity_mode TEXT NOT NULL CHECK (identity_mode IN ('identified', 'anonymous')),
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Under Investigation', 'Resolved', 'Closed')),
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- AI Triage Fields
    ai_status TEXT DEFAULT 'Pending',
    ai_title TEXT,
    ai_summary TEXT,
    ai_category_detected TEXT,
    ai_priority_detected TEXT,
    ai_recommended_department TEXT,
    ai_confidence NUMERIC,
    ai_safety_flag BOOLEAN DEFAULT FALSE,
    ai_safety_type TEXT,
    ai_reasoning TEXT,
    ai_processed_at TIMESTAMP WITH TIME ZONE,
    ai_overridden BOOLEAN DEFAULT FALSE,
    
    -- Abuse & Feedback
    abuse_flag BOOLEAN DEFAULT FALSE,
    abuse_reason TEXT,
    abuse_review_status TEXT DEFAULT 'None',
    feedback_rating INT,
    feedback_comment TEXT,
    feedback_submitted_at TIMESTAMP WITH TIME ZONE,
    
    -- Super Admin Audited Unmasking
    is_unmasked BOOLEAN DEFAULT FALSE,
    unmasked_by TEXT,
    unmasked_at TIMESTAMP WITH TIME ZONE,
    unmask_reason TEXT
);

-- 6. COMPLAINT UPDATES (Audit notes & status history)
CREATE TABLE IF NOT EXISTS public.complaint_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'In Progress', 'Under Investigation', 'Resolved', 'Closed')),
    note TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    action TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL, -- Student or Staff account_id / student_id
    complaint_id TEXT NOT NULL,
    complaint_num TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Departments: Readable by all authenticated users
CREATE POLICY "Allow authenticated read departments"
    ON public.departments FOR SELECT
    TO authenticated USING (true);

-- Students: Students can only read their own profile
CREATE POLICY "Students can read their own profile"
    ON public.students FOR SELECT
    TO authenticated
    USING (
      auth.uid() = auth_user_id
      OR EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Students can update their own password change state"
    ON public.students FOR UPDATE
    TO authenticated
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

-- Complaints: Student reads own complaints, Admin reads all
CREATE POLICY "Students can view their own complaints"
    ON public.complaints FOR SELECT
    TO authenticated
    USING (
      student_id = (SELECT student_id FROM public.students WHERE auth_user_id = auth.uid())
      OR student_id = (SELECT account_id FROM public.profiles WHERE auth_user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Students can insert their own complaints"
    ON public.complaints FOR INSERT
    TO authenticated
    WITH CHECK (
      student_id = (SELECT student_id FROM public.students WHERE auth_user_id = auth.uid())
      OR student_id = (SELECT account_id FROM public.profiles WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Staff can update complaints"
    ON public.complaints FOR UPDATE
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));

-- Notifications: User sees only own notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (
      user_id = (SELECT student_id FROM public.students WHERE auth_user_id = auth.uid())
      OR user_id = (SELECT account_id FROM public.profiles WHERE auth_user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role = 'admin')
    );

-- 9. SEED THE AUTHORITATIVE STUDENTS (CSV SOURCE OF TRUTH)
INSERT INTO public.students (
    student_id,
    anonymous_reporter_id,
    full_name,
    roll_number,
    phone_number,
    date_of_birth,
    gender,
    department,
    university,
    email,
    must_change_password
) VALUES 
('SKF7A2Q9', 'AN-CQ2XADRH', 'Parambrata Kanjilal', '25300123055', '+918697633925', '2004-06-15', 'male', 'CSE', 'Supreme knowledge Foundation', NULL, true),
('SKF7A2Q6', 'AN-62KHZTPM', 'Pritam Das', '25300123060', '+918240878930', '2005-10-21', 'male', 'CSE', 'Supreme knowledge Foundation', NULL, true),
('SKF7A2Q7', 'AN-6Z79TV9L', 'Prerona Sinha Roy', '25300123059', '+919735033212', '2004-12-20', 'female', 'CSE', 'Supreme knowledge Foundation', NULL, true),
('SKF7A2Q8', 'AN-YN9R5DCW', 'Tamali Singha Roy', '25300123108', '+919432882031', '2003-01-01', 'female', 'CSE', 'Supreme knowledge Foundation', NULL, true)
ON CONFLICT (student_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    roll_number = EXCLUDED.roll_number,
    phone_number = EXCLUDED.phone_number,
    date_of_birth = EXCLUDED.date_of_birth,
    gender = EXCLUDED.gender,
    department = EXCLUDED.department,
    university = EXCLUDED.university;
