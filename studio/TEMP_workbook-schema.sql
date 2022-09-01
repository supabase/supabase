create schema supabase_workbook;

create table supabase_workbook.workbooks (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  title text 
);

create table supabase_workbook.blocks (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  workbook_id uuid not null references supabase_workbook.workbooks(id) on delete cascade on update cascade,
  body text not null default ''
);

create index on supabase_workbook.blocks (workbook_id);
