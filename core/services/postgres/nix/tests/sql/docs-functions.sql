-- testing sql found in https://supabase.com/docs/guides/database/functions

create or replace function hello_world()
returns text
language sql
as $$
  select 'hello world';
$$;

select hello_world();

create table planets (
  id serial primary key,
  name text
);

insert into planets
  (id, name)
values
  (1, 'Tattoine'),
  (2, 'Alderaan'),
  (3, 'Kashyyyk');

create table people (
  id serial primary key,
  name text,
  planet_id bigint references planets
);

insert into people
  (id, name, planet_id)
values
  (1, 'Anakin Skywalker', 1),
  (2, 'Luke Skywalker', 1),
  (3, 'Princess Leia', 2),
  (4, 'Chewbacca', 3);

create or replace function get_planets()
returns setof planets
language sql
as $$
  select * from planets;
$$;

select *
from get_planets()
where id = 1;

create or replace function add_planet(name text)
returns bigint
language plpgsql
as $$
declare
  new_row bigint;
begin
  insert into planets(name)
  values (add_planet.name)
  returning id into new_row;

  return new_row;
end;
$$;

select * from add_planet('Jakku');

create function hello_world_definer()
returns text
language plpgsql
security definer set search_path = ''
as $$
begin
  return 'hello world';
end;
$$;

select hello_world_definer();

revoke execute on function public.hello_world from public;
revoke execute on function public.hello_world from anon;

grant execute on function public.hello_world to authenticated;

revoke execute on all functions in schema public from public;
revoke execute on all functions in schema public from anon, authenticated;

alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;

grant execute on function public.hello_world to authenticated;

create function logging_example(
  log_message text,
  warning_message text,
  error_message text
)
returns void
language plpgsql
as $$
begin
  raise log 'logging message: %', log_message;
  raise warning 'logging warning: %', warning_message;
  raise exception 'logging error: %', error_message;
end;
$$;

select logging_example('LOGGED MESSAGE', 'WARNING MESSAGE', 'ERROR MESSAGE');

create or replace function error_if_null(some_val text)
returns text
language plpgsql
as $$
begin
  if some_val is null then
    raise exception 'some_val should not be NULL';
  end if;
  return some_val;
end;
$$;

select error_if_null('not null');

create table attendance_table (
  id uuid primary key,
  student text
);

insert into attendance_table (id, student) values ('123e4567-e89b-12d3-a456-426614174000', 'Harry Potter');

create function assert_example(name text)
returns uuid
language plpgsql
as $$
declare
  student_id uuid;
begin
  select
    id into student_id
  from attendance_table
  where student = name;

  assert student_id is not null, 'assert_example() ERROR: student not found';

  return student_id;
end;
$$;

select assert_example('Harry Potter');

create function error_example()
returns void
language plpgsql
as $$
begin
  select * from table_that_does_not_exist;

  exception
      when others then
          raise exception 'An error occurred in function <function name>: %', sqlerrm;
end;
$$;

select error_example();

create table some_table (
  col_1 int,
  col_2 text
);

insert into some_table (col_1, col_2) values (42, 'test value');

create or replace function advanced_example(num int default 10)
returns text
language plpgsql
as $$
declare
    var1 int := 20;
    var2 text;
begin
    raise log 'logging start of function call: (%)', (select now());

    select
      col_1 into var1
    from some_table
    limit 1;
    raise log 'logging a variable (%)', var1;

    raise log 'logging a query with a single return value(%)', (select col_1 from some_table limit 1);

    raise log 'logging an entire row as JSON (%)', (select to_jsonb(some_table.*) from some_table limit 1);

    insert into some_table (col_2)
    values ('new val')
    returning col_2 into var2;

    raise log 'logging a value from an INSERT (%)', var2;

    return var1 || ',' || var2;
exception
    when others then
        raise exception 'An error occurred in function <advanced_example>: %', sqlerrm;
end;
$$;

select advanced_example();

drop function advanced_example(int);
drop function error_example();
drop function assert_example(text);
drop function error_if_null(text);
drop function logging_example(text, text, text);
drop function hello_world_definer();
drop function add_planet(text);
drop function get_planets();
drop function hello_world();
drop table people;
drop table planets;
drop table attendance_table;
drop table some_table;

grant execute on all functions in schema public to public;
grant execute on all functions in schema public to anon, authenticated;

alter default privileges in schema public grant execute on functions to public;
alter default privileges in schema public grant execute on functions to anon, authenticated;
 