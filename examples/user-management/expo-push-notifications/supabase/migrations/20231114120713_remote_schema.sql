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


CREATE TRIGGER "send push notification" AFTER INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://bqeuunydbomjvynieund.supabase.co/functions/v1/push', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZXV1bnlkYm9tanZ5bmlldW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5ODExNjg3MywiZXhwIjoyMDEzNjkyODczfQ.1aTtEHnTLiwPH5khg7jWq-rkXFOxpSpW55rxTl2G9kU"}', '{}', '1000');


