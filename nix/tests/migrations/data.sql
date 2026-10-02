create table account(
    id int primary key,
    is_verified bool,
    name text,
    phone text
);

insert into public.account(id, is_verified, name, phone)
values
    (1, true, 'foo', '1111111111'),
    (2, true, 'bar', null),
    (3, false, 'baz', '33333333333');

select id as test_new_key_id from pgsodium.create_key(name:='test_new_key') \gset

select vault.create_secret (
	's3kr3t_k3y', 'a_name', 'this is the foo secret key') test_secret_id \gset

select vault.create_secret (
	's3kr3t_k3y_2', 'another_name', 'this is another foo key',
	(select id from pgsodium.key where name = 'test_new_key')) test_secret_id_2 \gset
