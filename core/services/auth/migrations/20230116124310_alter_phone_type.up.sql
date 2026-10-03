-- alter phone field column type to accomodate for soft deletion 

do $$
begin
  alter table {{ index .Options "Namespace" }}.users
    alter column phone type text,
    alter column phone_change type text;
exception
  -- SQLSTATE errcodes https://www.postgresql.org/docs/current/errcodes-appendix.html
  when SQLSTATE '0A000' then
    raise notice 'Unable to change data type of phone, phone_change columns due to use by a view or rule';
  when SQLSTATE '2BP01' then
    raise notice 'Unable to change data type of phone, phone_change columns due to dependent objects';
  when SQLSTATE 'XX000' then
    raise notice 'Unable to change data type of phone, phone_change columns due to internal error (OrioleDB)';
end $$;
