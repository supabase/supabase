insert into public.role_permissions (role, permission)
values
    ('admin', 'channels.delete'),
    ('admin', 'messages.delete'),
    ('moderator', 'messages.delete');

DO $$
DECLARE
    user_id uuid;
BEGIN
    user_id := public.create_user('supabot+supaadmin@example.com');

    insert into public.channels (slug, created_by)
    values
        ('public', user_id),
        ('random', user_id);

    insert into public.messages (message, channel_id, user_id)
    values
        ('Hello World 👋', 1, user_id),
        ('Perfection is attained, not when there is nothing more to add, but when there is nothing left to take away.', 2, user_id);
END $$;
  
