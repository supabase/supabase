---
id: docker
title: Docker
description: 'Host your own Postgres server'
---

## Docker

The image is now available in [Docker Hub](https://hub.docker.com/r/supabase/postgres) under the name `supabase/postgres`.

## Docker compose

You can use the [docker-compose file](https://github.com/supabase/postgres/blob/develop/docker/docker-compose.yml) available in this repository as your starting point. You can then run:

```
$ docker-compose up
```

As the image is based on the [postgreSQL 12 image](https://hub.docker.com/_/postgres), environment variables from the postgreSQL 12 image are applicable to this image.
