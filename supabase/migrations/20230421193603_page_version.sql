alter table "public"."page"
add "version" uuid,
add "last_refresh" timestamptz;
