---
id: docker
title: Docker
description: 'Host your own Realtime server'
---

Make sure you have Docker [installed](https://docs.docker.com/get-docker/).

## Quick Install

The image is available in [Docker Hub](https://hub.docker.com/r/supabase/realtime) under the name `supabase/realtime`.

You can use the [docker-compose file](https://github.com/supabase/realtime/blob/master/docker-compose.dev.yml) in this repository as a starting point. Note that this already includes a Postgres database image, so you don't have to set one up yourself.

Fill up the environment variables as appropriate, and then run the image:

```bash
docker-compose up
```

## Build from Scratch

Build the image:

```bash
docker build --tag foo .
```

Run the image:

```bash
# Update the environment variables to point to your own database
docker run --rm \
  -e DB_HOST=host.docker.internal \
  -e DB_NAME=postgres \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  -e DB_PORT=5432 \
  -e PORT=4000 \
  -e HOSTNAME=localhost \
  -e SECRET_KEY_BASE=SOMETHING_SUPER_SECRET \
  -p 4000:4000 \
  foo
```
