---
feature: Connection Pooling
start-date: 2021-02-04
author: kiwicopple
co-authors: steve-chavez, dragarcia
related-issues: (will contain links to implementation PRs)
---

# Summary
[summary]: #summary

We would like to explore connection pooling on Supabase. This RFC is intended to decide:

- Whether we should provide a pooler
- Which connection pooler we should use
- Where in the stack it would be installed - i.e. if should bundle it with the Postgres build


# Motivation
[motivation]: #motivation

In Postgres, every connection is a process. Because of this, a lot of connections to the database can be very expensive on memory. 

When connecting to Postgres database from serverless functions, there is no connection pooling, and so the server needs to maintain hundreds/thousands of connections.


# Detailed design
[design]: #detailed-design

This is still in the "Gather Feedback" stage. To start the discussion:


### 1. Decide on a PG Pooler

- `pg_bouncer` - https://www.pgbouncer.org/
- `PG Pool II` - https://www.pgpool.net/mediawiki/index.php/Main_Page
- `odyssey` - https://github.com/yandex/odyssey
- others?

### 2. Decide on configuration

Most poolers allow different configurations. We would need to decide on how we would configure the pooler by default

### 3. Decide if the user should be able re-configure the pooler

Should a user be able to change the configuration? If so, how would they do it? 


# Drawbacks
[drawbacks]: #drawbacks

- Security
- Not directly relevant to the "supabase" stack, so it's additional non-core support

# Alternatives
[alternatives]: #alternatives

1. Since we already offer [PostgREST](https://github.com/postgrest/postgrest) and [postgres-meta](https://github.com/supabase/pg-api), this isn't entirely necessary for the Supabase stack. Bundling this is only beneficial for connecting external tools. 
2. We could hold back on this implementation until we move to a full Postgres Operator, which would include a pooler. It would be nice to have something for local development though.


# Unresolved questions
[unresolved]: #unresolved-questions

- Add any unresolved questions here


# Future work
[future]: #future-work

- Add any future work here