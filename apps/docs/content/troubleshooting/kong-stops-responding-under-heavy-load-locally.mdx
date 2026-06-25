---
title = "Kong stops responding under heavy load in local development"
topics = [ "cli", "self-hosting", "storage" ]
keywords = [ "kong", "local", "workers", "nginx", "worker_processes", "storage", "concurrent", "timeout", "socket" ]

[api]
cli = [ "supabase-start" ]
---

When running Supabase locally with the CLI, the Kong API gateway can stop
responding under heavy load. This typically happens when many parallel
requests are made (for example, bulk operations against the Storage API):
Kong starts terminating socket connections and logs errors about not having
enough available workers.

## Why this happens

To keep the local stack lightweight, the CLI starts Kong with a single nginx
worker process (`KONG_NGINX_WORKER_PROCESSES=1`). A single worker minimizes
memory usage across the ~12 containers that make up the local stack, but it
also limits how many concurrent connections Kong can handle. When the number
of in-flight requests exceeds what one worker can serve, Kong becomes
unresponsive and drops connections.

## How to fix it

You can override the number of Kong nginx worker processes by setting the
`KONG_NGINX_WORKER_PROCESSES` environment variable before starting the local
stack. Set it to a specific number, or to `auto` to let Kong allocate one
worker per available CPU:

```bash
# Use one worker per CPU core
KONG_NGINX_WORKER_PROCESSES=auto supabase start

# Or pick a fixed number of workers
KONG_NGINX_WORKER_PROCESSES=2 supabase start
```

You can also export the variable so it applies to every command in your shell
session:

```bash
export KONG_NGINX_WORKER_PROCESSES=auto
supabase start
```

Increasing the worker count lets Kong handle more parallel connections at the
cost of higher memory usage. If you don't set the variable, the CLI keeps the
default of `1` worker to minimize the local stack's memory footprint.

After changing the value, restart the stack for it to take effect:

```bash
supabase stop
KONG_NGINX_WORKER_PROCESSES=auto supabase start
```

## Additional resources

- [Local development guide](/docs/guides/cli/local-development)
- [CLI repository](https://github.com/supabase/cli)
