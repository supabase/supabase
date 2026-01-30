---
title: 'pg_crdt - an experimental CRDT extension for Postgres'
description: 'Embedding Yjs and Automerge into Postgres for collaborative applications.'
author: paul_copplestone
imgSocial: launch-week-6/crdt/og-pg-crdt.png
imgThumb: launch-week-6/crdt/og-pg-crdt.png
categories:
  - postgres
tags:
  - launch-week
  - postgres
  - planetpg
date: '2022-12-10'
toc_depth: 2
---

Today we're open-sourcing an EXPERIMENTAL extension for CRDTs, `pg_crdt`. The GitHub repo is [here](https://github.com/supabase/pg_crdt). There are [instructions](https://github.com/supabase/pg_crdt#installation) for running it locally in the README.

When we released the new [multiplayer features](/blog/supabase-realtime-multiplayer-general-availability) for our Realtime engine,
it took 30 minutes for someone to ask if we'd add CRDT support.

> _Anyone from Supabase here, do you have any plans to build in support for CRDT toolkits such as Yjs or AutoMerge for these features? It would make working with them so much easier if there was a plug and play backend._

<small>
  <i>@samwillis on [HackerNews](https://news.ycombinator.com/item?id=32510820)</i>
</small>

pg_crdt has not been released onto the Supabase platform (and it may never be). We're considering many options for offline-sync/support and, while CRDTs will undoubtedly factor in, we're not sure if this is the right approach. Hopefully this release generates a healthy discussion about the various ways we can do it at Supabase.

## What's a CRDT?

A CRDT (Conflict-free Replicated Data Type) is a data structure. More accurately, a family of data structures. They enable collaborative apps like [Figma](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/).

You already know what a “data structure” is: an Array is a good example. CRDTs are a _special_ type of data structure designed to solve a specific problem: they can merge changes in a way that the final state of the data will be the same, no matter the order in which the updates were applied.

In simple terms, a CRDT allows multiple users to make changes to the same data without the need for a central authority to coordinate their actions.

Let's use our Array example to demonstrate the problem they solve. Imagine you have an array (which is not a CRDT):

```jsx
let fruit = ['Apple', 'Banana', 'Orange']
```

Now imagine you have 2 developers updating this array on their local computers. They both want to replace the fruit at the start of the array. The first user, let's call her “Jenny”, does this:

```js
fruit[0] = 'Grape' // the array is ['Grape', 'Banana', 'Orange']
```

The developer sitting next to her, let's call him “Jonny”, does the same:

```js
fruit[0] = 'Mango' // the array is ['Mango', 'Banana', 'Orange']
```

And now, since they are both developing on different machines, they push their changes to a remote server. When the updates land on the remote system, what will `fruit[0]` be? “Grape” or “Mango”?

![Array - which will be saved?](/images/blog/crdt/array.png)

Since this is one of those _basic_ arrays, the answer is "the fruit array that arrives last”.

1. If Jonny's fruit array arrives first, it will be saved.
2. After that, Jenny's fruit arrived and overwrites Jonny's changes.

But therein lies the problem: Jonny was the last developer to change his array of fruit, shouldn't his changes be the ones that are saved?

That's one of the things that CRDTs solve. There is an “array CRDT” which, when merged, will always have the same result. It doesn't matter if Jonny's array arrives first, or if Jenny's arrives first - every time you merge them they would be able to determine that the Jonny's was the last change the fruit array.

How does it do that? Some sort of algorithm, but you can ask ChatGPT to explain that one.

## Offline philosophy

Collaborative apps are becoming more prolific as legacy software is rebuilt within a browser environment.

Collaboration is largely a data problem - how do we get one user's changes (data) to merge with another user's changes (data)? As a database provider it's natural fit for Supabase to provide the tooling for developers to build collaborative apps.

Before going too far down the “solution” rabbit hole at Supabase, we try to think about the long-term implications of adopting any technology. We're pretty boring - we don't make bets on technologies unless we think they will exist in 20 years.

I personally believe CRDTs are the future. For _some things_. If databases were invented today, I'm certain most of the effort would be spent developing CRDT databases or something with “offline algorithms” built-in. But tech is a real-world demonstration of the Lindy effect: the longer something has existed, the longer it's likely to exist in the future. That's why we bet on Postgres - with more than 30 years history, it's here to stay.

Faced with this reality, we should consider how to solve _offline with Postgres_ and where CRDTs might fit into that picture.

For a long time I thought there could be a way to shoehorn Postgres row-level data into a CRDT, to give _truly_ offline support. This may even still be [possible](https://electric-sql.com/), and it's one of the ideas we'll continue to pursue. But Postgres is a rich and evolving ecosystem, and I don't know whether it will be possible to -

a) find a merge strategy for an entire row, while simultaneously:

b) finding a merge strategy for every data type _within_ that row (especially with the number of data types available through extensions)

