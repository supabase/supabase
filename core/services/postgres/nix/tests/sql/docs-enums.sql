-- testing sql found in https://supabase.com/docs/guides/database/postgresenums

create type mood as enum (
  'happy',
  'sad',
  'excited',
  'calm'
);

create table person (
  id serial primary key,
  name text,
  current_mood mood
);

insert into person
  (name, current_mood)
values
  ('Alice', 'happy');

insert into person
  (name, current_mood)
values
  ('Bob', 'sad');

insert into person
  (name, current_mood)
values
  ('Charlie', 'excited');

select * 
from person 
where current_mood = 'sad';

select * 
from person 
where current_mood = 'happy';

update person
set current_mood = 'excited'
where name = 'Alice';

select * 
from person 
where name = 'Alice';

alter type mood add value 'content';

insert into person
  (name, current_mood)
values
  ('David', 'content');

select enum_range(null::mood);

select * 
from person 
where current_mood = 'content';

create type status as enum (
  'active',
  'inactive',
  'pending'
);

create table orders (
  id serial primary key,
  order_number text,
  status status
);

insert into orders
  (order_number, status)
values
  ('ORD-001', 'active'),
  ('ORD-002', 'pending'),
  ('ORD-003', 'inactive');

select * 
from orders 
where status = 'active';

update orders
set status = 'inactive'
where order_number = 'ORD-002';

select * 
from orders 
where order_number = 'ORD-002';

alter type status add value 'cancelled';

insert into orders
  (order_number, status)
values
  ('ORD-004', 'cancelled');

select enum_range(null::status);

select * 
from orders 
where status = 'cancelled';

create type priority as enum (
  'low',
  'medium',
  'high',
  'critical'
);

create table tasks (
  id serial primary key,
  title text,
  priority priority
);

insert into tasks
  (title, priority)
values
  ('Fix bug', 'high'),
  ('Update docs', 'low'),
  ('Security audit', 'critical');

select * 
from tasks 
where priority = 'critical';

update tasks
set priority = 'medium'
where title = 'Update docs';

select * 
from tasks 
where title = 'Update docs';

alter type priority add value 'urgent';

insert into tasks
  (title, priority)
values
  ('Server maintenance', 'urgent');

select enum_range(null::priority);

select * 
from tasks 
where priority = 'urgent';

drop table tasks;
drop table orders;
drop table person;
drop type priority;
drop type status;
drop type mood;
