Answers to frequently asked questions.

## What happens when I hit my connection limit?

The connection (or client) limit is set by the `default_max_clients` on the
`tenant` record or `max_clients` on the `user`.

Say your connection limit is 1000. When you try to connect client number 1001
this client will receive the error `Max client connections reached` which will
be returned as a Postgres error to your client in the wire protocol and
subsequently should show up in your exception monitoring software.

## Does Supavisor support prepared statements?

It supports prepared statements in session mode. In transaction mode, named
prepared statements are supported when the `named_prepared_statements`
feature flag is enabled, either globally with the
`NAMED_PREPARED_STATEMENTS_ENABLED` environment variable or per tenant via
`feature_flags`.

## Why do you route connections to a single Supavisor node when deployed as a cluster?

Supavisor can run as a cluster of nodes for high availability. The first node to
receive a connection from a tenant spins up the connection pool on that node.
Connections coming in to other nodes will route data do the owner node of the
tenant pool.

We could run one pool per node and divide the database connection pool by N
nodes but then we'd have to keep connection counts to the database in sync
across all nodes. While not impossible at all, there could be some delay here
temporarily causing more connections to the database than we want.

By running one pool on one node in a cluster for a tenant we can guarantee that
the amount of connections to the database will be the `default_pool_size` set on
the tenant.

Also running N pools on N nodes for N clients will not scale horizontally as
well because all nodes will be doing all the same work of issuing database
connections to clients. While not a lot of overhead, at some point this won't
scale and we'd have to run multiple independent clusters and route tenants to
clusters to scale horizontally.
