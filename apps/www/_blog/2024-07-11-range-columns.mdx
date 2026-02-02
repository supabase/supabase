---
title: 'Simplifying Time-Based Queries with Range Columns'
description: 'Learn how to use range columns in Postgres to simplify time-based queries and add constraints to prevent overlaps.'
author: tyler_shukert
imgSocial: range-columns/range-columns-thumb.png
imgThumb: range-columns/range-columns-thumb.png
categories:
  - developers
tags:
  - postgres
date: '2024-07-11'
toc_depth: 3
---

<Admonition>

[Do you prefer audio-visual learning? Watch the video guide!](https://youtu.be/eG_9lZrrbEY?si=MtTQsKZrzMinU536)

</Admonition>

When working on applications such as a reservation app or calendar app, you need to store the start time and end time of an event. You may also need to query events occurring in a specific time frame or ensure that certain events do not overlap. If you have a table with two separate columns `start_at` and `end_at` to hold the beginning and end of an event, it might be hard to perform advanced queries or add constraints to prevent overlaps. This article will show how range-type columns could provide helpful query functionalities and advanced constraints to avoid overlapping.

## The Problem with Traditional Date Columns

Traditionally, when dealing with events or periods, developers often use two separate columns to represent the start and end of a range. For example:

```sql
create table reservations (
  id serial primary key,
  title text,
  start_at timestamptz,
  end_at timestamptz
);
```

While this approach works, it has a few drawbacks:

1. **Querying Complexity**: Writing queries to find overlapping events or events within a specific period becomes complex and error-prone.
2. **Data Integrity**: Ensuring that reservations do not overlap is difficult.

## Enter Range Types

Range types are data types in Postgres that hold the beginning and end of a range of a base type. The range of `int4` is `int4range`, the range of `timestamptz` is `tstzrange`, and the range of `date` is `daterange`. Each range has a start value, an end value, and either square brackets `[]` or parenthesis `()` surrounding them. A bracket means the end is inclusive, and a parenthesis means the end is exclusive. An `int4range` of `[2,5)` represents a range of integers from 2 including it to 5 excluding it, so 2, 3, and 4.

### Querying range columns

Using these range values, we can create a reservation table like the following:

```sql
create table reservations (
  id serial primary key,
  title text,
  duration tstzrange
);
```

Using `tstzrange` instead of two `timestamptz` columns have a few advantages. First, it allows us to easily query reservations that overlap with a provided range using the `&&` operator. Look at the following select query:

```sql
select *
	from reservations
	where duration && '[2024-07-04 16:00, 2024-07-04 19:00)';
```

This query returns rows where the duration overlaps with `[2024-07-04 16:00, 2024-07-04 19:00)`. For example, a row with `[2024-07-04 18:00, 2024-07-04 21:00)` will be returned, but a row with `[2024-07-04 20:00, 2024-07-04 22:00)` will not be returned. The overlaps operator can be used when finding reservations or events in a given period.

Postgres provides more range-specific operators. The official Postgres documentation provides a complete list [of range operators](https://www.postgresql.org/docs/9.3/functions-range.html).

### Adding constraints on range columns

When working on a reservations app, you might want to ensure there are no overlapping reservations. Range columns make it easy to add such constraints. The following SQL statement adds an exclude constraint that prevents new inserts/ updates from overlapping on any of the existing reservations.

```sql
alter table reservations
	add constraint exclude_duration exclude
	using gist (duration with &&)
```

With the above constraint, the second insert on the following SQL statements fails because the `duration` overlaps with the first insert.

```sql
-- Add a first reservation
insert into reservations (title, duration)
values ('Tyler Dinner', '[2024-07-04 18:00, 2024-07-04 21:00)');

-- The following insert fails because the duration overlaps with the above
insert into reservations (title, duration)
values ('Thor Dinner', '[2024-07-04 20:00, 2024-07-04 22:00)');
```

Now, the exclusion constraint prevents any reservations from overlapping, but in the real world, a single reservations table typically holds reservations for different restaurants and tables within a restaurant, and just because a single reservation was made at a restaurant, it does not mean the entire restaurant is booked. Postgres can create such constraints where an insert or an update is disallowed only if a specific other column matches and the range overlaps.

Let’s say we had a `table_id` column in our reservations table. This `table_id` could represent a single table in various restaurants this database holds.

```sql
create table reservations (
  id serial primary key,
  title text,
  table_id int4,
  duration tstzrange
);
```

With a `table_id` column in place, we can add a constraint to ensure that reservations on the same table do not overlap. The constraint requires the [btree_gist](https://www.postgresql.org/docs/current/btree-gist.html) extension.

```sql
-- Enable the btree_gist index required for the constraint.
create extension btree_gist

-- Add a constraint to prevent overlaps with the same table_id
alter table reservations
  add constraint exclude_duration
  exclude using gist (table_id WITH =, duration WITH &&);
```

With this simple constraint, no two reservations will overlap with each other with the same `table_id`. If we run the following inserts, the second insert will fail because it is trying to book the same table as the first insert while the duration overlaps.

```sql
-- Add a first reservation
insert into reservations (title, table_id, duration)
values ('Tyler Dinner', 1, '[2024-07-04 18:00, 2024-07-04 21:00)');

-- Insert fails, because table 1 is taken from 18:00 - 21:00
insert into reservations (title, table_id, duration)
values ('Thor Dinner', 1, '[2024-07-04 20:00, 2024-07-04 22:00)');

-- Insert succeeds because table 2 is not taken by anyone
insert into reservations (title, table_id, duration)
values ('Thor Dinner', 2, '[2024-07-04 20:00, 2024-07-04 22:00)');
```

And that is how to create an air-tight table that holds reservations.

## Conclusion

Postgres's range columns offer a solution for handling range data in applications like reservation systems. They simplify queries with specific operators such as `&&` and improve data integrity by enabling constraints to prevent overlaps. Range columns provide an alternative to traditional two-column approaches for representing periods. By leveraging these features, developers can create more sophisticated and reliable applications with less code.

## More Supabase

- [Watch the video guide for range columns](https://youtu.be/eG_9lZrrbEY?si=MtTQsKZrzMinU536)
- [Check constraint video](https://youtu.be/hjrQb029LEE?si=wJ8ztryZP6K6EKmW)
- [Self-host Maps on Supabase Storage with Protomaps](https://supabase.link/protomaps-storage-yt)
- [Row Level Security guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
