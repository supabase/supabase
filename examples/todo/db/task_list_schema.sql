CREATE TABLE lists (
  uuid text,
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.users NOT NULL,
  inserted_at timestamp without time zone DEFAULT timezone('utc' :: text, now()) NOT NULL,
  updated_at timestamp without time zone DEFAULT timezone('utc' :: text, now()) NOT NULL
);
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow logged-in full access" on lists FOR ALL USING ( auth.role() = 'authenticated' );
CREATE TABLE tasks (
  task_text text NOT NULL,
  complete boolean DEFAULT false,
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.users NOT NULL,
  list_id bigint REFERENCES lists NOT NULL,
  inserted_at timestamp without time zone DEFAULT timezone('utc' :: text, now()) NOT NULL,
  updated_at timestamp without time zone DEFAULT timezone('utc' :: text, now()) NOT NULL
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow logged-in read access" on tasks USING ( auth.role() = 'authenticated' );
CREATE POLICY "Allow individual insert access" on tasks FOR INSERT WITH CHECK ( auth.uid() = user_id );
CREATE POLICY "Allow individual update access" on tasks FOR UPDATE USING ( auth.uid() = user_id );