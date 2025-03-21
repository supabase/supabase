-- Create the todos table with channel column to group todos by instance
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  channel TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable row level security
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_todos_updated_at
BEFORE UPDATE ON public.todos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create a function that broadcasts todo changes
CREATE OR REPLACE FUNCTION broadcast_todo_changes()
RETURNS TRIGGER AS $$
DECLARE
    channel_name TEXT;
    payload JSONB;
    action TEXT;
BEGIN
    -- Set the channel name to 'todos:{channel}'
    channel_name := 'todos:' || COALESCE(NEW.channel, OLD.channel);
    
    -- Determine action type
    IF (TG_OP = 'INSERT') THEN
        action := 'insert';
        payload := jsonb_build_object(
            'action', action,
            'todo', row_to_json(NEW)
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        action := 'update';
        payload := jsonb_build_object(
            'action', action,
            'todo', row_to_json(NEW)
        );
    ELSIF (TG_OP = 'DELETE') THEN
        action := 'delete';
        payload := jsonb_build_object(
            'action', action,
            'todo', row_to_json(OLD)
        );
    END IF;
    
    -- Broadcast the payload to the specific channel
    PERFORM pg_notify(
        'supabase_realtime',
        json_build_object(
            'type', 'broadcast',
            'instance', channel_name,
            'event', 'todo_updated',
            'payload', payload
        )::text
    );
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to invoke the broadcast function
CREATE TRIGGER broadcast_todo_insert
AFTER INSERT ON public.todos
FOR EACH ROW
EXECUTE FUNCTION broadcast_todo_changes();

CREATE TRIGGER broadcast_todo_update
AFTER UPDATE ON public.todos
FOR EACH ROW
EXECUTE FUNCTION broadcast_todo_changes();

CREATE TRIGGER broadcast_todo_delete
AFTER DELETE ON public.todos
FOR EACH ROW
EXECUTE FUNCTION broadcast_todo_changes();

-- Set up RLS policies:
-- Allow authenticated users to select todos
CREATE POLICY "Allow users to view todos by channel" ON public.todos
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own todos
CREATE POLICY "Allow users to insert their own todos" ON public.todos
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Allow authenticated users to update their own todos
CREATE POLICY "Allow users to update their own todos" ON public.todos
  FOR UPDATE
  USING (auth.uid() = created_by);

-- Allow authenticated users to delete their own todos
CREATE POLICY "Allow users to delete their own todos" ON public.todos
  FOR DELETE
  USING (auth.uid() = created_by);

-- Enable realtime subscriptions on the todos table
ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;

-- Create an index on the channel column for faster queries
CREATE INDEX idx_todos_channel ON public.todos (channel);

-- Add comment on the todos table
COMMENT ON TABLE public.todos IS 'Stores todos with channel identifiers for realtime collaboration'; 