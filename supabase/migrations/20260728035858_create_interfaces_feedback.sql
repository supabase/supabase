create table interfaces_feedback (
	id bigint primary key generated always as identity,
	created_at timestamptz not null default now(),
	feedback text not null check (char_length(feedback) <= 1000),
	user_agent text check (char_length(user_agent) <= 255),
	user_id uuid,
	project_ref text check (char_length(project_ref) <= 255),
	metadata jsonb check (pg_column_size(metadata) <= 8192)
);

comment on table interfaces_feedback is
'General customer feedback submitted from Supabase interfaces such as the CLI and MCP server.';
comment on column interfaces_feedback.feedback is
'The free-form feedback text as submitted by the user.';
comment on column interfaces_feedback.user_agent is
'User agent of the submitting interface, e.g. SupabaseCLI/2.3.4. Also identifies which interface the feedback came from.';
comment on column interfaces_feedback.project_ref is
'Optional reference of the Supabase project the feedback relates to.';

alter table interfaces_feedback enable row level security;

create policy "Anyone can insert interfaces feedback"
on interfaces_feedback
as permissive for insert
to anon
with check (true);

-- Default privileges in this project do not give API roles access to new
-- tables, so submissions need an explicit insert grant. Clients submit with
-- the publishable key (anon role) only. No API role can read this table;
-- like the other feedback tables, it is read via direct database access.
grant insert on table interfaces_feedback to anon;
