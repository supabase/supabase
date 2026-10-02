do $$
declare
  _extversion text := @extversion@;
  _r record;
begin
  if _extversion is not null and _extversion != '3.1.8' then
    raise exception 'only pgsodium 3.1.8 is supported';
  end if;
end $$;
