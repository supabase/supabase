-- 0002_enable_pgcrypto_create_group_plan_folders.sql
-- Ensure pgcrypto extension exists for gen_random_uuid() and create table.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS group_plan_folders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  user_id uuid NOT NULL REFERENCES profiles(id) DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT current_timestamp,
  updated_at timestamptz DEFAULT current_timestamp
);
