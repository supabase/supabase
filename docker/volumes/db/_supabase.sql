\set pguser `echo "$POSTGRES_USER"`

-- Create postgres database if it doesn't exist
SELECT 'CREATE DATABASE postgres WITH OWNER ' || :'pguser'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'postgres')\gexec

-- Create _supabase database
CREATE DATABASE _supabase WITH OWNER :pguser;
