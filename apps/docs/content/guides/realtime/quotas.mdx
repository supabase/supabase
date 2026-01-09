---
id: 'limits'
title: 'Realtime Limits'
description: 'Understanding Realtime limits'
sidebar_label: 'Limits'
---

Our cluster supports millions of concurrent connections and message throughput for production workloads.

<Admonition type="note">

Upgrade your plan to increase your limits. Without a spend cap, or on an Enterprise plan, some limits are still in place to protect budgets. All limits are configurable per project. [Contact support](/dashboard/support/new) if you need your limits increased.

</Admonition>

## Limits by plan

|                                                                                     | Free     | Pro      | Pro (no spend cap) | Team     | Enterprise |
| ----------------------------------------------------------------------------------- | -------- | -------- | ------------------ | -------- | ---------- |
| **Concurrent connections**                                                          | 200      | 500      | 10,000             | 10,000   | 10,000+    |
| **Messages per second**                                                             | 100      | 500      | 2,500              | 2,500    | 2,500+     |
| **Channel joins per second**                                                        | 100      | 500      | 2,500              | 2,500    | 2,500+     |
| **Channels per connection**                                                         | 100      | 100      | 100                | 100      | 100+       |
| **Presence keys per object**                                                        | 10       | 10       | 10                 | 10       | 10+        |
| **Presence messages per second**                                                    | 20       | 50       | 1,000              | 1,000    | 1,000+     |
| **Broadcast payload size**                                                          | 256 KB   | 3,000 KB | 3,000 KB           | 3,000 KB | 3,000+ KB  |
| **Postgres change payload size ([**read more**](#postgres-changes-payload-limit))** | 1,024 KB | 1,024 KB | 1,024 KB           | 1,024 KB | 1,024+ KB  |

Beyond the Free and Pro Plan you can customize your limits by [contacting support](/dashboard/support/new).

## Limit errors

When you exceed a limit, errors will appear in the backend logs and client-side messages in the WebSocket connection.

- **Logs**: check the [Realtime logs](/dashboard/project/_/database/realtime-logs) inside your project Dashboard.
- **WebSocket errors**: Use your browser's developer tools to find the WebSocket initiation request and view individual messages.

<Admonition type="tip" label="Realtime Inspector">

You can use the [Realtime Inspector](https://realtime.supabase.com/inspector/new) to reproduce an error and share those connection details with Supabase support.

</Admonition>
Some limits can cause a Channel join to be refused. Realtime will reply with one of the following WebSocket messages:

### `too_many_channels`

Too many channels currently joined for a single connection.

### `too_many_connections`

Too many total concurrent connections for a project.

### `too_many_joins`

Too many Channel joins per second.

### `tenant_events`

Connections will be disconnected if your project is generating too many messages per second. `supabase-js` will reconnect automatically when the message throughput decreases below your plan limit. An `event` is a WebSocket message delivered to, or sent from a client.

## Postgres changes payload limit

When this limit is reached, the `new` and `old` record payloads only include the fields with a value size of less than or equal to 64 bytes.
