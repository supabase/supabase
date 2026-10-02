do $$
begin
    if not exists(select * 
        from information_schema.columns
        where table_schema = '{{ index .Options "Namespace" }}' and table_name='identities' and column_name='provider_id')
    then
        alter table if exists {{ index .Options "Namespace" }}.identities 
        rename column id to provider_id;
    end if;
end$$;

alter table if exists {{ index .Options "Namespace" }}.identities 
    drop constraint if exists identities_pkey,
    add column if not exists id uuid default gen_random_uuid() primary key;

do $$
begin
  if not exists
     (select constraint_name
      from information_schema.table_constraints
      where table_schema = '{{ index .Options "Namespace" }}'
      and table_name = 'identities'
      and constraint_name = 'identities_provider_id_provider_unique')
  then
    alter table if exists {{ index .Options "Namespace" }}.identities 
    add constraint identities_provider_id_provider_unique 
    unique(provider_id, provider);
  end if;
end $$;
