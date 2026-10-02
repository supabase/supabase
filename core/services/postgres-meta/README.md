# `postgres-meta`

A RESTful API for managing your Postgres. Fetch tables, add roles, and run queries (and more).

## Documentation

https://supabase.github.io/postgres-meta/

## Progress

Schema:

- [X] `POST /query` (Execute SQL query)
  - [x] `POST /format` (Format SQL query)
  - [x] `POST /parse` (Parse SQL query into AST)
  - [ ] `POST /explain` (Explain SQL query)
- [X] `/columns`
  - [X] GET (List)
  - [X] POST (`alter table add column`)
  - [X] PATCH (`alter table alter/rename column`)
  - [X] DELETE (`alter table drop column`)
- [X] `/extensions`
  - [X] GET (List)
  - [X] POST (`create extension`)
  - [X] PATCH (`alter extension`)
  - [X] DELETE (`drop extension`)
- [X] `/functions`
  - [X] GET (List)
  - [X] POST (`create function`)
  - [X] PATCH (`alter function`)
  - [X] DELETE (`drop function`)
- [X] `/publications`
  - [X] GET (List)
  - [X] POST (`create publication`)
  - [X] PATCH (`alter publication`)
  - [X] DELETE (`drop publication`)
- [X] `/roles`
  - [X] GET (List)
  - [X] POST (`create role`)
  - [X] PATCH (`alter role`)
  - [X] DELETE (`drop role`)
- [X] `/schemas`
  - [X] GET (List)
  - [X] POST (`create schema`)
  - [X] PATCH (`alter schema`)
  - [X] DELETE (`drop schema`)
- [X] `/tables`
  - [X] GET (List)
  - [X] POST (`create table`)
  - [X] PATCH (`alter table`)
  - [X] DELETE (`drop table`)
- [X] `/triggers`
  - [X] GET (List)
  - [X] POST (`create trigger`)
  - [X] PATCH (`alter trigger`)
  - [X] DELETE (`drop trigger`)
- [ ] `/types`
  - [X] GET (List)
  - [ ] POST (`create type`)
  - [ ] PATCH (`alter type`)
  - [ ] DELETE (`drop type`)

Helpers:

- [ ] `/config`
  - [ ] GET `/version`: Postgres version 
- [ ] `/generators`
  - [ ] GET `/openapi`: Generate Open API 
  - [ ] GET `/typescript`: Generate Typescript types
  - [ ] GET `/swift`: Generate Swift types (beta)
  - [ ] GET `/python`: Generate Python types (beta)

## Quickstart

Set the following ENV VARS:

```bash
PG_META_HOST="0.0.0.0"
PG_META_PORT=8080
PG_META_DB_HOST="postgres"
PG_META_DB_NAME="postgres"
PG_META_DB_USER="postgres"
PG_META_DB_PORT=5432
PG_META_DB_PASSWORD="postgres"
```

Then run any of the binaries in the releases.


## FAQs

**Why?**

This serves as a light-weight connection pooler. It also normalises the Postgres system catalog into a more readable format. While there is a lot of re-inventing right now, this server will eventually provide helpers (such as type generators). The server is multi-tenant, so it can support multiple Postgres databases from a single server.

**What security does this use?**

None. Please don't use this as a standalone server. This should be used behind a proxy in a trusted environment, on your local machine, or using this internally with no access to the outside world. 

## Developers

To start developing, run `npm run dev`. It will set up the database with Docker for you. The server will restart on file change.

If you are fixing a bug, you should create a new test case. To test your changes, add the `-u` flag to `vitest` on the `test:run` script, run `npm run test`, and then review the git diff of the snapshots. Depending on your change, you may see `id` fields being changed - this is expected and you are free to commit it, as long as it passes the CI. Don't forget to remove the `-u` flag when committing.

To make changes to the type generation, run `npm run gen:types:<lang>` while you have `npm run dev` running,
where `<lang>` is one of:

- `typescript`
- `go`
- `swift` (beta)
- `python` (beta)

To use your own database connection string instead of the provided test database, run:
`PG_META_DB_URL=postgresql://postgres:postgres@localhost:5432/postgres npm run gen:types:<lang>`

## Licence

Apache 2.0

