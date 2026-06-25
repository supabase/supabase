---
title: 'NoSQL Postgres: Add MongoDB compatibility to your Supabase projects with FerretDB'
description: 'NoSQL Postgres: Add MongoDB compatibility to your Supabase projects with FerretDB'
author: thor_schaeff
imgSocial: getting-started/ferretdb/ferretdb.jpg
imgThumb: getting-started/ferretdb/ferretdb.jpg
categories:
  - engineering
tags:
  - postgres
  - developers
  - mongodb
date: '2024-01-31'
toc_depth: 3
---

[FerretDB](https://www.ferretdb.com/) is an open source document database that adds MongoDB compatibility to other database backends, such as [Postgres](https://www.postgresql.org/) and [SQLite](https://www.sqlite.org/).
By using FerretDB, developers can [access familiar MongoDB features and tools using the same syntax and commands](https://blog.ferretdb.io/mongodb-crud-operations-with-ferretdb/) for many of their use cases.

In this post, we'll start from scratch, running FerretDB locally via Docker, trying out the connection with `mongosh` and the MongoDB Node.js client, and finally deploy FerretDB to [Fly.io](https://fly.io/) for a production ready set up.

If you prefer video guide, you can follow along below. And make sure to subscribe to the [Supabase YouTube channel](https://www.youtube.com/channel/UCNTVzV1InxHV-YR0fSajqPQ?view_as=subscriber&sub_confirmation=1)!

<div className="video-container">
  <iframe
    className="w-full"
    src="https://www.youtube-nocookie.com/embed/8EKi2dV51TY"
    title="YouTube video player"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  />
</div>

## Prerequisites

- A Supabase project. Create yours here: [database.new](https://database.new).
- [Docker](https://www.docker.com/) or [Orbstack](https://orbstack.dev/).
- [Optional] A [Fly.io](https://fly.io/) account for production deployment.

## Run FerretDB locally with Docker

FerretDB provides a [Docker image](https://github.com/ferretdb/FerretDB/pkgs/container/ferretdb) allowing us to run it locally, for example via [Orbstack](https://orbstack.dev/), with a couple simple commands.

FerretDB only requires the Postgres database URI to be provided as the `FERRETDB_POSTGRESQL_URL` environment variable. Every Supabase project comes with a full Postgres database. You can find the connection URI string in your [Supabase Dashboard](https://supabase.com/dashboard/project/_/database/settings).

Make sure **Use connection pooling** is checked and **Session mode** is selected. Then copy the URI. Replace the password placeholder with your saved database password.

<Admonition type="tip">

If your network supports IPv6 connections, you can also use the direct connection string. Uncheck **Use connection pooling** and copy the new URI.

</Admonition>

```bash Terminal
# Set the required environment variables
export DB_USER=postgres
export DB_PASSWORD=<your db password>
export SUPA_PROJECT_REF=<your Supabase project ref>
export SUPA_REGION=<your project region>
export DB_URL=postgres://$DB_USER.$SUPA_PROJECT_REF:$DB_PASSWORD@$SUPA_REGION.pooler.supabase.com:5432/postgres

# Run FerretDB in docker container
docker run -p 27017:27017 -p 8080:8080 -e FERRETDB_POSTGRESQL_URL=$DB_URL ghcr.io/ferretdb/ferretdb
```

FerretDB runs on the default MongoDB port `27017` and also spins up some monitoring tools on port `8080`. Once up and running you can access these at [localhost:8080](http://localhost:8080).

Once up and running, constructing the MongoDB URI is easil:

```bash Terminal
export MONGODB_URL=mongodb://$DB_USER.$SUPA_PROJECT_REF:$DB_PASSWORD@127.0.0.1:27017/ferretdb?authMechanism=PLAIN
```

## Test with `mongosh`

If you have MongoDB installed locally on your machine, you can test via `mongosh`, the MongoDB shell.

```bash Terminal
mongosh '$MONGODB_URL'
```

If you don't have MongoDB installed locally, you can run the shell via a Docker container:

```bash Terminal
docker run --rm -it --entrypoint=mongosh mongo \
 "$MONGODB_URL"
```

### Insert documents into FerretDB

With `mongosh` running, let's try to insert some documents into our FerretDB instance.
You are going to insert two footballer data into a `players` collection.

```json5 ferretdb>
db.players.insertMany([
   {
       futbin_id: 3,
       player_name: "Giggs",
       player_extended_name: "Ryan Giggs",
       quality: "Gold - Rare",
       overall: 92,
       nationality: "Wales",
       position: "LM",
       pace: 90,
       dribbling: 91,
       shooting: 80,
       passing: 90,
       defending: 44,
       physicality: 67
   },
   {
       futbin_id: 4,
       player_name: "Scholes",
       player_extended_name: "Paul Scholes",
       quality: "Gold - Rare",
       overall: 91,
       nationality: "England",
       position: "CM",
       pace: 72,
       dribbling: 80,
       shooting: 87,
       passing: 91,
       defending: 64,
       physicality: 82,
       base_id: 246
   }
]);
```

Great!
Now when you run `db.players.find()`, it should return all the documents stored in the collection.

### Update document record in FerretDB

Next, you need to update "Giggs" record to reflect his current position as a `CM`.
To do this, we can just run an `updateOne` command to target just that particular player:

```json5 ferretdb>
db.players.updateOne(
    { player_name: "Giggs" },
    { $set: { position: "CM" } }
);
```

Let's query the collection to see if the changes have been made:

```json5 ferretdb>
db.players.find({player_name: "Giggs"})
```

You can run many MongoDB operations on FerretDB. See the [list of supported commands](https://docs.ferretdb.io/reference/supported-commands/) in the FerretDB documentation for more.

## Inspect the JSONB data in the Supabase Dashboard

FerretDB stores each collection in a table on the `ferretdb` schema, each document represented by a JSONB entry. You can inspect this in the [Table Editor](https://supabase.com/dashboard/project/_/editor) in your Supabase Dashboard.

![Supabase Dashboard Table Editor Screenshot](/images/blog/getting-started/ferretdb/table-editor.png)

## Deploy to Fly.io

For production use cases, you can easily deploy FerretDB on Fly. Simply create a `fly.toml` file (make sure to [update `primary_region`](https://fly.io/docs/reference/regions/))

```toml fly.toml
app = "supa-ferretdb-<your-supabase-project-ref>"
primary_region = "bos"

[build]
  image = "ghcr.io/ferretdb/ferretdb"

[[services]]
  internal_port = 27017
  protocol = "tcp"

  [[services.ports]]
    port = "27017"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 1024
```

And follow these [flyctl](https://fly.io/docs/hands-on/install-flyctl/) commands:

- fly launch --no-deploy
  - An existing fly.toml file was found for app supa-ferretdb?
  - Would you like to copy its configuration to the new app? (y/N) > y
- fly secrets set FERRETDB_POSTGRESQL_URL=$DB_URL
- fly deploy
- fly ips allocate-v4
  - Note: this is a paid feature! You can test it for free as long as you [release the dedicated IPv4](https://community.fly.io/t/we-are-going-to-start-charging-for-dedicated-ipv4-in-january-1st/15970#how-not-to-be-billed-2) before the end of the billing period!

Now simply replace `127.0.0.1` in the `MONGODB_URL` with your dedicated IPv4 address and you're ready to roll!

## Conclusion

FerretDB allows you to run MongoDB workloads on Postgres and SQLite. This flexibility means you can easily add MongoDB compatibility to your Supabase projects, while avoiding vendor lock-in and retaining control of your data architecture.

To get started with FerretDB, check out the [FerretDB quickstart guide](https://docs.ferretdb.io/quickstart-guide/).

## More Supabase

- [Migration guides](/docs/guides/resources#migrate-to-supabase)
- [Options for connecting to your Postgres database](/docs/guides/database/connecting-to-postgres)
