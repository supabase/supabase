-- Start transaction and plan the tests.
begin;
    select plan(1);

    create extension if not exists index_advisor;

    create table account(
        id int primary key,
        is_verified bool
    );

    select is(
      (select count(1) from index_advisor('select id from public.account where is_verified;'))::int,
      1,
      'index_advisor returns 1 row'
    );

    select * from finish();
rollback;
