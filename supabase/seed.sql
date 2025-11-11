insert into meetups
  (title, country, launch_week, start_at, is_published)
values
  ('New York', 'USA', 'lw12', now(), true),
  ('London', 'UK', 'lw12', now(), true),
  ('Singapore', 'Singapore', 'lw12', now(), true);

insert into public.launch_weeks (id) values ('lw14');

-- Insert mock error codes for testing
insert into content.error (code, service, http_status_code, message)
values
  (
    'test_code',
    (select id from content.service where name = 'AUTH'),
    500,
    'This is a test error message'
  ),
  ('test_code2', (select id from content.service where name = 'AUTH'), 429, 'Too many requests'),
  (
    'test_code3',
    (select id from content.service where name = 'REALTIME'),
    500,
    'A realtime error message'
  );