It's possible that developers will need to be selective about their “level” of offline support, at least if they plan to use an “incumbent” databases. For the cases, a simple “last write wins” strategy is probably acceptable (see the excellent [Replicache](https://doc.replicache.dev/examples/repliear) and [Watermelon](https://nozbe.github.io/WatermelonDB/) libraries), but there will be important pieces of their application where it is not.

Take this table of blog posts as an example:

```sql
create table posts (
  id serial primary key,
  title text,
  content text default ''
);
```

Perhaps it's not that important if the `title` has a “last write wins” strategy, because it's rarely updated and less likely to have a merge conflict. But it is critical to use a smarter algorithm for the `content` of the blog post, especially in a team where multiple users are editing a blog post at the same time.

That's a lot of background to get to what you probably want to know about:

## Postgres CRDT extension

`pg_crdt` is an extension which adds CRDT support to Postgres as a data type. For example, using our table from above:

```sql
create table posts (
  id serial primary key,
  title text,
  content crdt.ydoc default crdt.new_ydoc()
);
```

The `content` column is now a [Yjs Doc](https://docs.yjs.dev/api/y.doc). Updates to this column are _commutative_ and _idempotent_. This means that they can be applied in any order and multiple times, and the result will always be the same. Two people can edit the blog content at the same time, and they won't have any issues when their changes are saved in the database.

### Support for Yjs, Automerge, and beyond

The Yjs and Automerge teams have done some excellent work to create Rust libraries for their CRDTs implementations. It was relatively trivial to wrap the libraries into a Postgres extension using the [pgx](https://github.com/tcdi/pgx) framework.

At this stage it makes sense to give developers as many choices as possible in one extension. The CRDT space is nascent the algorithms are rapidly changing.

Importantly, both Yjs and Automerge have _JavaScript_ and Rust implementations, which means they work natively in both a browser and a Postgres environment. Since collaborative applications are largely a client-side problem, CRDTs are more useful for developers if they have robust JavaScript libraries. In the future, if this extension becomes the approach we take, then Supabase will focus some resources on building Yjs/Automerge libraries for mobile devices too (Swift for iOS, Kotlin for Android).

## Why not build this into Realtime?

An alternative approach for CRDT support in Supabase is to build support directly into [Realtime](https://github.com/supabase/realtime) and use it as an Authoritative server. In this scenario, Realtime would serialize the CRDT and save it to Postgres (probably as a `bytea` data type). Yjs has the concept of [Providers](https://github.com/yjs/yjs#providers) which would facilitate this. You can see the difference between the approaches in the diagram below - on the left, Realtime acts as the “middleman” for saving the CRDT in the database, whereas on the right the CRDT is pushed directly to the database, and Realtime receives updates from Postgres. (Note also that clients can send peer-to-peer updates.)

![Realtime as an authority](/images/blog/crdt/authority.png)

This might still be our best option, but it should not be our first attempt. If we make Realtime the authority, it strongly couples developers to the Supabase infrastructure. By placing the CRDT into the database, it simplifies the architecture, enables other tools (like Debezium), and provides the possibility to update the database directly (for semi-realtime events like counters or page-views).

![External providers](/images/blog/crdt/semi-realtime.png)

The Realtime engine seems like a great _compliment_ for `pg_crdt`, but before we put it into production we need to solve a few (major) limitations.

## Limitations

These are a few of the _known_ limitations:

- Realtime broadcasts database changes from the Postgres write ahead log (WAL). The WAL includes a complete copy of the underlying data so small updates cause the entire document to broadcast to all collaborators
- Frequently updated CRDTs produce a lot of WAL and dead tuples
- Large CRDT types in Postgres generate significant serialization/deserialization overhead on-update.

We're likely to discover more (no doubt from a few friendly HN comments).

## Next steps

If you want to help with `pg_crdt` the best way is to get involved in the GitHub repo. We have enabled [Discussions](https://github.com/supabase/pg_crdt/discussions) for any and all ideas. If you have experience with CRDTs and you like this approach, don't hesitate to contact one of the team.

## More Launch Week 6

- [Day 1: New Supabase Docs, built with Next.js](https://supabase.com/blog/new-supabase-docs-built-with-nextjs)
- [Day 2: Supabase Storage v2: Image resizing and Smart CDN](https://supabase.com/blog/storage-image-resizing-smart-cdn)
- [Day 3: Multi-factor Authentication via Row Level Security Enforcement](https://supabase.com/blog/mfa-auth-via-rls)
- [Day 4: Supabase Wrappers, a Postgres FDW framework written in Rust](https://supabase.com/blog/postgres-foreign-data-wrappers-rust)
- [Day 5: Supabase Vault is now in Beta](https://supabase.com/blog/vault-now-in-beta)
- [Community Day](https://supabase.com/blog/launch-week-6-community-day)
- [Point in Time Recovery is now available](https://supabase.com/blog/postgres-point-in-time-recovery)
- [Custom Domain Names are now available](https://supabase.com/blog/custom-domain-names)
- [Wrap Up: everything we shipped](https://supabase.com/blog/launch-week-6-wrap-up)
