\set pguser `echo "$POSTGRES_USER"`

create schema if not exists _logs;
alter schema _logs owner to :pguser;
