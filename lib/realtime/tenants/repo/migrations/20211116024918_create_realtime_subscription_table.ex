defmodule Realtime.Tenants.Migrations.CreateRealtimeSubscriptionTable do
  @moduledoc false

  use Ecto.Migration

  def change do
    execute("""
    DO $$
    BEGIN
        IF to_regtype('realtime.equality_op') IS NULL THEN
            CREATE TYPE realtime.equality_op AS ENUM(
              'eq', 'neq', 'lt', 'lte', 'gt', 'gte'
            );
        END IF;
    END$$;
    """)

    execute("""
    DO $$
    BEGIN
        IF to_regtype('realtime.user_defined_filter') IS NULL THEN
            CREATE TYPE realtime.user_defined_filter as (
              column_name text,
              op realtime.equality_op,
              value text
            );
        END IF;
    END$$;
    """)

    execute("create table if not exists realtime.subscription (
      -- Tracks which users are subscribed to each table
      id bigint not null generated always as identity,
      user_id uuid not null,
      -- Populated automatically by trigger. Required to enable auth.email()
      email varchar(255),
      entity regclass not null,
      filters realtime.user_defined_filter[] not null default '{}',
      created_at timestamp not null default timezone('utc', now()),

      constraint pk_subscription primary key (id),
      unique (entity, user_id, filters)
    )")

    execute("create index if not exists ix_realtime_subscription_entity on realtime.subscription using hash (entity)")
  end
end
