create table "realtime"."messages" (
  "topic"          text                        not null,
  "extension"      text                        not null,
  "payload"        jsonb,
  "event"          text,
  "private"        boolean,
  "updated_at"     timestamp without time zone not null,
  "inserted_at"    timestamp without time zone not null,
  "id"             uuid                        not null,
  "binary_payload" bytea,
  "skip_broadcast" boolean                     not null
) partition by range (inserted_at);

alter table "realtime"."messages"
  enable row level security;

alter table "realtime"."messages"
  owner to "supabase_realtime_admin";

alter table "realtime"."messages"
  alter column "id" set default gen_random_uuid();

alter table "realtime"."messages"
  alter column "inserted_at" set default now();

alter table "realtime"."messages"
  alter column "private" set default false;

alter table "realtime"."messages"
  alter column "skip_broadcast" set default false;

alter table "realtime"."messages"
  alter column "updated_at" set default now();

alter table "realtime"."messages"
  add constraint "messages_payload_exclusive" check (((payload IS NULL) OR (binary_payload IS NULL))) not valid;

alter table "realtime"."messages"
  add constraint "messages_pkey" primary key (id, inserted_at);

create index messages_inserted_at_topic_index on only realtime.messages using btree (inserted_at desc, topic)
  where ((extension = 'broadcast'::text) AND (private is TRUE));

grant insert, select, update on table "realtime"."messages" to "anon", "authenticated", "service_role";
