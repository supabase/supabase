create table if not exists public.threads (
	id uuid default gen_random_uuid(),
	created_at timestamp with time zone not null default now(),
	user_id uuid null,
	thread_title text not null,
	is_public boolean default true not null,
  	slug text generated always as (substring(id::text, 1, 8)) stored unique,
	constraint threads_pkey primary key (id),
	constraint threads_user_id_fkey foreign key (user_id) references auth.users (id) on update cascade on delete cascade
);

create table if not exists public.messages (
	id uuid default gen_random_uuid(),
	created_at timestamp with time zone not null default now(),
	thread_id uuid not null default gen_random_uuid(),
	message_id uuid not null default gen_random_uuid(),
	message_role text not null,
	message_input text not null,
	message_content text not null,
	user_id uuid null,
	constraint messages_pkey primary key (id),
	constraint messages_thread_id_fkey foreign key (thread_id) references threads (id) on update cascade on delete cascade,
	constraint messages_user_id_fkey foreign key (user_id) references auth.users (id) on update cascade on delete cascade
);
CREATE OR REPLACE VIEW profile_threads AS
SELECT DISTINCT ON (m.thread_id)
    m.thread_id,
    m.message_id,
    m.user_id,
    m.created_at,
    t.thread_title,
    t.is_public,
    t.slug,
    u.raw_user_meta_data->>'avatar_url' AS user_avatar_url
FROM
    public.messages m
JOIN public.threads t ON m.thread_id = t.id
JOIN auth.users u ON t.user_id = u.id
ORDER BY
    m.thread_id,
    m.created_at ASC;

