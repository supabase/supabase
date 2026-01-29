---
title: 'pg_graphql: Postgres functions now supported'
description: 'pg_graphql now supports the most requested feature: Postgres functions a.k.a. User Defined Functions (UDFs)'
launchweek: x
categories:
  - product
tags:
  - launch-week
  - pg-graphql
  - planetpg
date: '2023-12-12'
toc_depth: 3
author: oli_rice
imgSocial: lwx-pg-graphql/pg-graphql-og.png
imgThumb: lwx-pg-graphql/pg-graphql-thumb.png
---

Supabase GraphQL (pg_graphql) 1.4+ supports the most requested feature: Postgres functions a.k.a. User Defined Functions (UDFs). This addition marks a significant improvement in GraphQL flexibility at Supabase, both as a novel approach to defining entry points into the Graph and as an escape hatch for users to implement custom/complex operations.

As with all entities in Supabase GraphQL, UDFs support is based on automatically reflecting parts of the SQL schema. The feature allow for the execution of custom SQL logic within GraphQL queries to help support complex, user defined, server-side operations with a simple GraphQL interface.

## Minimal Example

Consider a function **`addNums`** for a basic arithmetic operation:

```sql
create function "addNums"(a int, b int default 1)
returns int
immutable
language sql
as $$
	select a + b;
$$;
```

when reflected in the GraphQL schema, the function is exposed as:

```sql
type Query {
  addNums(a: Int!, b: Int): Int
}
```

To use this entry point, you could run:

```graphql
query {
  addNums(a: 2, b: 3)
}
```

which returns the JSON payload:

```json
{
  "data": {
    "addNums": 5
  }
}
```

Supabase GraphQL does its best to reflect a coherent GraphQL API from all the information known to the SQL layer. For example, the argument `a` is non-null because it doesn't have a default value while `b` can be omitted since it does have a default. We also detected that this UDF can be displayed in the `Query` type rather than the `Mutation` type because the function was declared as `immutable`, which means it can not edit the database. Of the other [function volatility categories](https://www.postgresql.org/docs/current/xfunc-volatility.html), `stable` similarly translates into a `Query` field while `volatile` (the default) becomes a `Mutation` field.

### Returning Records

In a more realistic example, we might want to return a set of an existing object type like `Account`. For example, lets say we want to search for accounts based on their email address domains matching a string:

```sql
create table "Account"(
  id serial primary key,
  email varchar(255) not null
);

insert into "Account"(email)
values
  ('a@foo.com'),
  ('b@bar.com'),
  ('c@foo.com');

create function "accountsByEmailDomain"("domainToSearch" text)
  returns setof "Account"
  stable
  language sql
as $$
	select
		id, email
	from
		"Account"
	where
		email ilike ('%@' || "domainToSearch");
$$;
```

Since our function is `stable`, it continues to be a field on the `Query` type. Notice that since we're returning a collection of `Account` we automatically get support for [Relay style pagination](https://relay.dev/graphql/connections.htm) on the response including `first`, `last`, `before`, `after` as well as filtering and sorting.

```graphql
type Query {
  accountsByEmailDomain(
    domainToSearch: String!

    """
    Query the first `n` records in the collection
    """
    first: Int

    """
    Query the last `n` records in the collection
    """
    last: Int

    """
    Query values in the collection before the provided cursor
    """
    before: Cursor

    """
    Query values in the collection after the provided cursor
    """
    after: Cursor

    """
    Filters to apply to the results set when querying from the collection
    """
    filter: AccountFilter

    """
    Sort order to apply to the collection
    """
    orderBy: [AccountOrderBy!]
  ): AccountConnection
}
```

To complete the example, here's a call to our user defined function:

```graphql
query {
  accountsByEmailDomain(domainToSearch: "foo.com", first: 2) {
    edges {
      node {
        id
        email
      }
    }
  }
}
```

and the response:

```json
{
  "data": {
    "accountsByEmail": {
      "edges": [
        {
          "node": {
            "id": 1,
            "email": "a@foo.com"
          }
        },
          "node": {
            "id": 3,
            "email": "c@foo.com"
          }
      ]
    }
  }
}
```

While not shown here, any relationships defined by foreign keys on the response type `Account` are fully functional so our UDF result is completely connected to the existing Graph.

It’s worth mentioning that we could have supported this query using the default `accountCollection` field that `pg_graphql` exposes on the `Query` type using an `ilike` filter so the example is only for illustrative purposes.

i.e.:

```graphql
query {
  accountCollection(filter: { email: { ilike: "%foo.com" } }, first: 2) {
    edges {
      node {
        id
        email
      }
    }
  }
}
```

would give the same result as our UDF.

### Limitations

The API surface area of SQL functions is surprisingly large. In an effort to bring this feature out sooner, some lesser-used parts have not been implemented yet. Currently functions using the following features are excluded from the GraphQL API:

- Overloaded functions
- Functions with a nameless argument
- Functions returning void
- Variadic functions
- Functions that accept a table/views's tuple type as an argument
- Functions that accept an array type

We look forward to implementing support for many of these features in coming releases.

## Takeaways

If you're an existing Supabase user, but new to GraphQL, head over to [GraphiQL built right into Supabase Studio](https://supabase.com/dashboard/project/_/api/graphiql) for your project to interactively explore your projects through the GraphQL API. User defined function support is new in pg_graphql 1.4+. You can check your project's GraphQL version with:

```sql
select *
from pg_available_extensions
where name = 'pg_graphql';
```

To upgrade, check out [our upgrade guide](https://supabase.com/docs/guides/platform/migrating-and-upgrading-projects).

For new Supabase users, [creating a new project](http://database.new) will get you the latest version of Supabase GraphQL with UDF support.

If you're not ready to start a new project but want to learn more about `pg_graphql`/Supabase GraphQL, our [API docs](https://supabase.github.io/pg_graphql/api/) are a great place to learn about how your SQL schema is transformed into a GraphQL API.
