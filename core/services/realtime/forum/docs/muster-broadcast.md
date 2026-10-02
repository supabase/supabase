# Broadcasting through Muster's router node

`Forum.Muster` answers one question: *given a group, which nodes hold local
members of it?*, and lets you route a fan-out broadcast precisely instead of
blasting every node in the cluster.

The key thing to internalize: **Muster owns the routing decision, you supply the
transport.** Muster never sends your message for you. It gives you three
primitives, and you wire them together with whatever transport you like
(`:erpc`, the built-in `Forum.Adapter.ErlDist`, Phoenix.PubSub, HTTP, …):

| Primitive | Where you run it | What it gives you |
| --- | --- | --- |
| `Forum.Muster.router(scope, group)` | anywhere | the single **router node** for the group (or, mid-rebalance, every member) |
| `Forum.Muster.targets(scope, group, sender_view_hash)` | on the **router node** | `{:ok, source_nodes}` from the occupancy table, or `{:error, :flood}` when the table can't be trusted |
| `Forum.Muster.local_members(scope, group)` | on a **source node** | the local **pids** to deliver to |

A broadcast is therefore a caller-wired, 3-hop flow: *caller → router → source
nodes → local pids.*

---

## 1. The router node and its occupancy table

For each group, exactly one node is the **router**, chosen by consistent hashing
([`ex_hash_ring`](https://hexdocs.pm/ex_hash_ring)) over the sorted member list.
Every node computes the same router independently from the same ring: no
consensus, the member list is the only input. The router owns an occupancy table
keyed by `{group, source_node}`: the authoritative set of nodes a broadcast for
that group must reach.

```mermaid
flowchart TB
    subgraph Ring["ExHashRing (identical on every node, members [A, B, C])"]
        direction LR
        G1["group :topic_1"] --> R1{{"consistent hash → Node B"}}
        G2["group :topic_2"] --> R2{{"consistent hash → Node C"}}
    end

    R1 --> RB
    R2 --> RC

    subgraph RB["Node B: router for :topic_1"]
        OB["occupancy table<br/>{:topic_1, A}<br/>{:topic_1, C}"]
    end
    subgraph RC["Node C: router for :topic_2"]
        OC["occupancy table<br/>{:topic_2, A}"]
    end
```

The table is maintained for you: when the first local member of a group joins on
node A, A sends a synchronous `:occupied` notification to the router; when the
last leaves (after a cooldown), a periodic flush sends a batched `:vacant_batch`.
See the README for the join/leave and rebalance details.

You don't read the table directly. `targets/3` does it for you, and only after
checking a **readiness barrier**: a broadcast carries the sender's cluster-view
hash, and the router returns `{:ok, source_nodes}` only when it is `:ready` and
agrees with the sender about membership (so its table is provably complete).
Otherwise it returns `{:error, :flood}`, and you fan out to everyone your
transport knows (e.g. every node in the region), trading a brief burst of extra
traffic for never missing a holder while the cluster view settles. See the
README's *Router-readiness barrier* for why this is needed even when `router/2`
says the cluster is stable. That same fallback applies right after a coordinator
restart: the scope stays not-ready until discovery / rebalance converges or the
bounded singleton-promotion timeout fires.

---

## 2. Picking the target: `router/2`

Before broadcasting, ask `router/2` for the group's router. It reads a small
`persistent_term` status flag and either returns a single node (settled cluster)
or signals that the cluster view is in flux and you should fan out to everyone.

```mermaid
flowchart TD
    A["Forum.Muster.router(scope, group)"] --> B{"{Forum.Muster, scope, :status}"}
    B -->|":converging or :ready"| C["ExHashRing.Ring.find_node(ring, group)"]
    C --> D["{:ok, router_node}<br/>route to ONE node"]
    B -->|":rebalancing"| E["ExHashRing.Ring.get_nodes(ring)"]
    E --> F["{:rebalancing, members}<br/>fan out to EVERY member"]
```

The `:rebalancing` branch is what keeps broadcasts correct while membership
changes: rather than risk routing to a node that just stopped being the router,
the caller temporarily broadcasts to all members. The window is short because
consistent hashing only remaps ~1/N of groups per node change.

---

## 3. The end-to-end broadcast

Putting it together. On a settled cluster (`:converging` or `:ready`) you take
the cheap single-router path; during a rebalance you fan out to all members. In
both cases delivery to actual pids happens *on the node that owns them*: pids
never leave their node.

```mermaid
sequenceDiagram
    autonumber
    participant Caller
    participant Router as Router node (B)<br/>Forum.Muster
    participant Src as Source node (A)
    participant Pid as Local pids (on A)

    Caller->>Caller: Forum.Muster.router(scope, group)

    alt status == :converging or :ready → {:ok, router_node}
        Caller->>Router: deliver fan-out request + sender view_hash (your transport, e.g. :erpc)
        Router->>Router: Forum.Muster.targets(scope, group, view_hash)<br/>→ {:ok, [A, C, …]} or {:error, :flood}
        Router-->>Src: forward message to each target node (your transport)
        Src->>Src: Forum.Muster.local_members(scope, group) → [pids]
        Src->>Pid: send(pid, message) for each local pid
    else status == :rebalancing → {:rebalancing, members}
        Caller->>Src: fan out to EVERY member
        Src->>Src: Forum.Muster.local_members(scope, group) → [pids]
        Src->>Pid: send(pid, message) for each local pid
    end
```

### Why this shape

- **Precision.** On the stable path the caller contacts exactly one router, and
  the router contacts exactly the source nodes that have members, not the whole
  cluster.
- **Locality.** Only the node that owns a pid ever sends to it, so delivery
  scales with where members actually live.
- **Safety during change.** The `:rebalancing` fan-out trades a brief burst of
  extra traffic for never missing a node whose router assignment is mid-flight.

### Graceful shutdown

A router that is about to leave the cluster must not simply vanish: a peer that
still hashes a group to it would fire an `:occupied` claim (or route a broadcast)
to a corpse and silently lose it. `Forum.Muster.drain/2` evacuates the router
role *before* death — peers rebalance the leaver out of their rings and
re-announce the groups they hold to the newly-elected routers while the leaver is
still alive to service in-flight RPCs. During the drain the leaver stays a
responsive router but never a *deciding* one: it publishes `:rebalancing`, so
`targets/3` on it answers `{:error, :flood}` throughout (including a mandatory
settle window for broadcasts already in flight to it), because from the first
peer's eviction its occupancy table is no longer maintained. It stops advertising
itself, and `join/3` on it returns `{:error, :draining}`. See the *Graceful
shutdown / draining* section in the top-level [`README.md`](../README.md).

See the top-level [`README.md`](../README.md) for the join, leave/cooldown,
rebalance, and failure-handling details that keep the occupancy table accurate.
