create extension if not exists vector with schema public;

create table "public"."page" (
  id bigserial primary key,
  checksum text,
  path text not null unique
);

create table "public"."page_section" (
  id bigserial primary key,
  page_id bigint not null references public.page on delete cascade,
  content text,
  embedding vector(1536)
);
