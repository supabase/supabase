<br />
<p align="center">
  <a href="https://supabase.io">
        <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--light.svg">
      <img alt="Supabase Logo" width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/logo-preview.jpg">
    </picture>
  </a>

  <h1 align="center">Supabase Realtime</h1>

  <p align="center">
    Send ephemeral messages, track and synchronize shared state, and listen to Postgres changes all over WebSockets.
    <br />
    <a href="https://supabase.com/docs/guides/realtime#examples">Examples</a>
    ·
    <a href="https://github.com/orgs/supabase/discussions/new?category=feature-requests">Request Features</a>
    ·
    <a href="https://github.com/supabase/realtime/issues/new?assignees=&labels=bug&template=1.Bug_report.md">Report Bugs</a>
    <br />
  </p>
</p>

## Status

[![GitHub License](https://img.shields.io/github/license/supabase/realtime)](https://github.com/supabase/realtime/blob/main/LICENSE)
[![Coverage Status](https://coveralls.io/repos/github/supabase/realtime/badge.svg?branch=main)](https://coveralls.io/github/supabase/realtime?branch=main)

| Features         | v1  | v2  | Status |
| ---------------- | --- | --- | ------ |
| Postgres Changes | ✔   | ✔   | GA     |
| Broadcast        |     | ✔   | GA     |
| Presence         |     | ✔   | GA     |

This repository focuses on version 2 but you can still access the previous version's [code](https://github.com/supabase/realtime/tree/v1) and [Docker image](https://hub.docker.com/layers/supabase/realtime/v1.0.0/images/sha256-e2766e0e3b0d03f7e9aa1b238286245697d0892c2f6f192fd2995dca32a4446a). For the latest Docker images go to https://hub.docker.com/r/supabase/realtime.

The codebase is under heavy development and the documentation is constantly evolving. Give it a try and let us know what you think by creating an issue. Watch [releases](https://github.com/supabase/realtime/releases) of this repo to get notified of updates. And give us a star if you like it!

## Overview

### What is this?

This is a server built with Elixir using the [Phoenix Framework](https://www.phoenixframework.org) that enables the following functionality:

- Broadcast: Send ephemeral messages from client to clients with low latency.
- Presence: Track and synchronize shared state between clients.
- Postgres Changes: Listen to Postgres database changes and send them to authorized clients.

For a more detailed overview head over to [Realtime guides](https://supabase.com/docs/guides/realtime).

### Does this server guarantee message delivery?

The server does not guarantee that every message will be delivered to your clients so keep that in mind as you're using Realtime.

## Quick start

You can check out the [Supabase UI Library](https://supabase.com/ui) Realtime components and the [repository](https://github.com/supabase/multiplayer.dev) of the [multiplayer.dev](https://multiplayer.dev) demo app.

## Developers

Start with [DEVELOPERS.md](DEVELOPERS.md) for local setup, `mise` tasks, and example workflows.

Once your environment is up and running, check out the following docs to customize the server and troubleshooting:

- [ARCHITECTURE.md](ARCHITECTURE.md) - how the cluster, broadcast fan-out and Postgres Changes fit together
- [ENVS.md](ENVS.md) - detailed list of all environment variables
- [ERROR_CODES.md](ERROR_CODES.md) - list of operational codes
- [OBSERVABILITY_METRICS.md](OBSERVABILITY_METRICS.md) - monitoring information

## Postgres compatibility

Versions below refer to `supabase/postgres` releases unless stated otherwise.

| Tenant database                 | Role             | Status                     | Notes                                                                                                                                                                                                                                                                          |
| ------------------------------- | ---------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| < 14                            | -                | Not supported              | -                                                                                                                                                                                                                                                                              |
| 14.x                            | `supabase_admin` | Supported with limitations | Realtime needs a superuser. Only a superuser can set `log_min_messages`, and supautils can't hand it to another role on this version. On Postgres 14.5 and earlier, `realtime.broadcast_changes(...)` fails when a trigger calls it with `PERFORM`.                            |
| 15.x < 15.14.1.018              | `supabase_admin` | Supported                  | Realtime needs a superuser. `supautils.policy_grants` doesn't cover `realtime.subscription` until [supabase/postgres@1b916920](https://github.com/supabase/postgres/commit/1b916920).                                                                                          |
| 15.x >= 15.14.1.018, 16.x, 17.x | `supabase_admin` | Supported                  | Migrations need a superuser. Tenant grants don't. supautils manages the policies.                                                                                                                                                                                              |
| 17.x-orioledb < 17.11.0.001     | `supabase_admin` | Supported with limitations | Tested in CI on `17.9.0.019-orioledb`. Migrations need a superuser. With `REPLICA IDENTITY FULL`, Postgres Changes UPDATE and DELETE events don't include the old value of large (TOASTed) columns ([orioledb/orioledb#1157](https://github.com/orioledb/orioledb/pull/1157)). |
| 17.x-orioledb >= 17.11.0.001    | `supabase_admin` | Supported with limitations | Broadcast from Database loses messages sent from a trigger on an OrioleDB table. Logical decoding skips the `realtime.messages` insert that `realtime.send` or `realtime.broadcast_changes` makes in the trigger. Older OrioleDB images don't have this bug.                   |
| Multigres                       | `supabase_admin` | Supported                  | >= 17.x and every commit waits for a standby.                                                                                                                                                                                                                                  |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## Code of Conduct

See [supabase/CODE_OF_CONDUCT.md](https://github.com/supabase/.github/blob/main/CODE_OF_CONDUCT.md)

## License

This repo is licensed under Apache 2.0.

## Credits

- [Phoenix](https://github.com/phoenixframework/phoenix) - `Realtime` server is built with the amazing Elixir framework.
- [Phoenix Channels JavaScript Client](https://github.com/phoenixframework/phoenix/tree/master/assets/js/phoenix) - [@supabase/realtime-js](https://github.com/supabase/realtime-js) client library heavily draws from the Phoenix Channels client library.
