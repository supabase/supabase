FROM supabase/postgres:0.13.0

COPY 00-initial-schema.sql /docker-entrypoint-initdb.d/00-initial-schema.sql
COPY auth-schema.sql /docker-entrypoint-initdb.d/auth-schema.sql

# Build time defaults
ARG build_POSTGRES_DB=postgres
ARG build_POSTGRES_USER=postgres
ARG build_POSTGRES_PASSWORD=postgres
ARG build_POSTGRES_PORT=5432

# Run time values
ENV POSTGRES_DB=$build_POSTGRES_DB
ENV POSTGRES_USER=$build_POSTGRES_USER
ENV POSTGRES_PASSWORD=$build_POSTGRES_PASSWORD
ENV POSTGRES_PORT=$build_POSTGRES_PORT

EXPOSE 5432
