\set pguser `echo "$POSTGRES_USER"`

create schema if not exists _analytics;
alter schema _analytics owner to :pguser;
