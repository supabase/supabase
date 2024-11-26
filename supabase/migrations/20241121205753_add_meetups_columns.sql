alter table public.meetups
add column timezone text;

comment on column public.meetups is 'Needs to be in America/Los_Angeles format.';

alter table public.meetups
add column city text;