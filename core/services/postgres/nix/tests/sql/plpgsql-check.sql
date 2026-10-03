create schema v;

create table v.t1(
  a int,
  b int
);

create or replace function v.f1()
  returns void
  language plpgsql
as $$
declare r record;
begin
  for r in select * from v.t1
  loop
    raise notice '%', r.c; -- there is bug - table t1 missing "c" column
  end loop;
end;
$$;

select * from v.f1();

-- use plpgsql_check_function to check the function for errors
select * from plpgsql_check_function('v.f1()');

drop schema v cascade;
