alter table public.meetups
add column timezone TEXT;

alter table public.meetups
rename column title to city;