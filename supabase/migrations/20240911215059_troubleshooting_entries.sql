create table troubleshooting_entries (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    topics text[] not null,
    keywords text[],
    api jsonb,
    errors jsonb[],
    github_url text not null,
    date_created timestamptz not null default now(),
    date_updated timestamptz not null default now()
);

alter table troubleshooting_entries enable row level security;

create or replace function update_troubleshooting_entry_date_updated() returns trigger as $$
begin
    new.date_updated = now();
    return new;
end;
$$ language plpgsql;

create trigger update_troubleshooting_entry_date_updated_trigger before update on troubleshooting_entries for each row
execute function update_troubleshooting_entry_date_updated();