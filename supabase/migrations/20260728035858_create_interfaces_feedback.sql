create table interfaces_feedback (
	id bigint primary key generated always as identity,
	created_at timestamptz not null default now(),
	feedback text not null,
	source text not null,
	user_agent text,
	user_id uuid,
	project_ref text,
	metadata jsonb
);

comment on table interfaces_feedback is
'General customer feedback submitted from Supabase interfaces such as the CLI and MCP server.';
comment on column interfaces_feedback.feedback is
'The free-form feedback text as submitted by the user.';
comment on column interfaces_feedback.source is
'Interface the feedback was submitted from, e.g. cli, mcp.';
comment on column interfaces_feedback.user_agent is
'User agent of the submitting interface, e.g. supabase-cli/2.30.4 (darwin/arm64).';
comment on column interfaces_feedback.project_ref is
'Optional reference of the Supabase project the feedback relates to.';

alter table interfaces_feedback enable row level security;

create policy "Anyone can insert interfaces feedback"
on interfaces_feedback
as permissive for insert
to public
with check (true);

-- Default privileges in this project do not give API roles access to new
-- tables, so submissions need an explicit insert grant. Reads are reserved
-- for service_role, which the feedback pipeline uses.
grant insert on table interfaces_feedback to anon, authenticated;
grant select on table interfaces_feedback to service_role;
