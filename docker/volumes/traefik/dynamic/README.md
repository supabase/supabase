# Traefik Dynamic Configuration

This directory contains Traefik dynamic configuration files loaded by the file provider.

## Files

- **supabase.yml** — Defines all HTTP routers, services, and middlewares that replace the
  previous Kong API gateway configuration. Routes are path-based and forward requests to
  internal Supabase services (PostgREST, GoTrue, Realtime, Storage, Edge Functions, pg-meta,
  and Studio).

## Template Markers

The `supabase.yml` file uses `%%VAR%%` template markers (e.g., `%%SUPABASE_DOMAIN%%`) that
are expanded at container startup from environment variables defined in `docker-compose.yml`.
Do not replace these markers manually — they are processed automatically by the Traefik
service entrypoint.

## Adding Configuration

Additional middleware or route files can be added to this directory. Traefik's file provider
watches this directory and will pick up any `.yml` or `.yaml` files automatically.
