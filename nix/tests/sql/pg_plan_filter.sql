begin;
  load 'plan_filter';

  create schema v;

  -- create a sample table
  create table v.test_table (
    id serial primary key,
    data text
  );

  -- insert some test data
  insert into v.test_table (data)
  values ('sample1'), ('sample2'), ('sample3');

  set local plan_filter.statement_cost_limit = 0.001;

  select * from v.test_table;

rollback;


