-- Update handle_new_user function to handle anonymous users (who don't have email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only insert profile for non-anonymous users (users with email)
  IF new.email IS NOT NULL AND new.email != '' THEN
    INSERT INTO public.profiles (id, email)
    VALUES (new.id, new.email);
  END IF;
  RETURN new;
END;
$$;