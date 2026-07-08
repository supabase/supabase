---
title = "Deprecated RLS features"
github_url = "https://github.com/orgs/supabase/discussions/16703"
date_created = "2023-08-22T13:17:50+00:00"
topics = ["database"]
keywords = ["rls", "deprecated", "auth", "policy"]
database_id = "58c0cb7c-50a0-4a96-9551-bc97c28b7393"
---

## The `auth.role()` function is now deprecated

The `auth.role()` function has been deprecated in favour of using the `TO` field, natively supported within Postgres:

```sql
-- DEPRECATED
create policy "Public profiles are viewable by everyone."
on profiles for select using (
  auth.role() = 'authenticated' or auth.role() = 'anon'
);

-- RECOMMENDED
create policy "Public profiles are viewable by everyone."
on profiles for select
to authenticated, anon
using (
  true
);
```

## The `auth.email()` function is now deprecated

The `auth.email()` function has been deprecated in favour a more generic function to return the full JWT:

```sql
- DEPRECATED
create policy "User can view their profile."
on profiles for select using (
  auth.email() = email
);

-- RECOMMENDED
create policy "User can view their profile."
on profiles for select using (
  (auth.jwt() ->> 'email') = email
);
```
