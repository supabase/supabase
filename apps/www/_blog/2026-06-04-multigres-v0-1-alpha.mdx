---
title: 'Multigres v0.1 Alpha: an operating system for Postgres'
description: "Today we're releasing Multigres v0.1 alpha to the open source community, bringing Vitess-grade horizontal scaling, high availability, and operational simplicity to Postgres."
author: sugu_sougoumarane
imgSocial: '2026-06-01-multigres-v0-1-alpha/og.jpg'
imgThumb: '2026-06-01-multigres-v0-1-alpha/thumb.jpg'
categories:
  - product
  - postgres
tags:
  - postgres
date: '2026-06-04'
toc_depth: 3
---

Today we're releasing [Multigres v0.1 alpha](https://github.com/multigres/multigres/releases/tag/v0.1.0) to the open source community, the first public milestone of our mission to bring Vitess-grade horizontal scaling, high availability, and operational simplicity to Postgres. It's early, it's alpha, and we're excited to get it into your hands.

This is an open-source-only release. Multigres for Supabase is coming soon.

## What is Multigres?

Multigres is a scalable operating system for Postgres: it holistically manages your Postgres instances and gives you sharding, connection pooling, automatic failover, and backup orchestration.

Postgres at scale is operationally complex: You need to manage read replicas, failovers, connection limits, backups, and more. Multigres handles these chores as a single cohesive system. And when the time comes to scale, Multigres will help you shard your database and scale it horizontally.

The v0.1 alpha introduces advanced connection pooling, automatic failovers, and a Kubernetes operator for deployment.

## The Multigres Operator

The Kubernetes Multigres Operator allows you to deploy and manage Multigres clusters on Kubernetes. To [get started](https://multigres.com/blog/deploying-the-multigres-operator), you need a Kubernetes cluster along with a location for backups configured. The backups can be a shared file system or a cloud storage bucket like AWS S3. It is also possible to run Multigres on a local Kind cluster.

All the necessary images for running Multigres are publicly available.

## High Availability

Multigres treats HA as a consensus problem, and is capable of resolving split-brain scenarios without losing commits that have succeeded. The protocol implemented by Multigres is based on generalized consensus, a model that gives you flexibilities that do not exist in traditional consensus-based systems:

- **Built on top of Postgres replication**: The protocol uses unmodified Postgres replication, and yet satisfies all the strict consistency requirements of a consensus-based system.
- **User-defined durability policies**: You can define arbitrarily complex durability policies. This flexibility allows you to specify the failures you are willing to tolerate without being constrained by restrictive rules like a majority quorum. For example, if you'd like your data to survive the failure of a single AZ, you can set your durability policy to be cross-zone, but still have standbys deployed in more than three zones.
- **Add or remove replicas without affecting performance**: You can safely scale replicas up and down while the cluster is running. Multigres will continue to honor the durability policy you've configured without affecting performance, while also maintaining correctness.

For more information on HA, you may read the following posts:

- [High availability from first principles](https://multigres.com/blog/high-availability-from-first-principles)
- [Handling edge cases using consensus](https://multigres.com/blog/handling-edge-cases-using-consensus)

## Connection Pooling

Multigres ships its own connection pooling solution using a two-service architecture. It consists of a **multigateway** that accepts client connections and routes queries, and a **multipooler** that manages backend connections. This architecture provides some distinct advantages over a single-process pooler.

- **Traffic routing**: The integration with the HA system allows multigateway to transparently route connections to the current primary. During a failover, multigateway can hold requests until a new primary is promoted, thereby minimizing errors. Additionally, you can balance read load across multiple replicas. In the future, multigateway will handle routing of traffic to different shards.
- **Context-aware pooling**: Multigres does not require you to [choose a pooling mode](https://multigres.com/blog/pooling-without-choosing-a-mode) like transaction, session, etc. This is because it has a built-in parser and understands the effects of each request. This allows it to track connection state and reuse them wherever applicable. If a request requires a stateful connection, like a transaction, the connection gets pinned to that client until the stateful requirement is satisfied.
- **Per-user pools**: Multigres maintains a separate [connection pool per user](https://multigres.com/blog/per-user-pools-that-share-fairly) with no shared pool and no `SET ROLE` impersonation. A fair-share algorithm splits a fixed connection budget across users, and pool routing is kept fast.
- **Prepared statement consolidation**: Multigres deduplicates prepared statements across gateways. Postgres parses, plans, and caches a given statement once, no matter how many gateways are forwarding it.

For more information on connection pooling, you may read [Two jobs, two processes: why Multigres has its own connection pooler](https://multigres.com/blog/two-jobs-two-processes).

## Backups

Multigres uses pgBackRest for backups. Backups are taken from replicas to avoid overloading the primary.

- **Three backup types**: full backups copy the entire data directory at a checkpoint; incremental backups copy only files changed since the previous backup; differential backups copy changes since the last full backup. A typical schedule runs full backups periodically with more frequent incrementals or differentials in between.
- **On-demand and scheduled**: the CLI lets you list backups, trigger a manual backup, and initiate a restore. We'll soon add support for scheduled backups through the cluster spec.
- **Bootstrap**: During bootstrap, Multigres automatically identifies a primary, performs a backup, and uses it to initialize the other replicas. This workflow brings up a ready-to-run cluster without any manual intervention.

To learn more about how a cluster bootstraps, you may read [How a Multigres Cluster Bootstraps](https://multigres.com/blog/multigres-cluster-bootstrap).

## What alpha means

v0.1 is stable enough to experiment with and give feedback on. It is not yet ready for production workloads. Specific caveats:

- We have [known issues](https://github.com/multigres/multigres/issues) that still need to be addressed.
- Sharding (the eventual flagship feature) is not in this release. v0.1 is a single-shard cluster with HA and pooling.
- Future releases are not guaranteed to be backward compatible.
- The CR API is not yet stable. Fields may change before v1.0.
- Performance benchmarks are in progress. We'll publish numbers in a follow-up post.

## Try Multigres

1. **[Deploy your first cluster](https://multigres.com/blog/deploying-the-multigres-operator)**: a minimal CR that stands up a 3-node HA cluster.
2. **Join the community**: file issues and request features at [github.com/multigres/multigres](https://github.com/multigres/multigres). Post your thoughts in [github.com/multigres/multigres/discussions](https://github.com/multigres/multigres/discussions) to discuss features and get help.
