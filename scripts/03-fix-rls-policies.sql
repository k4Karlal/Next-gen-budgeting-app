-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create more permissive policies for user management
CREATE POLICY "Enable insert for authentication" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to read categories
CREATE POLICY "Enable read access for authenticated users" ON categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create a function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Disable email confirmation requirement
UPDATE auth.config 
SET email_confirm = false 
WHERE id = 1;

-- Alternative: Update the auth settings directly
INSERT INTO auth.config (email_confirm, email_confirm_change, email_change_confirm)
VALUES (false, false, false)
ON CONFLICT (id) DO UPDATE SET
  email_confirm = false,
  email_confirm_change = false,
  email_change_confirm = false;
