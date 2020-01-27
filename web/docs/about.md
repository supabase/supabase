---
id: about
title: About
description: 'What is Supabase?'
---

## What it is

Supabase is a service to:

- listen to changes to your PostgreSQL database 
- query your tables, including filtering, pagination, and deeply nested relationships (just like GraphQL)
- create, update, and delete rows

It does all of this without you having to write a single line of code.

## What it isn't

- An ORM, at least not like typical ORMs. Supabase is more like an API, since we don't require you to set up any mappings and we interact with your database through a derived schema that get from introspecting your database.

## How it works 

At its core, Supabase is an Elixir server that allows you to listen to PostgreSQL inserts, updates, and deletes using websockets. Supabase listens to Postgres' built-in replication functionality, converts the replication byte stream into JSON, then broadcasts the JSON over websockets. 

For all Restful functionality, we introspect your database to provide an instant, fully functional API.

## Features

- Fast. Performance and simplicity are our two most important features.
- 100% open source under the Apache 2.0 License.
- Accessible by mobile and web with simple client libraries.
- Works without any major changes to your database (like adding `NOTIFY` functions) or additional plugins (like `wal2json`). By using PostgreSQL's replication functionality we overcome many of their limitations. For example, `NOTIFY` has a 8000 byte payload limit, making it hard to listen to bulk changes.

## Benefits

- You own your data. Realtime can be pointed at any PostgreSQL database that has replication enabled.
- Listening to data changes on client side solves stale data problems and update collisions.
- Many systems that give you realtime functionality require you to update via the same interface that the listener is on. Supabase is source agnostic. Update your database from anywhere and you'll still get the changes.
- Scale the realtime servers without putting any additional load on your DB. All you need is one connection to your database, and you can handle thousands (or millions) or users

## Where it is

All code is hosted on [our GitHub org](https://github.com/supabase).