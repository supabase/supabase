---
id: about
title: About
---

## What it is

@todo

## What it isn't

@todo

## How it works 

At its core, Supabase is an elixir server that allows you to listen to PostgreSQL inserts/updates/deletes over websockets.

Realtime listens to PostgreSQL's built-in replication functionality and converts the byte stream into JSON. It then broadcasts the JSON over websockets. It is built with Phoenix, an Elixir framework that's incredibly scalable. 

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