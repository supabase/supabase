-- Example Migration: RLS JWT Claims Workaround
-- This is a complete example showing how to set up RLS policies
-- using the workaround function for issue #42235

-- Step 1: Create the workaround function (if not already created)
CREATE OR REPLACE FUNCTION public.get_current_user_id_rls()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sub text;
BEGIN
  BEGIN
    v_sub := current_setting('request.jwt.claim.sub', true);
  EXCEPTION
    WHEN OTHERS THEN
      v_sub := NULL;
  END;

  IF v_sub IS NOT NULL AND v_sub != '' THEN
    RETURN v_sub::uuid;
  END IF;

  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_id_rls() TO authenticated, anon;

-- Step 2: Create example table
CREATE TABLE IF NOT EXISTS public.user_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Step 3: Enable RLS
ALTER TABLE public.user_posts ENABLE ROW LEVEL SECURITY;

-- Step 4: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_posts TO authenticated;
GRANT SELECT ON public.user_posts TO anon;

-- Step 5: Create RLS policies using workaround function

-- SELECT policy: Users can view their own posts
CREATE POLICY "Users can view own posts"
ON public.user_posts
FOR SELECT
TO authenticated
USING (user_id = public.get_current_user_id_rls());

-- Allow anonymous users to view all posts (optional)
CREATE POLICY "Anyone can view posts"
ON public.user_posts
FOR SELECT
TO anon
USING (true);

-- INSERT policy: Users can create their own posts
CREATE POLICY "Users can create own posts"
ON public.user_posts
FOR INSERT
TO authenticated
WITH CHECK (user_id = public.get_current_user_id_rls());

-- UPDATE policy: Users can update their own posts
CREATE POLICY "Users can update own posts"
ON public.user_posts
FOR UPDATE
TO authenticated
USING (user_id = public.get_current_user_id_rls())
WITH CHECK (user_id = public.get_current_user_id_rls());

-- DELETE policy: Users can delete their own posts
CREATE POLICY "Users can delete own posts"
ON public.user_posts
FOR DELETE
TO authenticated
USING (user_id = public.get_current_user_id_rls());

-- Step 6: Create updated_at trigger (optional)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_posts_updated_at
  BEFORE UPDATE ON public.user_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
