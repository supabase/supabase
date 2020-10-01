-- users table exists but not able to reference

-- USER PROFILES
CREATE TYPE public.user_status AS ENUM ('ONLINE', 'OFFLINE');
CREATE TABLE public.users (
  id uuid NOT NULL PRIMARY KEY, -- UUID from auth.users (Supabase)
  username text,
  status user_status DEFAULT 'OFFLINE'::public.user_status
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow logged-in read access" on public.users FOR SELECT USING ( auth.role() = 'authenticated' );
CREATE POLICY "Allow individual insert access" on public.users FOR INSERT WITH CHECK ( auth.uid() = id );
CREATE POLICY "Allow individual update access" on public.users FOR UPDATE USING ( auth.uid() = id );


-- change to uuid primary key

CREATE TABLE lists (
  uuid text PRIMARY KEY,
  list_name text NOT NULL,
  inserted_at timestamp without time zone DEFAULT timezone('utc' :: text, now()) NOT NULL,
  updated_at timestamp without time zone DEFAULT timezone('utc' :: text, now()) NOT NULL
);

CREATE TABLE userlists (
  userid uuid REFERENCES public.users NOT NULL,
  listid uuid REFERENCES lists NOT NULL
);
ALTER TABLE userlists ENABLE ROW LEVEL SECURITY;

ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
CREATE TABLE tasks (
  task_text text NOT NULL,
  complete boolean DEFAULT false,
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.users NOT NULL,
  list_id uuid REFERENCES lists NOT NULL,
  inserted_at timestamp without time zone DEFAULT timezone('utc' :: text, now()) NOT NULL,
  updated_at timestamp without time zone DEFAULT timezone('utc' :: text, now()) NOT NULL
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual select access" on userlists FOR SELECT WITH CHECK ( auth.uid() = user_id );
CREATE POLICY "Allow individual insert access" on userlists FOR INSERT WITH CHECK ( auth.uid() = user_id );
CREATE POLICY "Allow individual update access" on userlists FOR UPDATE USING ( auth.uid() = user_id );

CREATE POLICY "Allow logged-in full access" on lists FOR ALL USING ( auth.role() = 'authenticated' );

-- user should see other tasks in lists they are a member of
-- todo
-- try using count?
CREATE POLICY "Allow logged-in read access" on tasks FOR SELECT USING  ( select count(user_id) from (SELECT user_id from userlists where userlists.listid=list_id ) > 0);
-- user can update their tasks
CREATE POLICY "Allow individual insert access" on tasks FOR INSERT WITH CHECK ( auth.uid() = user_id );
CREATE POLICY "Allow individual update access" on tasks FOR UPDATE USING ( auth.uid() = user_id );