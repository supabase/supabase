------------------------------------------------------
--------------------  01-public-todo-structure
  create extension if not exists citext;
----------------------------------------------------------------------------------------------
  create type todo_status as enum (
  'incomplete'
  ,'complete'
  ,'archived'
);
----------------------------------------------------------------------------------------------
create table if not exists todo (
  id uuid NOT NULL DEFAULT gen_random_uuid() primary key
  ,user_id uuid not null
  ,created_at timestamptz not null default current_timestamp
  ,updated_at timestamptz not null default current_timestamp
  ,name citext not null
  ,description citext
  ,status todo_status not null default 'incomplete'
);  
----------------------------------------------------------------------------------------------
ALTER TABLE todo ENABLE ROW LEVEL SECURITY;
create policy "Individuals can create todos." on todo for
  insert with check (auth.uid() = user_id);
create policy "Individuals can view their own todos. " on todo for
  select using (auth.uid() = user_id);
create policy "Individuals can update their own todos." on todo for
  update using (auth.uid() = user_id);
create policy "Individuals can delete their own todos." on todo for
  delete using (auth.uid() = user_id);
------------------------------------------------------
--------------------  02-public-todo-functions
----------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_todo(_name citext)
  RETURNS todo
  LANGUAGE plpgsql
  VOLATILE
  SECURITY INVOKER
  AS $$
  DECLARE
    _retval todo;
    _err_concitext citext;
  BEGIN
    _retval := (select todo_fn.create_todo(_name, auth.uid()));
    return _retval;
  end;
  $$;
----------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_todos_status(_todo_ids uuid[], _status todo_status)
  RETURNS SETOF todo
  LANGUAGE plpgsql
  AS $function$
  DECLARE
    _err_concitext citext;
  BEGIN
    update todo set status = _status, updated_at = current_timestamp where id = any(_todo_ids);

    return query
      select td.* from todo_fn.update_todos_status(_todo_ids, _status) td
    ;
  end;
  $function$
  ;
----------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION delete_todos(_todo_ids uuid[])
  RETURNS boolean
  LANGUAGE plpgsql
  VOLATILE
  SECURITY INVOKER
  AS $$
  DECLARE
    _retval boolean;
    _err_concitext citext;
  BEGIN
    _retval := (select todo_fn.delete_todos(_todo_ids));

    return _retval;
  end;
  $$;
------------------------------------------------------
--------------------  03-private-todo-functions
create schema todo_fn;
grant usage on schema todo_fn to authenticated;

CREATE OR REPLACE FUNCTION todo_fn.create_todo(_name citext, _user_id uuid)
  RETURNS todo
  LANGUAGE plpgsql
  VOLATILE
  SECURITY INVOKER
  AS $$
  DECLARE
    _retval todo;
    _err_concitext citext;
  BEGIN
    if  length(_name) < 3 then
      raise exception 'name must be 3 or more characters in length';
    end if;

    insert into todo(name, user_id) values(_name, _user_id) returning * into _retval;
    return _retval;
  end;
  $$;
----------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION todo_fn.update_todos_status(_todo_ids uuid[], _status todo_status)
  RETURNS SETOF todo
  LANGUAGE plpgsql
  AS $function$
  DECLARE
    _err_concitext citext;
  BEGIN
    update todo set status = _status, updated_at = current_timestamp where id = any(_todo_ids);

    return query
    select * from todo where id = any(_todo_ids)
    ;
  end;
  $function$
  ;
----------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION todo_fn.delete_todos(_todo_ids uuid[])
  RETURNS boolean
  LANGUAGE plpgsql
  VOLATILE
  SECURITY INVOKER
  AS $$
  DECLARE
    _retval boolean;
    _err_concitext citext;
  BEGIN
    delete from todo where id = any(_todo_ids);

    return true;
  end;
  $$;
