---
title = "Fixing 520 Errors in the Database REST API"
github_url = "https://github.com/orgs/supabase/discussions/23422"
date_created = "2024-04-29T16:56:27+00:00"
topics = [ "database" ]
keywords = [ "520", "cloudflare", "url", "headers", "rpcs" ]
database_id = "6ec0c9a3-b52b-49b9-ba6e-c91984f7f9bf"

[[errors]]
http_status_code = 520
message = "Web server returns an unknown error due to request exceeding 16KB in headers/URL."
---

In the context of the database API, [Cloudflare 520 errors](https://developers.cloudflare.com/support/troubleshooting/cloudflare-errors/troubleshooting-cloudflare-5xx-errors/#error-520-web-server-returns-an-unknown-error) most often occur when 16+KB worth of data is present in the headers/URL of your requests.

The API will include filters within the URL, so a request like so:

```javascript
let { data: countries, error } = await supabase.from('countries').select('name')
```

translates to a URL like:

```bash
https://<project ref>.supabase.co/rest/v1/countries?select=name
```

However, appending too much data to the URL can exceed the 16KB limitation, triggering a 520 failure. This typically occurs with lengthy `in` clauses, as demonstrated here:

```javascript
const { data, error } = await supabase
  .from('countries')
  .select()
  .not('id', 'in', '(5,6,7,8,9,...10,000)')
```

To circumvent this issue, you must use [RPCs](/docs/reference/javascript/explain?queryGroups=example&example=call-a-postgres-function-with-arguments). They are database functions that you can call from the API. Instead of including a query's structure within the URL or header, they move it into the request's payload.

Here is a basic example of a [database function](/docs/guides/database/functions)

```sql
create or replace function example(id uuid[])
returns uuid[]
language plpgsql
as $$
begin
 raise log 'the function example was called with an array size of: %', (select array_length(id, 1));
 return id;
end;
$$;
```

The [RPC](/docs/reference/javascript/explain?queryGroups=example&example=call-a-postgres-function-with-arguments) can then call the function with an array that contains more than 16KB of data

```javascript
const { data, error } = await supabase.rpc('example', { id: ['e2f34fb9-bbf9-4649-9b2f-09ec56e67a42', ...900 more UUIDs] })
```
