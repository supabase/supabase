---
title: Choosing a Postgres Primary Key
description: Turns out the question of which identifier to use as a Primary Key is complicated -- we're going to dive into some of the complexity and inherent trade-offs, and figure things out
author: victor
imgSocial: primary-keys/postgres-primary-key.jpg
imgThumb: primary-keys/postgres-primary-key.jpg
categories:
  - postgres
tags:
  - postgres
  - planetpg
date: '2022-09-08'
toc_depth: 3
---

Primary keys are important. They uniquely identify rows of data in tables, and make it easy to fetch data. The job of a database is to archive and recall data and you're going to have a hard time finding data without a good primary key or a good index.

Sometimes it makes sense to use a [“natural key”](https://en.wikipedia.org/wiki/Natural_key) (like an `email` column in a `users` table) and sometimes it's better to use a “[surrogate key”](https://en.wikipedia.org/wiki/Surrogate_key), a value made _for the purpose_ of identifying a row (and has no other meaning).

At first glance, the question of _which_ primary key to use is easy! Just throw a `integer`/`serial` on there, right? Numeric IDs are cool, but what about random value IDs or [Universally Unique IDentifiers (UUIDs)](https://en.wikipedia.org/wiki/Uuid)?

Turns out the question of which identifier (and in this case, UUID) to use is complicated -- we're going to dive into some of the complexity and inherent trade-offs, and figure things out:

- What are the choices for identifiers?
- If we choose to use/add UUIDs, which ones should we choose?
- How can we get these UUIDs into postgres?
- Which UUIDs perform best?

But first, a quick history lesson.

## A brief history of identifiers and why we use them

### `integer`/`biginteger`

Let's think about identifying rows of data from first principles. What's the first way you might think of identifying things? Assigning them numbers!

We can set up a table like this:

```sql
-- Let's enable access to case-insensitive text
CREATE EXTENSION IF NOT EXISTS citext;

-- Heres a basic users table
CREATE TABLE users (
  id integer PRIMARY KEY,
  email citext NOT NULL CHECK (LENGTH(email) < 255),
  name text NOT NULL
);

-- Let's assume we don't want two users with the exact same email
CREATE UNIQUE INDEX users_email_uniq ON users USING BTREE (email);
```

This looks great, but what should `id` be on new rows? I don't know -- maybe the application can figure it out? If they store some value in memory? That doesn't seem right.

Maybe we could figure out the next integer from what's in the table itself -- we just need to be able to "count" upwards. We _do_ have all the `users` tables rows in there, so we should be able to do it:

```sql
insert into users
  (id, email, name)
select count(*) + 1, 'new@example.com', 'new_user' from users;
```

After running that query, we can double check our results:

```sql
select * from users;
```

| id  | email              | name       |
| --- | ------------------ | ---------- |
| `1` | `new@example.com`  | `new user` |
| `2` | `new2@example.com` | `new user` |

Using `COUNT(*)` in our query is not the most efficient (or even easiest) solution though, and hopefully it's clear why -- **counting a sequence of numbers for primary keys is a feature built in to Postgres**!

[serial/bigserial](https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-SERIAL) is the right tool in our toolbox to maintain a shared, auto-incrementing sequence of numbers. Let's pretend we read the [postgres documentation](https://www.postgresql.org/docs) and use those instead.

### `serial`/`bigserial`

`serial` is essentially a convenient macro for using [Postgres sequences](https://www.postgresql.org/docs/current/sql-createsequence.html), a database-managed auto-incrementing stream of `integer`.

Let's hear it from the docs:

> The data types `smallserial`, `serial` and `bigserial` are not true types, but merely a notational convenience for creating unique identifier columns (similar to the `AUTO_INCREMENT` property supported by some other databases).

Using a `serial` column to create the `users` table would look like this:

```sql
create table users (
  id serial primary key,
  email citext not null check (length(email) < 255),
  name text not null
);
```

OK, now let's try inserting into it - we shouldn't have to specify `id`:

```sql
insert into users_serial
  (email, name)
values
  ('user@example.com', 'new user');
```

```sql
select * from users;
```

| id  | email              | name       |
| --- | ------------------ | ---------- |
| `1` | `user@example.com` | `new user` |

```sql
(1 row)
INSERT 0 1
```

It works, as you might expect - now the application doesn't have to _somehow magically know_ the right ID to use when inserting.

But what does `serial` actually do? Using a serial column is operationally similar to the following SQL:

```sql
CREATE SEQUENCE tablename_colname_seq AS integer;
CREATE TABLE tablename (
    colname integer NOT NULL DEFAULT nextval('tablename_colname_seq')
);
ALTER SEQUENCE tablename_colname_seq OWNED BY tablename.colname;
```

Back in application land, the `INSERT` statement returns, and provides the new `id` the database assigned our new row. Multiple application instances don't need to coordinate what ID to use -- they just _don't_, and find out from the database.

**We've taken a somewhat meandering path to get here, but this is the standard solution for most reasonable database schemas.**

### Why not stop at `serial`?

There are few issues with sequences:

- When writing automation that simply iterates through id values, note that `serial` columns can have gaps, even if you never `DELETE` (e.x. if an `INSERT` was rolled back — sequences live _outside_ transactions).
- When used from outside code `serial` may leak some data or give attackers an edge (e.x., if `yoursite.com/users/50` works, how about `yoursite.com/users/51`?).
- `serial` is PostgreSQL specific (i.e. not SQL standards compliant)

Don't be too put off by these reasons -- `serial` is still the go-to for most use-cases.

Even the last point about `serial` not being standards compliant is solved in Postgres 10+ by using...

### `integer`/`biginteger` (again!)

Postgres 10 [added support](https://www.postgresql.org/docs/10/release-10.html#id-1.11.6.26.5.7) for the `IDENTITY` column syntax in `CREATE TABLE` (EDB has a great writeup on the [addition](https://www.enterprisedb.com/blog/postgresql-10-identity-columns-explained)).

This means we can happily go back to using `integer`/`biginteger`:

```sql
CREATE TABLE (
  id integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  email citext NOT NULL CHECK (LENGTH(email) < 255),
  name text NOT NULL
)
```

So how does _this_ work? Postgres does the same thing under the covers -- it generates a `sequence`. As this syntax is standards compliant, it's generally recommended practice for DBAs going forward, for the sake of the realm.

**So `integer`s are great, but information leakage is still a problem. How do we fix that?** Well, make the numbers random, obviously.

### Random Numeric IDs

Let's say the application using the DB has some [Python](https://python.org) code like the following:

```python
from random import randrange
from models import User
MAX_RANDOM_USER_ID = 1_000_000_000
def create_user():
    """
    Add new user to the database
    """
    user_id = randrange(1, MAX_RANDOM_USER_ID)
    user = User(id=user_id, email="new@example.com", name="new user")
    db.save(user)
```

That _looks_ good, but there's a problem -- [random](https://docs.python.org/3/library/random.html) is a _pseudorandom_ generator.

[Pseudo-random](https://en.wikipedia.org/wiki/Pseudorandomness) numbers are _not_ what we want for ensuring user IDs cannot be easily guessed/collide. It's possible to get the exact same sequence of values out of a pseudo-random number generator by using the same _seed value_.

Sometimes you _want_ pseudo-random behavior (let's say for testing or fuzzing), but it's generally not desired for production systems that might run from a duplicated identical application image, since they _could_ have weak pseudo-random seed initialization.

### (Secure) Random Numeric IDs

**At the very least** we need a properly secure random numbers -- we need Python's [secrets](https://docs.python.org/3/library/secrets.html) module:

```python
from secrets import randbelow
# ...
def create_user():
    """
    Add new user to the database (using secure random numbers)
    """
    user_id = randbelow(1, MAX_RANDOM_USER_ID)
    user = User(id=user_id, email="new@example.com", name="new user")
    db.save(user)

```

Now we have a secure random value coming in for our user IDs. But having values like `583247` and `8923916` get generated are cool and all, but there are a few problems:

- These numbers are random _and_ quite inscrutable
- The keyspace is fairly small (maybe good for comments on a popular website, but not for IDs!)
- People can still _technically_ check them all (the guessing space is 1 to `MAX_RANDOM_USER_ID`!)

We need something better.

### (Secure) Random UUIDs

Along comes UUIDs -- you're probably used to seeing them now, values like this UUIDv4:

`468e8075-5815-4fe2-80d3-45a31827954b` .

They're _very_ random (almost always generated with secure random sources), and while they're even worse for remembering, they're near impossible to practically guess -- the search space is just too large!

More importantly, UUIDs introduce methodology to the madness -- different versions of UUID are derived different ways -- combined with other sources of randomness or known values.

There are a lot of [versions of UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier#Versions), but let's discuss the ones we're more likely to use/see day to day.

### UUIDv1

[Version 1 UUIDs](<https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_1_(date-time_and_MAC_address)>) have three two components:

- a 60 bit date-time (at nanosecond precision)
- a 48 bit [MAC address](https://en.wikipedia.org/wiki/MAC_address)

But where's the randomness? Well v1s assume that you _won't_ generate a ton of values in the same nanosecond (and there are some extra bits reserved for differentiating even when you do), but another source is the MAC address. MAC addresses uniquely (usually) identify network cards -- which is a security risk -- and those bits can be made random.

Here's what a UUIDv1 looks like:

```
a9957082-0b47-11ed-8a91-3cf011fe32f1
```

You can generate v1 UUIDs in Postgres natively thanks to the [uuid-ossp contrib module](https://www.postgresql.org/docs/current/uuid-ossp.html). Here's how to generate a v1 UUID with random MAC address:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION

SELECT uuid_generate_v1mc();

          uuid_generate_v1mc
--------------------------------------
 dd1bbf10-0b47-11ed-80de-db48f6faaf86

(1 row)
```

### UUIDv4

Version 4 UUIDs use _all_ the available bits for randomness -- _122 bits worth_!.

UUIDv4s look like this:

```
ce0b897d-03a0-4f54-8c97-41d29a325a23
```

These don't have a time component, but they don't have in time they make up for in randomness -- it is _very_ unlikely for them to collide, so they make for excellent Global Unique IDentifiers ("GUID"s).

We can generate them in Postgres like this (with `uuid-ossp`):

```sql
SELECT gen_random_uuid();

           uuid_generate_v4
--------------------------------------
 6ca93dde-81d4-4ea0-bfe1-92ecb4d81ee4

(1 row)
```

Since Postgres would catch a collision on a `PRIMARY KEY` or `UNIQUE INDEX` column, we're done right? If we want to generate UUIDs all we need to do is choose UUID v1 or V4, and we won't leak any schema structure information to the outside world, right?

This is a workable solution, but as you might expect, it's not that easy.

### The Post-UUIDv1/v4 era: A Cambrian explosion of identifiers

![thats-alot-of-uuids.png](/images/blog/primary-keys/uuids.png)

UUIDv1 and v4 were a start, but weren't enough for _many_ companies out there. There are a couple shortcomings that plague both v1 and v2:

- UUIDs are twice the size of `bigint`/`bigserial`
- UUIDv1s contain a time element but they're _not_ lexicographically sortable (this means they `SORT` terribly, relative to `integer` or a `timestamp` column)
- UUIDv1s are less random than UUIDv4, and can collide/overlap in close enough time intervals, at large scale
- UUIDv4s index _terribly_, as they're essentially random values (obviously, they `SORT` terribly as well)

Many of the world's biggest companies generated UUIDs at speeds that made all of these deficiencies a problem.

A cambrian explosion of UUIDs resulted, as noticed by the IETF -- this resulted in the [new UUID formats](https://www.ietf.org/archive/id/draft-peabody-dispatch-new-uuid-format-01.html) (v6,v7,v8) being published in 2021.

Here's a quick list (from that IETF document):

- LexicalUUID by [Twitter](https://blog.twitter.com/engineering)
- [Snowflake](https://blog.twitter.com/engineering/en_us/a/2010/announcing-snowflake) by [Twitter](https://blog.twitter.com/engineering)
- [Flake](https://github.com/boundary/flake) by [Boundary (now BMC TrueSight Pulse)](http://www.bmc.com/)
- ShardingID by [Instagram](http://instagram-engineering.com/)
- [KSUID](https://github.com/segmentio/ksuid) by [Segment](https://segment.com/blog/engineering/)
- [Elasticflake](https://github.com/ppearcy/elasticflake) by [P. Pearcy](https://github.com/ppearcy/elasticflake)
- [FlakeID](https://github.com/s-yadav/FlakeId) by [T. Pawlak](https://github.com/T-PWK)
- [Sonyflake](https://github.com/sony/sonyflake) by [Sony](https://github.com/sony)
- [orderedUuid](https://laravel.com/docs/5.7/helpers#method-str-ordered-uuid) by [IT. Cabrera](https://darkghosthunter.medium.com/)
- COMBGUID by [R. Tallent](https://github.com/richardtallent)
- [ULID](https://github.com/ulid/spec) by [A. Feerasta](https://github.com/alizain)
- [SID](https://github.com/chilts/sid) by [A. Chilton](https://github.com/chilts)
- [pushID](https://firebase.googleblog.com/2015/02/the-2120-ways-to-ensure-unique_68.html) by [Google](https://google.com/)
- [XID](https://github.com/rs/xid) by [O. Poitrey](https://github.com/rs)
- [ObjectID](https://www.mongodb.com/docs/manual/reference/method/ObjectId/) by [MongoDB](https://www.mongodb.com/blog/channel/engineering-blog)
- [CUID](https://github.com/ericelliott/cuid) by [E. Elliott](https://github.com/ericelliott)

That's... A lot of UUIDs. They're all slightly different, but the innovation was summed up by the IETF:

> An inspection of these implementations details the following trends that help define this standard:
>
> - Timestamps MUST be k-sortable. That is, values within or close to the same timestamp are ordered properly by sorting algorithms.
> - Timestamps SHOULD be big-endian with the most-significant bits of the time embedded as-is without reordering.
> - Timestamps SHOULD utilize millisecond precision and Unix Epoch as timestamp source. Although, there is some variation to this among implementations depending on the application requirements.
> - The ID format SHOULD be Lexicographically sortable while in the textual representation.
> - IDs MUST ensure proper embedded sequencing to facilitate sorting when multiple UUIDs are created during a given timestamp.
> - IDs MUST NOT require unique network identifiers as part of achieving uniqueness.
> - Distributed nodes MUST be able to create collision resistant Unique IDs without a consulting a centralized resource.
>   **The IETF went on to introduce three 3 new types of UUIDs** that have these properties these companies were looking for: UUIDv6, UUIDv7, and UUIDv8.

So what's the difference you ask?

- **UUIDv6** - 62 bits of [gregorian](https://en.wikipedia.org/wiki/Gregorian_calendar) time + 48 bits of randomness
- **UUIDv7** - 36 bits of big endian unix timestamp (seconds since epoch + leapseconds w/ optional sub-second precision) + variable randomness up to 62 bits
- **UUIDv8** - variable size timestamp (32/48/60/64 bits) + variable size clock (8/12 bits) + variable randomness (54/62 bits)

It's not quite easy to work out what this all _means_ but let's boil it down:

- All of these UUIDs sort properly (the "high bits" of time are first, like putting the year before the month -- "2022/07")
- UUIDv6 _requires_ randomness
- The data contained in the UUID can be variable (ex. UUIDv8), this means you can bytes that mean something else (ex. an encoding of the compute region you're running in)

Alright, done hearing about UUIDs? Let's get to the fun part.

## Benchmarking ID generation with `uuid-ossp` and `pg_idkit`

With the history lesson behind us, let's benchmark these ID generation mechanisms against each other! For UUIDv1 and UUIDv4 we can use [uuid-ossp](https://www.postgresql.org/docs/current/uuid-ossp.html).

Unfortunately, `uuid-ossp` isn't _quite_ so advanced as to have many of these newer UUIDs we've been discussing, so we'll pull in [pg_idkit](https://github.com/t3hmrman/pg_idkit) here.

[pg_idkit](https://github.com/t3hmrman/pg_idkit) is built with Rust, so it gives us access to the following ID generation crates:

- [nanoid](https://crates.io/crates/nanoid) (a [well known package](https://www.npmjs.com/package/nanoid) from the NodeJS ecosystem)
- [ksuid](https://crates.io/crates/ksuid)
- [ulid](https://crates.io/crates/ulid)
- [rs-snowflake](https://crates.io/crates/rs-snowflake) (Twitter's Snowflake algorithm)
- [timeflake-rs](https://crates.io/crates/timeflake-rs) (Inspired by Twitter's Snowflake, Instagram's ID and Firebase's PushID)
- [sonyflake](https://crates.io/crates/sonyflake)
- [pushid](https://crates.io/crates/pushid)
- [xid](https://crates.io/crates/xid)
- [cuid](https://crates.io/crates/cuid)
- [uuidv6](https://crates.io/crates/uuidv6)
- [uuid7](https://crates.io/crates/uuid7)

For each type of UUID, we can test the following:

- **Generation speed:** \*\*How fast can I generate IDs (let's say 1,000,000 of them)?
- **Table & Index size:** How much larger do tables and associated indices get?

<aside>

⚠️ Grain of salt required for these tests - we haven't audited the implementations of all the underlying crates!

</aside>

### Generation speed

Generation speed is pretty easy to test, we can enable `\\timing` mode on `psql` and run a simple benchmark with `generate_series`:

```sql
\timing -- enable psql timing mode

-- Generate IDs 1 million times with ksuid
SELECT COUNT(idkit_ksuid_generate()) FROM generate_series(1, 1000000);
```

Running all of the ID generation mechanisms on a _single core_ of my machine (which happens to be an [Oryx Pro](https://system76.com/laptops/oryx)), the lowest of 5 runs for each ID looks like this:

![Generation speed test](/images/blog/primary-keys/generation-speed-chart.jpg)

To be fair, **generation speed shouldn't be a deal breaker** as it's unlikely to be the bottle neck for most applications. That said, it is nice to have some data on where each ID generation mechanism lands.

<aside>
ℹ️ Percona and CyberTec have some excellent posts on the topic:

[https://www.percona.com/blog/2014/12/19/store-uuid-optimized-way/](https://www.percona.com/blog/2014/12/19/store-uuid-optimized-way/)
[https://www.cybertec-postgresql.com/en/uuid-serial-or-identity-columns-for-postgresql-auto-generated-primary-keys/](https://www.cybertec-postgresql.com/en/uuid-serial-or-identity-columns-for-postgresql-auto-generated-primary-keys/)

</aside>

### Table & Index size

We can check the size of our tables & related indices with this query (after running `VACUUM`):

```sql
select
  relname as table_name,
  pg_size_pretty(pg_total_relation_size(relid)) as "Table Size",
  pg_size_pretty(pg_indexes_size(relid)) as "Index Size",
  pg_size_pretty(pg_relation_size(relid)) as "Total Size"
from pg_catalog.pg_statio_user_tables
order by pg_total_relation_size(relid) desc;
```

Here are the sizes in tabular form:

![Sizes in tabular form](/images/blog/primary-keys/table-and-index-size-chart.jpg)

These numbers are _mostly_ a reflection of the _length_ of the default settings of `pg_idkit` but probably worth having in front of you anyway.

With this, we probably have enough information to make a decision (and a new library to generate our UUIDs with)!

## Which ID should you use?

As usual, _it depends_ -- you didn't think it'd be that easy, did you?

All I can offer are some general rules of thumb that hopefully work for you:

- `integer`s and `serial` have obvious benefits for simplicity, storage, and sortability. You _might_ not want to expose them to the world though.
- If you want the ultimate in collision avoidance UUIDv4 is OK
- UUIDv1 _could_ have been great, _but_ it doesn't lexicographically sort.
- The best time-based ID seems to be `xid`, with good performance _and_ sort friendliness
- If you want to be a little more standards-oriented, UUID v6/v7

As usual, the best results will come from weighing all the options and finding what's best for your use-case, and doing appropriate testing on your data.

## Possible Improvements

We've done some good exploration so far, but here are some ideas for interesting use cases for `pg_idkit` and measuring the impact of ID generation using it.

### Usecase: Generating our `created_at` columns from our IDs

One interesting feature would be using at least partially time-based UUIDs for `created_at` columns -- we could save space by _virtualizing_ our `created_at` columns:

```sql
-- At table creation
CREATE TABLE users (
  id text PRIMARY KEY DEFAULT idkit_ksuid_generate(),
  name text,
  email text,
);

-- An example query for a specific KSUID that uses created_at
SELECT *, idkit_ksuid_extract_timestamptz(id)
FROM users
WHERE id = '0F755149A55730412B0AEC0E3B5B089C14B5B58D';
```

Ideally we could use the `GENERATED ALWAYS AS ( ... )` syntax for [generated columns](https://www.postgresql.org/docs/current/ddl-generated-columns.html) while creating the table, but as the time of this post _Postgres does not yet support virtual generated columns (only stored ones)_.

### Benchmarking: Measuring index fragmentation

How fragmented do our indices get after use of each of these methods?

Luckily for us Postgres has the [pgstattuple extension](https://www.postgresql.org/docs/current/pgstattuple.html) so we can find out -- thanks to [Laurenz Albe on StackOverflow](https://dba.stackexchange.com/questions/273556/how-do-we-select-fragmented-indexes-from-postgresql)).

Integrating and including these tests in the `pg_idkit` README would greatly help people looking to make a decision.

### Benchmarking: Measuring `SORT` friendliness

Another great metric to measure might be performance of these indices on certain common `SORT` patterns. While this is inherently workload-specific, it would be great to pick a workload and see what we get.

In most code bases, simple `WHERE` queries with `SORT`s abound, and one of the big benefits of UUIDv6, UUIDv7 and the other alternatives is lexicographic sorting, after all.

Knowing _just how good_ a certain ID generation method is at maintaining locality would be nice to know.

Creating and using a function like `idkit_uuidv1_extract_timestamptz` and using it in a [“functional index” (an index on an expression)](https://www.postgresql.org/docs/14/indexes-expressional.html) could resolve the sort unfriendliness of UUIDv1 as well!

## Wrap-up

Identifiers have a long history and are surprisingly unsolved at present. It can be confusing but thanks to the power of Postgres we don't have to over-think it -- tables can be migrated from one ID pattern to another, and we can use DDL statements in transactions.

Hopefully this article helps you head off some bikeshedding with your teammates when you next discuss which IDs are best to use.

## More Postgres articles

- [Partial data dumps using Postgres Row Level Security](https://supabase.com/blog/partial-postgresql-data-dumps-with-rls)
- [Postgres Views](https://supabase.com/blog/postgresql-views)
- [Postgres Auditing in 150 lines of SQL](https://supabase.com/blog/audit)
- [Cracking PostgreSQL Interview Questions](https://supabase.com/blog/cracking-postgres-interview)
- [What are PostgreSQL Templates?](https://supabase.com/blog/postgresql-templates)
- [Realtime Postgres RLS on Supabase](https://supabase.com/blog/realtime-row-level-security-in-postgresql)
- [Implementing "seen by" functionality with Postgres](https://supabase.com/blog/seen-by-in-postgresql)
