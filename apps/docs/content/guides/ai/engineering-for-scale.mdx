---
id: 'ai-engineering-for-scale'
title: 'Engineering for Scale'
description: 'Building an enterprise-grade vector architecture'
subtitle: 'Building an enterprise-grade vector architecture.'
sidebar_label: 'Engineering for Scale'
---

Content sources for vectors can be extremely large. As you grow you should run your Vector workloads across several secondary databases (sometimes called "pods"), which allows each collection to scale independently.

## Simple workloads

For small workloads, it's typical to store your data in a single database.

If you've used [Vecs](/docs/guides/ai/vecs-python-client) to create 3 different collections, you can expose collections to your web or mobile application using [views](/docs/guides/database/tables#views):

<Image
  alt="single database"
  src={{
    light: '/docs/img/ai/scaling/engineering-for-scale--single-database--light.png',
    dark: '/docs/img/ai/scaling/engineering-for-scale--single-database--dark.png',
  }}
  width={1600}
  height={1145}

/>

For example, with 3 collections, called `docs`, `posts`, and `images`, we could expose the "docs" inside the public schema like this:

```sql
create view public.docs as
select
  id,
  embedding,
  metadata, # Expose the metadata as JSON
  (metadata->>'url')::text as url # Extract the URL as a string
from vector
```

You can then use any of the client libraries to access your collections within your applications:

{/* prettier-ignore */}
```js
const { data, error } = await supabase
  .from('docs')
  .select('id, embedding, metadata')
  .eq('url', '/hello-world')
```

## Enterprise workloads

As you move into production, we recommend splitting your collections into separate projects. This is because it allows your vector stores to scale independently of your production data. Vectors typically grow faster than operational data, and they have different resource requirements. Running them on separate databases removes the single-point-of-failure.

<Image
  alt="With secondaries"
  src={{
    light: '/docs/img/ai/scaling/engineering-for-scale--with-secondaries--light.png',
    dark: '/docs/img/ai/scaling/engineering-for-scale--with-secondaries--dark.png',
  }}
  width={1600}
  height={1641}

/>

You can use as many secondary databases as you need to manage your collections. With this architecture, you have 2 options for accessing collections within your application:

1. Query the collections directly using Vecs.
2. Access the collections from your Primary database through a Wrapper.

You can use both of these in tandem to suit your use-case. We recommend option `1` wherever possible, as it offers the most scalability.

### Query collections using Vecs

Vecs provides methods for querying collections, either using a [cosine similarity function](https://supabase.github.io/vecs/api/#basic) or with [metadata filtering](https://supabase.github.io/vecs/api/#metadata-filtering).

```python
# cosine similarity
docs.query(query_vector=[0.4,0.5,0.6], limit=5)

# metadata filtering
docs.query(
    query_vector=[0.4,0.5,0.6],
    limit=5,
    filters={"year": {"$eq": 2012}}, # metadata filters
)
```

### Accessing external collections using Wrappers

Supabase supports [Foreign Data Wrappers](/blog/postgres-foreign-data-wrappers-rust). Wrappers allow you to connect two databases together so that you can query them over the network.

This involves 2 steps: connecting to your remote database from the primary and creating a Foreign Table.

#### Connecting your remote database

Inside your Primary database we need to provide the credentials to access the secondary database:

```sql
create extension postgres_fdw;

create server docs_server
foreign data wrapper postgres_fdw
options (host 'db.xxx.supabase.co', port '5432', dbname 'postgres');

create user mapping for docs_user
server docs_server
options (user 'postgres', password 'password');
```

#### Create a foreign table

We can now create a foreign table to access the data in our secondary project.

```sql
create foreign table docs (
  id text not null,
  embedding extensions.vector(384),
  metadata jsonb,
  url text
)
server docs_server
options (schema_name 'public', table_name 'docs');
```

This looks very similar to our View example above, and you can continue to use the client libraries to access your collections through the foreign table:

{/* prettier-ignore */}
```js
const { data, error } = await supabase
  .from('docs')
  .select('id, embedding, metadata')
  .eq('url', '/hello-world')
```

### Enterprise architecture

This diagram provides an example architecture that allows you to access the collections either with our client libraries or using Vecs. You can add as many secondary databases as you need (in this example we only show one):

<Image
  alt="multi database"
  src={{
    light: '/docs/img/ai/scaling/engineering-for-scale--multi-database--light.png',
    dark: '/docs/img/ai/scaling/engineering-for-scale--multi-database--dark.png',
  }}
  width={1600}
  height={1754}

/>
