-- This is an emergency fix to completely disable RLS on the users table
-- Run this script immediately to fix the recursion issue

-- First, try to disable RLS on the users table
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

-- If that doesn't work, drop all policies on the users table
DO $$
BEGIN
  -- Drop all policies on users table
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || r.policyname || ' ON users';
  END LOOP;
END $$;

-- Grant all permissions to bypass RLS
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;
GRANT ALL ON users TO service_role;

-- Make sure all users have confirmed emails
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email_confirmed_at IS NULL;
