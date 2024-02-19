---
id: 'enums'
title: 'Managing Enums in Postgres'
description: 'Define a strict set of values that can be used in table and function definitions.'
---

Enums in Postgres are a custom data type. They allow you to define a set of values (or labels) that a column can hold. They are useful when you have a fixed set of possible values for a column.

## Creating enums

You can define a Postgres Enum using the `create type` statement. Here's an example:

{/* prettier-ignore */}
```sql
create type mood as enum (
  'happy',
  'sad',
  'excited',
  'calm'
);
```

In this example, we've created an Enum called "mood" with four possible values.

## When to use enums

There is a lot of overlap between Enums and foreign keys. Both can be used to define a set of values for a column. However, there are some advantages to using Enums:

- Performance: You can query a single table instead of finding the value from a lookup table.
- Simplicity: Generally the SQL is easier to read and write.

There are also some disadvantages to using Enums:

- Limited Flexibility: Adding and removing values requires modifying the database schema (i.e.: using migrations) rather than adding data to a table.
- Maintenance Overhead: Enum types require ongoing maintenance. If your application's requirements change frequently, maintaining enums can become burdensome.

In general you should only use Enums when the list of values is small, fixed, and unlikely to change often. Things like "a list of continents" or "a list of departments" are good candidates for Enums.

## Using enums in tables

To use the Enum in a table, you can define a column with the Enum type. For example:

{/* prettier-ignore */}
```sql
create table person (
  id serial primary key,
  name text,
  current_mood mood
);
```

Here, the `current_mood` column can only have values from the "mood" Enum.

### Inserting data with enums

You can insert data into a table with Enum columns by specifying one of the Enum values:

{/* prettier-ignore */}
```sql
insert into person
  (name, current_mood)
values
  ('Alice', 'happy');
```

### Querying data with enums

When querying data, you can filter and compare Enum values as usual:

{/* prettier-ignore */}
```sql
select * 
from person 
where current_mood = 'sad';
```

## Managing enums

You can manage your Enums using the `alter type` statement. Here are some examples:

### Updating enum values

You can update the value of an Enum column:

{/* prettier-ignore */}
```sql
update person
set current_mood = 'excited'
where name = 'Alice';
```

### Adding enum values

To add new values to an existing Postgres Enum, you can use the `ALTER TYPE` statement. Here's how you can do it:

Let's say you have an existing Enum called `mood`, and you want to add a new value, `content`:

{/* prettier-ignore */}
```sql
alter type mood add value 'content';
```

### Removing enum values

Even though it is possible, it is unsafe to remove enum values once they have been created. It's better to leave the enum value in place.

<Admonition type="caution">

Read the [Postgres mailing list](https://www.postgresql.org/message-id/21012.1459434338%40sss.pgh.pa.us) for more information:

There is no `ALTER TYPE DELETE VALUE` in Postgres. Even if you delete every occurrence of an Enum value within a table (and vacuumed away those rows), the target value could still exist in upper index pages. If you delete the `pg_enum` entry you'll break the index.

</Admonition>

### Getting a list of enum values

Check your existing Enum values by querying the enum_range function:

{/* prettier-ignore */}
```sql
select enum_range(null::mood);
```

## Resources

- Official Postgres Docs: [Enumerated Types](https://www.postgresql.org/docs/current/datatype-enum.html)
