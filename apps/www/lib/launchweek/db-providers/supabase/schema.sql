create table users (
  id text primary key,
  email text unique,
  "ticketNumber" bigserial,
  name text,
  username text unique,
  "createdAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

create table github_users (
  id uuid primary key default uuid_generate_v4(),
  "createdAt" timestamp with time zone default timezone('utc'::text, now()) not null,
  "userData" jsonb
);