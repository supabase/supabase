# Supabase Docker

This is a minimal Docker Compose setup for self-hosting Supabase.

## Getting started

You need the following installed in your system:

- Docker
- Git
- docker-compose

Then checkout this directory:

```sh
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
```

Copy `.env.example` to `.env`:

```sh
cp .env.example .env
```

Populate `.env`. In particular, these environment variables are required:

- `POSTGRES_PASSWORD`: you will access your database using the `postgres` role and the password you set here
- `JWT_SECRET`: this is used by PostgREST and GoTrue, among others
- `SITE_URL`: the base URL of your site
- `SMTP_*`: mail server credentials

Then take your `JWT_SECRET` and generate JWTs for use as API keys. You will need two keys with payloads:

```json
{
  "role": "anon"
}
```

```json
{
  "role": "service_role"
}
```

Replace `ANON_KEY` & `SERVICE_KEY` in `docker-compose.yml` and the `anon` & `service_role` keys in `volumes/kong.yml` with these keys.

With that, you can now start the setup:

```sh
docker-compose up
```

Your database will be persisted in `volumes/db/data`, and your storage objects in `volumes/storage`. Now you can try out the examples in `supabase/examples` to verify if it works correctly!

## Advanced configuration

To keep the setup simple, we made some choices that may not be optimal for your needs, e.g.:

- the database is in the same machine as the servers
- the storage uses the filesystem backend instead of S3

If you want to deploy this to production and this minimal setup has outgrown your needs, you should operate the components with your own deployment strategy. You can configure each of the components using the resources here:

- [Postgres](https://hub.docker.com/_/postgres/)
- [PostgREST](https://postgrest.org/en/stable/configuration.html)
- [Realtime](https://github.com/supabase/realtime#server-set-up)
- [GoTrue](https://github.com/supabase/gotrue)
- [Storage](https://github.com/supabase/storage-api)
- [Kong](https://docs.konghq.com/install/docker/)

## Migrating to newer versions

Supabase keeps evolving, and this setup will get updated over time. However, at the moment we don't have a migration strategy to move your data to a newer setup. We hope to address this as the platform matures.
