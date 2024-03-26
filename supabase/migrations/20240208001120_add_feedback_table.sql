create type feedback_vote as enum (
	'yes',
	'no'
);

create table feedback (
	id bigint primary key generated always as identity,
	date_created date not null default current_date,
	vote feedback_vote not null,
	page text not null
);

alter table feedback enable row level security;

create policy "Anyone can insert feedback"
on feedback
as permissive for insert
to public
with check (true);
