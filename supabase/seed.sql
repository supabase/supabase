insert into meetups
  (title, country, launch_week, start_at, is_published)
values
  ('New York', 'USA', 'lw12', now(), true),
  ('London', 'UK', 'lw12', now(), true),
  ('Singapore', 'Singapore', 'lw12', now(), true);

insert into public.launch_weeks (id) values ('lw14');

insert into meetups
  (title, country, launch_week, start_at, is_published)
values
  ('New York', 'USA', 'lw14', now(), true),
  ('London', 'UK', 'lw14', now(), true),
  ('Singapore', 'Singapore', 'lw14', now(), true);
