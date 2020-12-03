


<p align="center">
<img width="300" src="https://gitcdn.xyz/repo/supabase/supabase/master/web/static/supabase-light.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io) is an open source Firebase alternative. We're building the features of Firebase using enterprise-grade open source tools. 

- [x] Hosted Postgres Database
- [x] Realtime subscriptions
- [x] Authentication and authorization
- [x] Auto-generated APIs
- [x] Dashboard
- [ ] Storage (coming soon)
- [ ] Functions (coming soon)

## Status

- [x] Alpha: We are testing Supabase with a closed set of customers
- [x] Public Alpha: Anyone can sign up over at [app.supabase.io](https://app.supabase.io). But go easy on us, there are a few kinks.
- [x] Public Beta: Stable enough for most non-enterprise use-cases
- [ ] Public: Production-ready

We are currently in Public Alpha. Watch "releases" of this repo to get notified of major updates.



<p align="center">
<kbd><img src="https://gitcdn.xyz/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>
</p>

----


## How it works

Supabase is a combination of open source tools. We’re building the features of Firebase using enterprise-grade, open source products. If the tools and communities exist, with an MIT, Apache 2, or equivalent open license, we will use and support that tool. If the tool doesn't exist, we build and open source it ourselves. Supabase is not a 1-to-1 mapping of Firebase. Our aim is to give developers a Firebase-like developer experience using open source tools.

**Current architecture**

Supabase is a [hosted platform](https://app.supabase.io). You can sign up and start using Supabase without installing anything. We are still creating the local development experience - this is now our core focus, along with platform stability.


![Architecture](https://supabase.io/assets/images/supabase-architecture-0a162cd9b23053a55074d7dda5b6c4ad.png)


- [PostgreSQL](https://www.postgresql.org/) is an object-relational database system with over 30 years of active development that has earned it a strong reputation for reliability, feature robustness, and performance.
- [Realtime](https://github.com/supabase/realtime) is an Elixir server that allows you to listen to PostgreSQL inserts, updates, and deletes using websockets. Supabase listens to Postgres' built-in replication functionality, converts the replication byte stream into JSON, then broadcasts the JSON over websockets. 
- [PostgREST](http://postgrest.org/) is a web server that turns your PostgreSQL database directly into a RESTful API
- [pg-api](https://github.com/supabase/pg-api) is a RESTful API for managing your Postgres, allowing you to fetch tables, add roles, and run queries etc.
- [GoTrue](https://github.com/netlify/gotrue) is an SWT based API for managing users and issuing SWT tokens.
- [Kong](https://github.com/Kong/kong) is a cloud-native API gateway.

 

**Client libraries**

Our client library is modular. Each sub-library is a standalone implementation for a single external system. This is one of the ways we support existing tools.

- **`supabase-{lang}`**: Combines libraries and adds enrichments.
  - `postgrest-{lang}`: Client library to work with [PostgREST](https://github.com/postgrest/postgrest) 
  - `realtime-{lang}`: Client library to work with [Realtime](https://github.com/supabase/realtime)    
  - `gotrue-{lang}`: Client library to work with [GoTrue](https://github.com/netlify/gotrue)         

 
| Repo                                                                                       | Official                                         | Community        |
|-----------------------|--------------------------------------------------|------------------|
| **`supabase-{lang}`**     | [`JS`](https://github.com/supabase/supabase-js) | [`C#`](https://github.com/supabase/supabase-csharp) \| `Dart` \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust` |
| `postgrest-{lang}` | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) |
| `realtime-{lang}`  | [`JS`](https://github.com/supabase/realtime-js) | `C#` \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust` |
| `gotrue-{lang}`    | [`JS`](https://github.com/supabase/gotrue-js) | `C#` \| `Dart` \| `Python` \| `Rust` |



----

## Sponsors

[![New Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)

