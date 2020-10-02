-- users table exists but not able to reference
-- USER PROFILES
CREATE TYPE public.user_status AS ENUM ('ONLINE', 'OFFLINE');
CREATE TABLE public.users (
  id uuid NOT NULL PRIMARY KEY,
  -- UUID from auth.users (Supabase)
  username text,
  list_id uuid NULL,
  -- can be selected by user - current list and updated
  status user_status DEFAULT 'OFFLINE'::public.user_status
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow logged-in read access" on public.users FOR
SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow individual insert access" on public.users FOR
INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow individual update access" on public.users FOR
UPDATE USING (auth.uid() = id);
-- change to uuid primary key
CREATE TABLE lists (
  lists_id uuid PRIMARY KEY,
  list_name text NOT NULL,
  inserted_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE userlists (
  users_id uuid REFERENCES public.users NOT NULL,
  lists_id uuid REFERENCES lists NOT NULL
);
ALTER TABLE userlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
CREATE TABLE tasks (
  task_text text NOT NULL,
  complete boolean DEFAULT false,
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.users NOT NULL,
  list_id uuid REFERENCES lists NOT NULL,
  inserted_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow individual select access" on userlists FOR
SELECT USING (auth.uid() = users_id);
CREATE POLICY "Allow individual insert access" on userlists FOR
INSERT WITH CHECK (auth.uid() = users_id);
CREATE POLICY "Allow individual update access" on userlists FOR
UPDATE USING (auth.uid() = users_id);
CREATE POLICY "Allow logged-in full access" on lists FOR
SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow individual insert access" on lists FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow individual update access" on lists FOR
UPDATE USING (auth.role() = 'authenticated');
-- user should see other tasks in lists they are a member of
-- todo
-- try using count?
- - CREATE POLICY "Allow logged-in read access to shared list" on tasks FOR
SELECT USING (
    select count(user_id)
    from (
        SELECT user_id
        from userlists
        where userlists.list_id = list_id
      ) > 0
  );
-- CREATE POLICY "Allow read access to shared lists" on tasks FOR SELECT USING (SELECT user_id from userlists where userlists.lists_id=lists_id );
-- no to RS 
-- ALTER TABLE tasks SET ROW SECURITY FOR  SELECT TO (SELECT users_id from userslists where userlists.lists_id=list_id);
-- CREATE POLICY "Allow logged in user to see items on their current list" on tasks FOR SELECT USING ( select list_id from public.users where public.users.list_id=list_id AND public.users.user_id=auth.uid() )
CREATE POLICY "Allow logged in user to see items on their current list" on tasks FOR
SELECT USING (
    EXISTS(
      select 1
      from userlists
      where userlists.lists_id = tasks.list_id
        AND userlists.users_id = auth.uid()
    )
  ) -- user can update their tasks
  CREATE POLICY "Allow individual insert access" on tasks FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow individual update access" on tasks FOR
UPDATE USING (auth.uid() = user_id);