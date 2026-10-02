-- backfill the auth.identities column by adding an email identity 
-- for all auth.users with an email and password 

do $$
begin
	insert into {{ index .Options "Namespace" }}.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
	select id, id as user_id, jsonb_build_object('sub', id, 'email', email) as identity_data, 'email' as provider, null as last_sign_in_at, '2022-11-25' as created_at, '2022-11-25' as updated_at
	from {{ index .Options "Namespace" }}.users as users
	where encrypted_password != '' and email is not null and not exists(select user_id from {{ index .Options "Namespace" }}.identities where user_id = users.id);
end;
$$;
