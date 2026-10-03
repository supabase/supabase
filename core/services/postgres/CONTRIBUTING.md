# Welcome to Supabase Postgres contributing guide

## Adding a new extension

Extensions can either be built from source or installed through a debian package. In general, you want to add the installation commands for your extension to the [Dockerfile](Dockerfile) following the steps below.

1. Create a [build stage](Dockerfile#L777) named after your extension.
2. Add build args that specify the extension's [release version](Dockerfile#L37).
3. If your extension is published as a package, download it to `/tmp/<name>.deb` using the [ADD command](Dockerfile#L705).
4. If you need to build the extensions from source, use [checkinstall](Dockerfile#L791) to create a `/tmp/<name>.deb` package.
5. Copy your extension's package from build stage to [extensions stage](Dockerfile#L851).

Here's a minimal example:

```dockerfile
ARG pg_graphql_release=1.1.0

####################
# 19-pg_graphql.yml
####################
FROM base as pg_graphql
# Download package archive
ARG pg_graphql_release
ADD "https://github.com/supabase/pg_graphql/releases/download/v${pg_graphql_release}/pg_graphql-v${pg_graphql_release}-pg${postgresql_major}-${TARGETARCH}-linux-gnu.deb" \
    /tmp/pg_graphql.deb

####################
# Collect extension packages
####################
FROM scratch as extensions
COPY --from=pg_graphql /tmp/*.deb /tmp/
```

Using this process maximises the effectiveness of Docker layer caching, which significantly speeds up our CI builds.

## Testing an extension

Extensions can be tested automatically using pgTAP. Start by creating a new file in [migrations/tests/extensions](migrations/tests/extensions). For example:

```sql
BEGIN;
create extension if not exists wrappers with schema "extensions";
ROLLBACK;
```

This test will be run as part of CI to check that your extension can be enabled successfully from the final Docker image.
