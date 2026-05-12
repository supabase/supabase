---
title: PostgREST 13
description: New features and changes in PostgREST version 13.
author: steve_chavez,laurenceisla,avallete
imgSocial: 2025-09-30-postgrest-13-release/postgrest-13-release.png
imgThumb: 2025-09-30-postgrest-13-release/postgrest-13-release.png
categories:
  - postgres
tags:
  - postgres
  - postgrest
  - release-notes
date: '2025-09-30'
---

PostgREST 13 is out! It comes with API and Observabilty improvements. In this post, we'll see what's new.

## Spread To-Many relationships

This new feature allows you to represent one-to-many and many-to-many relationships as flat JSON arrays.

For example, if you have database similar to IMDB and you’d like to represent it as a hierarchical JSON structure for your frontend, like so:

```json
[
  {
    "title": "The Shawshank Redemption",
    "actors": ["Tim Robbins", "Morgan Freeman"],
    "genres": ["Drama"]
  },
  {
    "title": "The Godfather",
    "actors": ["Marlon Brando", "Al Pacino"],
    "genres": ["Drama", "Crime"]
  },
  {
    "title": "The Dark Knight",
    "actors": ["Christian Bale", "Heath Ledger"],
    "genres": ["Drama", "Crime", "Action"]
  }
]
```

You can now do it this way:

<$CodeTabs>

```js name=JavaScript
const { data, error } = await supabase.from('titles').select(`
  title:primary_title,
  ...people(actors:primary_name),
  ...genres(genres:name)
`)
```

```bash name=Bash
curl --get 'https://<your-domain>/titles'
  -d "select=title:primary_title,...people(actors:primary_name),...genres(genres:name)"
  -H "Authorization: Bearer <YOUR_KEY>"
```

```swift name=Swift
try await supabase.from("titles").select(
"""
  title:primary_title,
  ...people(actors:primary_name),
  ...genres(genres:name)
""")
```

</$CodeTabs>

The above `...people` is “spreading” the many-to-many relationship between `titles` and `people`, forming a flat array only consisting of the `primary_name` column. This flat array is then renamed to `actors`. We do a similar process for `genres` , which also forms a many-to-many relationship with `people`.

You can see the data model used for this example on this [gist](https://gist.github.com/steve-chavez/93f7ae04b4323e1952710af7129b32cf). There are more details about this feature on the [official docs](https://docs.postgrest.org/en/v13/references/api/resource_embedding.html#spread-to-many-relationships).

## Automatic tsvector convertion

Previously you could only use the full text search operator on `tsvector` columns, now you can do it on `text` and `json/jsonb` columns too:

<$CodeTabs>

```js name=JavaScript
const { data, error } = await supabase.from('titles').textSearch('primary_name', `'god' & 'father'`)
```

```bash name=Bash
curl --get 'https://<your-domain>/titles'
  -d "primary_name=fts.'god'%26'father"
  -H "Authorization: Bearer <YOUR_KEY>"
```

```swift name=Swift
try await supabase
  .from("titles")
  .fts("primary_name",value: "'god' & 'father'")
```

</$CodeTabs>

This works because `text` and `json/jsonb` columns will be automatically converted with `to_tsvector`.

To ensure this operation is fast, add an index:

```sql
create index idx_titles on people
using gin (to_tsvector('english', primary_name));
```

## Max Affected

You can now limit to the amount of rows affected by an `update` or `delete` operation with `maxAffected`:

<$CodeTabs>

```js name=JavaScript
const { data, error } = await supabase
  .from('people')
  .update({ primary_name: 'Marlon Brando Jr.' })
  .eq('nconst', 'nm0000008')
  .maxAffected(1)

// This is available starting from supabase-js version 2.56.0
```

```bash name=Bash
curl -X PATCH 'https://<your-domain>/people' \
  -d "nconst=eq.nm0000008" \
  -H "Authorization: Bearer <YOUR_KEY>" \
  -H "Prefer: handling=strict, max-affected=1" \
  -H "Content-Type: application/json" \
  -d @- <<JSON
{ primary_name: 'Marlon Brando Jr.' }
JSON
```

```swift name=Swift
try await supabase
  .from("people")
  .update(["primary_name": "Marlon Brando Jr."])
  .eq("nconst", value: "nm0000008")
  .maxAffected(1)
  .execute()

// This is available starting from supabase-swift version 2.33.0
```

</$CodeTabs>

If the rows affected by the operation surpass the limit in `maxAffected`, an error will be thrown.

This also works with `rpc()`, given that it modifies rows and returns the affected rows. More on details on the [official docs](https://docs.postgrest.org/en/v13/references/api/preferences.html#max-affected).

## Content-Length header

For observability, you can now verify the response body size in bytes in the `Content-Length` header.

```bash
HTTP/1.1 200 OK
Content-Length: 104
Content-Location: /items
```

This helps in cases where you want to know which requests consume the most traffic to avoid exceeding egress limits.

## Proxy-Status header

The PostgREST error code is now present in the `Proxy-Status` header.

```bash
HTTP/1.1 406 Not Acceptable
Proxy-Status: PostgREST; error=PGRST116
```

You can check the `Proxy-Status` and `Content-Length` headers in the Supabase Logs Explorer.

## Breaking Changes

### JWT `kid` validation

PostgREST now validates the JWT `kid` claim. If your JWT contains a Key ID (`kid`), it will try to match this with one of the `kid`'s in the configured JSON Web Key Set. Check the [official docs](https://docs.postgrest.org/en/v13/references/auth.html#jwk-kid-validation) for more details.

If you use Supabase Auth or the CLI to create JSON Web Keys, you shouldn’t worry about this change as both systems will ensure `kid`'s are present in the JSON Web Key Set.

For users that integrate with other Auth systems, make sure that both your JWT and JWKS follow the above rules.

### Schema validation in PostgREST search path

The schemas inside `db-schemas` and `db-extra-search-path` are now validated. This means you cannot put a nonexistent schema there, if you do PostgREST will fail with an error message.

If you drop a schema during a migration, you should make sure this is synced with the PostgREST search path, which is possible thanks to postgres transactional DDL:

```sql
begin;
drop schema old_schema;
alter role authenticator set pgrst.db_schemas = 'public, pg_graphql, others'; -- make sure old_schema is not present here
commit;
```

## Try it out

PostgREST v13 is now available for all new projects on the Supabase platform, old projects can upgrade to get this new version.

You can look at the full changelog on the [release notes](https://github.com/PostgREST/postgrest/releases/tag/v13.0.0).
