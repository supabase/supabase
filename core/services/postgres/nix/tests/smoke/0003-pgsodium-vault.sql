BEGIN;

select plan(3);

select id as test_new_key_id from pgsodium.create_key(name:='test_new_key') \gset

select vault.create_secret (
	's3kr3t_k3y', 'a_name', 'this is the foo secret key') test_secret_id \gset

select vault.create_secret (
	's3kr3t_k3y_2', 'another_name', 'this is another foo key',
	(select id from pgsodium.key where name = 'test_new_key')) test_secret_id_2 \gset

SELECT results_eq(
    $$
    SELECT decrypted_secret = 's3kr3t_k3y', description = 'this is the foo secret key'
    FROM vault.decrypted_secrets WHERE name = 'a_name';
    $$,
    $$VALUES (true, true)$$,
    'can select from masking view with custom key');

SELECT results_eq(
    $$
    SELECT decrypted_secret = 's3kr3t_k3y_2', description = 'this is another foo key'
    FROM vault.decrypted_secrets WHERE key_id = (select id from pgsodium.key where name = 'test_new_key');
    $$,
    $$VALUES (true, true)$$,
    'can select from masking view');

SELECT lives_ok(
	format($test$
	select vault.update_secret(
	    %L::uuid, new_name:='a_new_name',
	    new_secret:='new_s3kr3t_k3y', new_description:='this is the bar key')
	$test$, :'test_secret_id'),
	'can update name, secret and description'
	);

SELECT * FROM finish();
ROLLBACK;
