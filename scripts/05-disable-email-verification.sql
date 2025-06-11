-- Disable email confirmation requirement in auth.config
UPDATE auth.config 
SET email_confirm_required = false 
WHERE id = 1;

-- If the above doesn't work, try this alternative approach
ALTER TABLE auth.users 
ALTER COLUMN email_confirmed_at 
SET DEFAULT now();

-- Make sure new users are automatically confirmed
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Auto-confirm email for new users
  UPDATE auth.users 
  SET email_confirmed_at = now() 
  WHERE id = new.id AND email_confirmed_at IS NULL;
  
  -- Create user profile
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger is properly set
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
