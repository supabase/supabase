INSERT INTO
    public.users (username)
VALUES
    ('supabot'),
    ('kiwicopple'),
    ('awalias'),
    ('dragarcia');

INSERT INTO
    public.channels (slug)
VALUES
    ('public'),
    ('random');

INSERT INTO
    public.messages (message, channel_id, user_id)
VALUES
    ('Hello World 👋', 1, 1),
    ('Perfection is attained, not when there is nothing more to add, but when there is nothing left to take away.', 2, 1);