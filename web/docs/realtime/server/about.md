---
id: about
title: About
description: 'Host your own Realtime server'
---

## Introduction

The easiest way to get started with Realtime is to sign up to our [Alpha](https://app.supabase.io).

If you want to host your own Realtime server, this document will help you to get set up. You have options to host using Docker, AWS, DigitalOcean, or build from source.

## Prerequisites

- Postgres 10+
- Environment variables to set:
  - `DB_HOST`: defaults to `localhost`
  - `DB_NAME`: defaults to `postgres`
  - `DB_USER`: defaults to `postgres`
  - `DB_PASSWORD`: defaults to `postgres`
  - `DB_PORT`: defaults to `5432`

## Setting Up Replication

For us to receive the streaming data, we need the database to have a free replication slot:

```sql
-- set the replication to "logical"
ALTER SYSTEM SET wal_level = logical;
-- We need at least one replication slot to subscribe to
ALTER SYSTEM SET max_replication_slots = 5;
-- Set up the publication for us to listen to
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
```

### Optional

If you want to receive the old record (previous values) on `UPDATE` and `DELETE`, you can set the `REPLICA IDENTITY` to `FULL` like this:

```sql
ALTER TABLE your_table REPLICA IDENTITY FULL;
```

This has to be set for each table.
