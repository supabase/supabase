defmodule Realtime.Tenants.Migrations.RestrictRealtimeSchema do
  @moduledoc false

  use Ecto.Migration

  def up do
    execute("""
    DO
    $do$
    BEGIN
       IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE  rolname = 'supabase_realtime_admin') THEN
          CREATE ROLE supabase_realtime_admin WITH NOINHERIT NOLOGIN NOREPLICATION;
       END IF;
    END
    $do$;
    """)

    execute("ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin")
    execute("ALTER TABLE realtime.subscription OWNER TO supabase_realtime_admin")
    execute("ALTER TYPE realtime.action OWNER TO supabase_realtime_admin")
    execute("ALTER TYPE realtime.equality_op OWNER TO supabase_realtime_admin")

    execute("""
    do $$
    begin
        if exists (select 1 from pg_extension where extname = 'orioledb') then
            execute 'drop index if exists realtime.subscription_subscription_id_entity_filters_action_filter_selected_columns_key';
        end if;
    end $$;
    """)

    execute("ALTER TYPE realtime.user_defined_filter OWNER TO supabase_realtime_admin")

    execute("""
    do $$
    begin
        if exists (select 1 from pg_extension where extname = 'orioledb') then
            execute 'create unique index if not exists subscription_subscription_id_entity_filters_action_filter_selected_columns_key on realtime.subscription (subscription_id, entity, filters, action_filter, coalesce(selected_columns, ''{}''))';
        end if;
    end $$;
    """)

    execute("ALTER TYPE realtime.wal_column OWNER TO supabase_realtime_admin")
    execute("ALTER TYPE realtime.wal_rls OWNER TO supabase_realtime_admin")
    execute("ALTER FUNCTION realtime.apply_rls(jsonb, integer) OWNER TO supabase_realtime_admin")
    execute("ALTER FUNCTION realtime.list_changes(name, name, integer, integer) OWNER TO supabase_realtime_admin")
    execute("ALTER FUNCTION realtime.quote_wal2json(regclass) OWNER TO supabase_realtime_admin")
    execute("ALTER FUNCTION realtime.send(jsonb, text, text, boolean) OWNER TO supabase_realtime_admin")
    execute("ALTER FUNCTION realtime.send_binary(bytea, text, text, boolean) OWNER TO supabase_realtime_admin")
    execute("ALTER FUNCTION realtime.subscription_check_filters() OWNER TO supabase_realtime_admin")
    execute("ALTER FUNCTION realtime.to_regrole(text) OWNER TO supabase_realtime_admin")
    execute("ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin")
    execute("ALTER FUNCTION realtime.wal2json_escape_identifier(text) OWNER TO supabase_realtime_admin")

    execute(
      "ALTER FUNCTION realtime.broadcast_changes(text, text, text, text, text, record, record, text) OWNER TO supabase_realtime_admin"
    )

    execute(
      "ALTER FUNCTION realtime.build_prepared_statement_sql(text, regclass, realtime.wal_column[]) OWNER TO supabase_realtime_admin"
    )

    execute("ALTER FUNCTION realtime.cast(text, regtype) OWNER TO supabase_realtime_admin")

    execute(
      "ALTER FUNCTION realtime.check_equality_op(realtime.equality_op, regtype, text, text) OWNER TO supabase_realtime_admin"
    )

    execute(
      "ALTER FUNCTION realtime.check_equality_op(realtime.equality_op, regtype, text, text, boolean) OWNER TO supabase_realtime_admin"
    )

    execute(
      "ALTER FUNCTION realtime.is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]) OWNER TO supabase_realtime_admin"
    )

    execute("""
    DO $$
    DECLARE
      grants text := current_setting('supautils.policy_grants', true);
    BEGIN
      IF grants LIKE '%realtime.messages%' AND grants LIKE '%realtime.subscription%' THEN
        REVOKE supabase_realtime_admin FROM postgres;
        GRANT USAGE ON SCHEMA realtime TO postgres WITH GRANT OPTION;
        REVOKE CREATE ON SCHEMA realtime FROM postgres;
      END IF;
    END $$;
    """)

    execute(
      "REVOKE ALL ON realtime.schema_migrations FROM postgres, dashboard_user, anon, authenticated, service_role, supabase_realtime_admin"
    )
  end

  def down do
    execute(
      "GRANT ALL ON realtime.schema_migrations TO postgres, dashboard_user, anon, authenticated, service_role, supabase_realtime_admin"
    )

    execute("""
    DO $$
    DECLARE
      grants text := current_setting('supautils.policy_grants', true);
    BEGIN
      IF grants LIKE '%realtime.messages%' AND grants LIKE '%realtime.subscription%' THEN
        GRANT CREATE ON SCHEMA realtime TO postgres;
        REVOKE GRANT OPTION FOR USAGE ON SCHEMA realtime FROM postgres;
        GRANT supabase_realtime_admin TO postgres;
      END IF;
    END $$;
    """)

    execute(
      "ALTER FUNCTION realtime.is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]) OWNER TO CURRENT_USER"
    )

    execute(
      "ALTER FUNCTION realtime.check_equality_op(realtime.equality_op, regtype, text, text, boolean) OWNER TO CURRENT_USER"
    )

    execute(
      "ALTER FUNCTION realtime.check_equality_op(realtime.equality_op, regtype, text, text) OWNER TO CURRENT_USER"
    )

    execute("ALTER FUNCTION realtime.cast(text, regtype) OWNER TO CURRENT_USER")

    execute(
      "ALTER FUNCTION realtime.build_prepared_statement_sql(text, regclass, realtime.wal_column[]) OWNER TO CURRENT_USER"
    )

    execute(
      "ALTER FUNCTION realtime.broadcast_changes(text, text, text, text, text, record, record, text) OWNER TO CURRENT_USER"
    )

    execute("ALTER FUNCTION realtime.wal2json_escape_identifier(text) OWNER TO CURRENT_USER")
    execute("ALTER FUNCTION realtime.topic() OWNER TO CURRENT_USER")
    execute("ALTER FUNCTION realtime.to_regrole(text) OWNER TO CURRENT_USER")
    execute("ALTER FUNCTION realtime.subscription_check_filters() OWNER TO CURRENT_USER")
    execute("ALTER FUNCTION realtime.send_binary(bytea, text, text, boolean) OWNER TO CURRENT_USER")
    execute("ALTER FUNCTION realtime.send(jsonb, text, text, boolean) OWNER TO CURRENT_USER")
    execute("ALTER FUNCTION realtime.quote_wal2json(regclass) OWNER TO CURRENT_USER")
    execute("ALTER FUNCTION realtime.list_changes(name, name, integer, integer) OWNER TO CURRENT_USER")
    execute("ALTER FUNCTION realtime.apply_rls(jsonb, integer) OWNER TO CURRENT_USER")

    execute("ALTER TYPE realtime.wal_rls OWNER TO CURRENT_USER")
    execute("ALTER TYPE realtime.wal_column OWNER TO CURRENT_USER")

    execute("""
    do $$
    begin
        if exists (select 1 from pg_extension where extname = 'orioledb') then
            execute 'drop index if exists realtime.subscription_subscription_id_entity_filters_action_filter_selected_columns_key';
        end if;
    end $$;
    """)

    execute("ALTER TYPE realtime.user_defined_filter OWNER TO CURRENT_USER")

    execute("""
    do $$
    begin
        if exists (select 1 from pg_extension where extname = 'orioledb') then
            execute 'create unique index if not exists subscription_subscription_id_entity_filters_action_filter_selected_columns_key on realtime.subscription (subscription_id, entity, filters, action_filter, coalesce(selected_columns, ''{}''))';
        end if;
    end $$;
    """)

    execute("ALTER TYPE realtime.equality_op OWNER TO CURRENT_USER")
    execute("ALTER TYPE realtime.action OWNER TO CURRENT_USER")
    execute("ALTER TABLE realtime.subscription OWNER TO CURRENT_USER")
    execute("ALTER TABLE realtime.messages OWNER TO CURRENT_USER")
  end
end
