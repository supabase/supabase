---
id: about
title: About
---

## What it is

Supabase is a service to:

- listen to changes to your PostgreSQL database 
- query your tables, including filtering, pagination, and deeply nested relationships (just like GraphQL)
- create, update, and delete rows

It does all of this without you having to write a single line of code.

## What it isn't

@todo

## How it works 

At its core, Supabase is an Elixir server that allows you to listen to PostgreSQL inserts, updates, and deletes using websockets. Supabase list to PostgreSQL's built-in replication functionality, converts the replication byte stream into JSON, then broadcasts the JSON over websockets. 

It is built with Phoenix, an Elixir framework that's incredibly scalable. 

For all Restful functionality, we introspect your database to provide an out-of-the-box, fully functional API.

## Features

- 100% open source under the Apache 2.0 License
- Accessible by mobile and web
- Works without wal2json :)

## Benefits

-  You own your data. Realtime can be pointed at any PostgreSQL database that has replication enabled.
- Listening to data changes on client side solves stale data problems and update collisions.
- Many systems that give you realtime functionality require you to update via the same interface that the listener is on. Supabase is source agnostic. Update your database from anywhere and you'll still get the changes.
- Scale the realtime servers without putting any additional load on your DB. All you need is one connection to your database, and you can handle thousands (or millions) or users

## Use cases

- Build chat apps and other systems that require realtime functionality.

## Where it is

All code is hosted at [https://github.com/supabase/realtime](https://github.com/supabase/realtime).