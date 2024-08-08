drop policy "Users can see their own profiles." on "public"."profiles";

create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid,
    "body" text
);


alter table "public"."notifications" enable row level security;

alter table "public"."profiles" add column "expo_push_token" text;

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

create policy "User can see own profile"
on "public"."profiles"
as permissive
for select
to authenticated
using ((auth.uid() = id));


