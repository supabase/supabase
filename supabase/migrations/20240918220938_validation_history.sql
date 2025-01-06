create table validation_history (
  id bigint generated always as identity primary key,
  tag text not null,
  created_at timestamp with time zone not null default now()
);

create index validation_history_tag_created_at_idx on validation_history (tag, created_at desc);

alter table validation_history enable row level security;

create or replace function get_last_revalidation_for_tags(tags text[])
returns table (
  tag text,
  created_at timestamp with time zone
)
language sql
as $$
  select
    tag,
    max(created_at) as created_at
  from validation_history
  where tag = any(tags)
  group by tag;
$$;
