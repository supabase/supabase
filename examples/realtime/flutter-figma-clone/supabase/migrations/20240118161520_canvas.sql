create table canvas_objects (
    id uuid primary key default gen_random_uuid() not null,
    "object" jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table canvas_objects enable row level security;
create policy select_canvas_objects on canvas_objects as permissive for select to anon using (true);
create policy insert_canvas_objects on canvas_objects as permissive for insert to anon with check (true);
create policy update_canvas_objects on canvas_objects as permissive for update to anon using (true);