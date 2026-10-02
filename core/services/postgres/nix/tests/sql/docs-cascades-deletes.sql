-- testing sql found in https://supabase.com/docs/guides/database/postgres/cascades-deletes
-- all of the errors produced by this file are expected

create table grandparent (
  id serial primary key,
  name text
);

create table parent (
  id serial primary key,
  name text,
  parent_id integer references grandparent (id)
    on delete cascade
);

create table child (
  id serial primary key,
  name text,
  father integer references parent (id)
    on delete restrict
);

insert into grandparent
  (id, name)
values
  (1, 'Elizabeth');

insert into parent
  (id, name, parent_id)
values
  (1, 'Charles', 1);

insert into parent
  (id, name, parent_id)
values
  (2, 'Diana', 1);

insert into child
  (id, name, father)
values
  (1, 'William', 1);

select count(*) from grandparent;
select count(*) from parent;
select count(*) from child;

delete from grandparent;

select count(*) from grandparent;
select count(*) from parent;
select count(*) from child;

insert into grandparent
  (id, name)
values
  (1, 'Elizabeth');

insert into parent
  (id, name, parent_id)
values
  (1, 'Charles', 1);

insert into parent
  (id, name, parent_id)
values
  (2, 'Diana', 1);

insert into child
  (id, name, father)
values
  (1, 'William', 1);

alter table child
drop constraint child_father_fkey;

alter table child
add constraint child_father_fkey foreign key (father) references parent (id)
  on delete no action;

delete from grandparent;

select count(*) from grandparent;
select count(*) from parent;
select count(*) from child;

insert into grandparent
  (id, name)
values
  (1, 'Elizabeth');

insert into parent
  (id, name, parent_id)
values
  (1, 'Charles', 1);

insert into parent
  (id, name, parent_id)
values
  (2, 'Diana', 1);

insert into child
  (id, name, father)
values
  (1, 'William', 1);

alter table child
drop constraint child_father_fkey;

alter table child
add constraint child_father_fkey foreign key (father) references parent (id)
  on delete no action initially deferred;

delete from grandparent;

select count(*) from grandparent;
select count(*) from parent;
select count(*) from child;

insert into grandparent
  (id, name)
values
  (1, 'Elizabeth');

insert into parent
  (id, name, parent_id)
values
  (1, 'Charles', 1);

insert into parent
  (id, name, parent_id)
values
  (2, 'Diana', 1);

insert into child
  (id, name, father)
values
  (1, 'William', 1);

alter table child
add column mother integer references parent (id)
  on delete cascade;

update child
set mother = 2
where id = 1;

delete from grandparent;

select count(*) from grandparent;
select count(*) from parent;
select count(*) from child;

create table test_cascade (
  id serial primary key,
  name text
);

create table test_cascade_child (
  id serial primary key,
  parent_id integer references test_cascade (id) on delete cascade,
  name text
);

insert into test_cascade (name) values ('Parent');
insert into test_cascade_child (parent_id, name) values (1, 'Child');

delete from test_cascade;

select count(*) from test_cascade;
select count(*) from test_cascade_child;

create table test_restrict (
  id serial primary key,
  name text
);

create table test_restrict_child (
  id serial primary key,
  parent_id integer references test_restrict (id) on delete restrict,
  name text
);

insert into test_restrict (name) values ('Parent');
insert into test_restrict_child (parent_id, name) values (1, 'Child');

delete from test_restrict;

select count(*) from test_restrict;
select count(*) from test_restrict_child;

create table test_set_null (
  id serial primary key,
  name text
);

create table test_set_null_child (
  id serial primary key,
  parent_id integer references test_set_null (id) on delete set null,
  name text
);

insert into test_set_null (name) values ('Parent');
insert into test_set_null_child (parent_id, name) values (1, 'Child');

delete from test_set_null;

select count(*) from test_set_null;
select count(*) from test_set_null_child;
select parent_id from test_set_null_child;

create table test_set_default (
  id serial primary key,
  name text
);

create table test_set_default_child (
  id serial primary key,
  parent_id integer default 999 references test_set_default (id) on delete set default,
  name text
);

insert into test_set_default (name) values ('Parent');
insert into test_set_default_child (parent_id, name) values (1, 'Child');

delete from test_set_default;

select count(*) from test_set_default;
select count(*) from test_set_default_child;
select parent_id from test_set_default_child;

create table test_no_action (
  id serial primary key,
  name text
);

create table test_no_action_child (
  id serial primary key,
  parent_id integer references test_no_action (id) on delete no action,
  name text
);

insert into test_no_action (name) values ('Parent');
insert into test_no_action_child (parent_id, name) values (1, 'Child');

delete from test_no_action;

select count(*) from test_no_action;
select count(*) from test_no_action_child;

drop table if exists test_cascade_child;
drop table if exists test_cascade;
drop table if exists test_restrict_child;
drop table if exists test_restrict;
drop table if exists test_set_null_child;
drop table if exists test_set_null;
drop table if exists test_set_default_child;
drop table if exists test_set_default;
drop table if exists test_no_action_child;
drop table if exists test_no_action;
drop table if exists child;
drop table if exists parent;
drop table if exists grandparent;
