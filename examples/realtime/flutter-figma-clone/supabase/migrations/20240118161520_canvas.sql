create table canvas_objects (
    id uuid primary key default gen_random_uuid() not null,
    "object" jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

