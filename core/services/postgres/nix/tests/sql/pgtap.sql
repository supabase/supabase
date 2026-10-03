begin;

select plan(1);

-- Run the tests.
select pass( 'My test passed, w00t!' );

-- Finish the tests and clean up.
select * from finish();

rollback;
