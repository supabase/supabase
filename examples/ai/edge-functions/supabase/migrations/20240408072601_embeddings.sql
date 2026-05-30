create extension if not exists pg_net with schema extensions;
create extension if not exists vector with schema extensions;

create table embeddings (
  id bigint primary key generated always as identity,
  content text not null,
  embedding vector (384)
);
alter table embeddings enable row level security;

create index on embeddings using hnsw (embedding vector_ip_ops);