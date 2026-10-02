-- adds deleted_at column to auth.users 

alter table {{ index .Options "Namespace" }}.users 
add column if not exists deleted_at timestamptz null;
