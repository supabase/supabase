---
title = "Realtime Egress FAQ"
topics = [ "realtime", "platform" ]
keywords = [ "egress", "bandwidth", "billing", "websocket", "broadcast", "postgres changes", "cloudflare" ]
---

Realtime Egress is billed as part of your project's [unified egress](/docs/guides/platform/manage-your-usage/egress#realtime-egress) usage. This FAQ walks through what's counted, what isn't, and how to investigate a gap between the two.

## What exactly is included in the Realtime Egress metric?

Realtime Egress measures **data sent from the Realtime server to a connected client** over an open WebSocket connection, plus any request made to the [HTTP Broadcast endpoint](/docs/guides/realtime/broadcast#broadcasting-from-the-server). This includes Broadcast messages, Postgres Changes payloads, Presence events, and Phoenix protocol frames sent over the same socket (see below).

It does **not** include internal traffic between the Realtime server and your Postgres database (logical replication, `pgoutput` reads for Broadcast from Database, or replication slot management). That traffic never reaches a client and isn't part of this metric.

## Does it include only bytes delivered to connected clients, or also internal DB → Realtime replication traffic?

Only data the server sends to the WebSocket, and any HTTP Broadcast request. DB → Realtime logical replication traffic (the connection Realtime uses internally to read changes for Broadcast from Database or Postgres Changes) is not counted — it never leaves the Realtime service to reach a client, so it isn't part of Egress.

## Does it include replication slot initialization/recreation or Broadcast from database cold-start traffic?

No. Replication slot creation, checks, and reconnection attempts to your database are internal to the Realtime service and Postgres. Even if your tenant is frequently idling out and starting back up (for example, logs showing `Stop tenant ... because of no connected users` followed by slot recreation), that activity is not what's reflected in your billed Realtime Egress.

## Does it include Phoenix/WebSocket protocol overhead (handshake, heartbeat, phx_join, phx_leave, rejoin frames)?

Yes — any message the server sends over an open socket counts, including heartbeats and Phoenix control frames (`phx_reply`, `phx_close`, rejoin payloads). In practice this overhead is minimal compared to actual application data, **unless** a client is stuck in a join/leave loop (for example, a broken reconnect handler that repeatedly subscribes and unsubscribes from the same channel). Realtime tracks join rate internally, so a runaway rejoin loop is something worth ruling out if your numbers look unusually high relative to your connection count.

## Can repeated tenant stop/start or cold-start cycles cause large billed egress even when payload is small?

No. Tenant idling out (`no connected users`) and starting back up on the next connection is a normal part of the multi-tenant architecture and is not a mechanism that inflates Realtime Egress. If you're seeing a large gap between your application-measured payload and your billed egress, look at message volume and fan-out first (see below) rather than tenant lifecycle events.

## Is the dashboard graph batched or attributed in a way that could make one day look much higher than actual usage?

No known issue causes this. The daily Realtime Egress figure reflects real usage attributed to that day, not an artifact of how the graph is rendered or rolled up.

## Is a breakdown of Realtime Egress available by source or type (Broadcast / Postgres Changes / Presence / protocol overhead)?

Not currently. Realtime Egress is reported as a single aggregate number — there's no per-source or per-event-type breakdown available in the dashboard or usage APIs today.

## Measured message payload is tiny — why is billed Realtime Egress so much higher?

This is the most common source of confusion, and almost always comes down to **counting writes instead of counting delivered events**. A few things to check before assuming a billing issue:

1. **Delivered events ≠ database writes.** If you're using Postgres Changes or Broadcast from Database, the number of rows you insert/update is not the number of events sent over the wire. Every insert/update/delete can generate a delivery to **every subscribed client**, not one event total.
2. **Multiply by concurrent subscribers.** If 20 clients are subscribed to the same channel, a single database change can result in 20 separate deliveries. Always multiply your per-change payload size by your peak concurrent connection count to estimate real egress, not your raw write rate.
3. **Multiple subscriptions per channel compound this further.** If a channel subscribes to the same table with more than one filter (for example, separate `INSERT`, `UPDATE`, and `DELETE` subscriptions, or multiple overlapping `postgres_changes` filters), the same underlying row change can be delivered multiple times to the same client.
4. **Postgres Changes payloads are often bigger than you expect.** Unlike a hand-crafted Broadcast payload, a Postgres Changes event includes the full row (or full old + new row under `REPLICA IDENTITY FULL`), which can be several kilobytes even for a small logical change — especially with wide tables or TOASTed columns. You can reduce this by [filtering which changes are sent](/docs/guides/realtime/postgres-changes?queryGroups=language&language=js&queryGroups=realtime-js-filter&realtime-js-filter=string#available-filters) so irrelevant rows are never delivered, and by [selecting specific columns](/docs/guides/realtime/postgres-changes?queryGroups=language&language=js&queryGroups=realtime-js-filter&realtime-js-filter=string#selecting-specific-columns) to shrink the payload of the rows that are.

Before escalating a gap between measured payload and billed egress, re-derive your estimate using **delivered events**, not writes: `(events per day) × (average delivered payload size) × (average concurrent subscribers)`. This calculation frequently accounts for a gap that initially looks inexplicable. The [Realtime observability report](/dashboard/project/_/observability/realtime) can help here — it shows number of connected clients, payload size, and rate of joins for your project.

## What should be checked before contacting Supabase support about a Realtime Egress discrepancy?

- Re-calculate your expected egress using delivered events and fan-out (see above), not raw database write counts.
- Check whether any channel has multiple overlapping `postgres_changes` subscriptions that could cause duplicate delivery.
- Check your peak concurrent connections over the period in question — a small increase in concurrency can multiply Broadcast/Postgres Changes egress significantly.
- Rule out a client-side reconnect loop (rapid `phx_join`/`phx_leave` cycles) as a source of excess protocol overhead.
- If your recalculated estimate still doesn't come close to your billed number, [reach out to Support](/dashboard/support/new) with your project ref, the time period in question, and your delivered-event calculation so the team can investigate further.

## Related guides

- [Understanding your usage](/docs/guides/platform/manage-your-usage)
- [Egress FAQ](/docs/guides/platform/manage-your-usage/egress)
- [Realtime Broadcast](/docs/guides/realtime/broadcast)
- [Realtime Postgres Changes](/docs/guides/realtime/postgres-changes)
