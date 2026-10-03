-- If the following are true:
-- * the extension to be created is a TLE
-- * the extension is created with `cascade`
--
-- then we pre-`create` all nested extension dependencies which are part of
-- `supautils.privileged_extensions`. This is because supautils can't intercept
-- the extension creation for dependencies - it can only intercept the `create
-- extension` statement.
do $$
declare
  _extname text := @extname@;
  _extschema text := @extschema@;
  _extversion text := @extversion@;
  _extcascade bool := @extcascade@;
  _r record;
begin
  if not _extcascade then
    return;
  end if;

  if not exists (select from pg_extension where extname = 'pg_tle') then
    return;
  end if;

  if not exists (select from pgtle.available_extensions() where name = _extname) then
    return;
  end if;

  if _extversion is null then
    select default_version
    from pgtle.available_extensions()
    where name = _extname
    into _extversion;
  end if;

  if _extschema is null then
    select schema
    from pgtle.available_extension_versions()
    where name = _extname and version = _extversion
    into _extschema;
  end if;

  for _r in (
    with recursive available_extensions(name, default_version) as (
      select name, default_version
      from pg_available_extensions
      union
      select name, default_version
      from pgtle.available_extensions()
    )
    , available_extension_versions(name, version, requires) as (
      select name, version, requires
      from pg_available_extension_versions
      union
      select name, version, requires
      from pgtle.available_extension_versions()
    )
    , all_dependencies(name, dependency) as (
      select e.name, unnest(ev.requires) as dependency
      from available_extensions e
      join available_extension_versions ev on ev.name = e.name and ev.version = e.default_version
    )
    , dependencies(name) AS (
        select unnest(requires)
        from available_extension_versions
        where name = _extname and version = _extversion
        union
        select all_dependencies.dependency
        from all_dependencies
        join dependencies d on d.name = all_dependencies.name
    )
    select name
    from dependencies
    intersect
    select name
    from regexp_split_to_table(current_setting('supautils.privileged_extensions', true), '\s*,\s*') as t(name)
  ) loop
    if _extschema is null then
      execute(format('create extension if not exists %I cascade', _r.name));
    else
      execute(format('create extension if not exists %I schema %I cascade', _r.name, _extschema));
    end if;
  end loop;
end $$;
