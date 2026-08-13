create table interfaces_feedback (
	id bigint primary key generated always as identity,
	created_at timestamptz not null default now(),
	feedback text not null check (char_length(feedback) <= 1000),
	delete_token uuid unique not null default gen_random_uuid(),
	user_agent text check (char_length(user_agent) <= 255),
	user_id uuid,
	project_ref text check (char_length(project_ref) <= 255),
	metadata jsonb check (pg_column_size(metadata) <= 8192)
);

comment on table interfaces_feedback is
'General customer feedback submitted from Supabase interfaces such as the CLI and MCP server. Rows are inserted via submit_interfaces_feedback().';
comment on column interfaces_feedback.feedback is
'The free-form feedback text as submitted by the user.';
comment on column interfaces_feedback.delete_token is
'Server-generated capability token returned once by submit_interfaces_feedback(); presenting it via the x-feedback-token request header authorizes reading and deleting this row.';
comment on column interfaces_feedback.user_agent is
'User agent of the submitting interface, e.g. SupabaseCLI/2.3.4. Also identifies which interface the feedback came from.';
comment on column interfaces_feedback.project_ref is
'Optional reference of the Supabase project the feedback relates to.';

alter table interfaces_feedback enable row level security;

-- The x-feedback-token request header is the capability check: policies can
-- only compare row data against session context (never a query's WHERE
-- clause), so the token must arrive as a header. Text comparison avoids
-- uuid-cast errors on malformed input; a missing header matches nothing.
create policy "Token holders can read their own feedback"
on interfaces_feedback
as permissive for select
to anon
using (delete_token::text = lower(current_setting('request.headers', true)::json ->> 'x-feedback-token'));

create policy "Token holders can delete their own feedback"
on interfaces_feedback
as permissive for delete
to anon
using (delete_token::text = lower(current_setting('request.headers', true)::json ->> 'x-feedback-token'));

-- Submissions go exclusively through this function so the delete token is
-- always server-generated and returned exactly once to the submitter. There
-- is deliberately no insert grant or policy on the table itself.
create function public.submit_interfaces_feedback(
	feedback text,
	user_agent text default null,
	user_id uuid default null,
	project_ref text default null,
	metadata jsonb default null
)
returns uuid
security definer
set search_path = ''
language plpgsql
as $$
#variable_conflict use_variable
declare
	token uuid;
begin
	insert into public.interfaces_feedback (feedback, user_agent, user_id, project_ref, metadata)
	values (feedback, user_agent, user_id, project_ref, metadata)
	returning delete_token into token;
	return token;
end;
$$;

comment on function public.submit_interfaces_feedback is
'Submits interface feedback and returns the delete token (issued exactly once).';

-- Both lines are load-bearing, in different environments: locally, the
-- default ACL gives new functions no EXECUTE at all (the grant is required);
-- on prod, the built-in default gives EXECUTE to the PUBLIC pseudo-role (the
-- revoke is required, and it must target public — revoking from anon or
-- authenticated by name is a no-op).
revoke execute on function public.submit_interfaces_feedback(text, text, uuid, text, jsonb) from public;
grant execute on function public.submit_interfaces_feedback(text, text, uuid, text, jsonb) to anon;

-- Two-gate model: these grants allow anon to ATTEMPT select/delete
-- statements; the header-checked policies above decide which rows each
-- statement can see. Column-scoped select keeps everything except the
-- feedback text and the caller's own token unreadable. delete_token needs
-- select because PostgREST rejects filterless deletes and WHERE columns
-- require select privilege — clients send the token as both the filter and
-- the header, and the policy stays the security boundary.
grant select (feedback, delete_token) on table interfaces_feedback to anon;
grant delete on table interfaces_feedback to anon;
