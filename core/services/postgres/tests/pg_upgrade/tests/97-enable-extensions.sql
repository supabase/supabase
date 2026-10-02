do $$
declare 
  ext record;
begin
  for ext in (select * from pg_available_extensions where name not in (select extname from pg_extension) order by name)
  loop
    execute 'create extension if not exists ' || ext.name || ' cascade';
  end loop;
end;
$$;
