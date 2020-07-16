---
id: source
title: Building from Source
description: 'Host your own Realtime server'
---

Make sure you have Elixir [installed](https://elixir-lang.org/install.html).

Make sure you are in the right directory:

```bash
cd server
```

Install dependencies:

```bash
mix local.hex --force
mix local.rebar --force
mix deps.get
```

Create the release:

```bash
MIX_ENV=prod mix release
```

Start the release (set the environment variables as appropriate):

```bash
SECRET_KEY_BASE=SOMETHING_SECRET \
PORT=4000 \
HOSTNAME=localhost \
DB_USER=postgres \
DB_HOST=localhost \
DB_PASSWORD=postgres \
DB_NAME=postgres \
DB_PORT=5432 \
_build/prod/rel/realtime/bin/realtime start
```
