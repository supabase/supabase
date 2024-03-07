create table feedback_comment (
    id bigint primary key generated always as identity,
    date_created date not null default current_date,
    page text not null,
    comment text not null
);

alter table feedback_comment enable row level security;

create policy "Anyone can insert a feedback comment"
on feedback_comment
as permissive for insert
to public
with check (true);