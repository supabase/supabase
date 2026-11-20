create table feedback_comments (
	id bigint primary key generated always as identity,
	created_at timestamptz not null default now(),
	page text not null,
	vote feedback_vote,
	title text,
	comment text not null,
	user_id uuid,
	metadata jsonb
);

alter table feedback_comments enable row level security;

create policy "Anyone can insert feedback comments"
on feedback_comments
as permissive for insert
to public
with check (true);
