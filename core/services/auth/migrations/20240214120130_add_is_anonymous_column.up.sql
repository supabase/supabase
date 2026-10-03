do $$
begin
   alter table {{ index .Options "Namespace" }}.users 
   add column if not exists is_anonymous boolean not null default false;

   create index if not exists users_is_anonymous_idx  on {{ index .Options "Namespace" }}.users using btree (is_anonymous);
end
$$;
