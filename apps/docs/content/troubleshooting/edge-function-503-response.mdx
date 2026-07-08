---
title = "Edge Function 503 error response"
topics = [ "functions" ]
keywords = [ "503", "error" ]

[[errors]]
http_status_code = 503
code = "BOOT_ERROR"
message = "Function failed to start (please check logs)"
---

A 503 HTTP status code from an Edge Function indicates one of three possible events:

- the function failed to boot due to [`SyntaxError`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SyntaxError)
- your own code returned a 503
- the platform itself is having issues

These require different fixes, so it is useful to decipher the cause before debugging:

## Step 1: Figure out which 503 you have

If you received back a `BOOT_ERROR` message, like the one below, you can jump to the resolution section: [Boot Error](#boot-error)

```json
{
  "code": "BOOT_ERROR",
  "message": "Function failed to start (please check logs)"
}
```

Otherwise, run the below query in your [Log Explorer](/dashboard/project/_/logs/explorer?q=SELECT%0A++++req.pathname+AS+function_name%2C%0A++++res.status_code%2C%0A++++CASE%0A++++++++WHEN+metadata.execution_id+IS+NOT+NULL+AND+metadata.function_id+IS+NOT+NULL+THEN+%27app_level%27%0A++++++++WHEN+metadata.execution_id+IS+NULL+++++AND+metadata.function_id+IS+NOT+NULL+THEN+%27boot_error%27%0A++++++++WHEN+metadata.execution_id+IS+NULL+++++AND+metadata.function_id+IS+NULL+++++THEN+%27internal_failure%27%0A++++END+AS+error_type%0AFROM+function_edge_logs%0ACROSS+JOIN+UNNEST%28metadata%29+AS+metadata+%0ACROSS+JOIN+UNNEST%28metadata.request%29+AS+req+%0ACROSS+JOIN+UNNEST%28metadata.response%29+AS+res+%0AWHERE+%0A++++status_code+%3D+503+%0ALIMIT+50%3B).

```sql
select
  req.pathname as function_name,
  res.status_code,
  case
    when metadata.execution_id is not null
    and metadata.function_id is not null then 'app_level'
    when metadata.execution_id is null
    and metadata.function_id is not null then 'boot_error'
    when metadata.execution_id is null
    and metadata.function_id is null then 'internal_failure'
  end as error_type
from
  function_edge_logs
  cross join UNNEST(metadata) as metadata
  cross join UNNEST(metadata.request) as req
  cross join UNNEST(metadata.response) as res
where status_code = 503
limit 50;
```

Depending on the output, you can use this table to find the appropriate debugging section:

| Value              | Go to                                               |
| ------------------ | --------------------------------------------------- |
| `app_level`        | [app level error](#app-level-error)                 |
| `boot_error`       | [boot error - function cannot compile](#boot-error) |
| `internal_failure` | [platform issue](#platformissue)                    |

## Step 2: Addressing the error

## App level error

Somewhere in your function logic, you are returning a 503 response yourself:

### Example:

```js
return new Response(JSON.stringify(data), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  status: 503, // <-- you set this
})
```

Check your function logic and any third-party API responses for where the 503 is originating.

1. Search your function code for `503`. Look for explicit status codes on `Response` objects
2. Trace the condition that triggered it. If your function calls external APIs, it may be passing along errors returned by those services
3. Add logging before the return so future occurrences leave a trace:

```js
console.error('Returning 503 - reason:', reason)
```

See: [Error handling in Edge Functions](/docs/guides/functions/error-handling)

## Boot error

A [`SyntaxError`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SyntaxError) prevented your code from dynamically compiling.

In the [Function Dashboard](/dashboard/project/_/functions), under the affected function's `Log` tab, you can filter for the key phrase `worker boot error:`. the log will tell you syntax error occurred:

![image](/docs/img/troubleshooting/filter_503.png)

Alternatively, instead of using the Function Dashboard, you can programmatically find boot failure error messages in the [Log Explorer](</dashboard/project/_/logs/explorer?q=SELECT%0A++fl.event_message,%0A++content.timestamp,%0A++fel.function_name,%0A++fel.status_code%0AFROM+function_logs+fl%0ALEFT+JOIN+UNNEST(fl.metadata)+AS+content+ON+TRUE%0ALEFT+JOIN+(%0A++SELECT%0A++++em.function_id,%0A++++em.version,%0A++++req.pathname+AS+function_name,%0A++++res.status_code%0A++FROM+function_edge_logs%0A++LEFT+JOIN+UNNEST(metadata)+AS+em+ON+TRUE%0A++LEFT+JOIN+UNNEST(em.request)+AS+req+ON+TRUE%0A++LEFT+JOIN+UNNEST(em.response)+AS+res+ON+TRUE%0A)+fel+ON+content.function_id+=+fel.function_id%0A++AND+content.version+=+fel.version%0AWHERE+%0A++content.event_type+=+%27BootFailure%27%0AORDER+BY+timestamp,+function_name%0ALIMIT+20;&its=&ite=>) with the below query:

```sql
select
  fl.event_message,
  content.timestamp,
  fel.function_name,
  fel.status_code
from
  function_logs as fl
  left join UNNEST(fl.metadata) as content on true
  left join (
    select
      em.function_id,
      em.version,
      req.pathname as function_name,
      res.status_code
    from
      function_edge_logs
      left join UNNEST(metadata) as em on true
      left join UNNEST(em.request) as req on true
      left join UNNEST(em.response) as res on true
  ) as fel
    on content.function_id = fel.function_id and content.version = fel.version
where content.event_type = 'BootFailure'
order by timestamp, function_name
limit 20;
```

### Example causes

### Redefining constant variables

Redefining a constant value can prevent the code from compiling:

```js name=redeclaring_values
let some_var
const some_var // SyntaxError — already declared
```

The log message for these errors should state the cause `already declared` and the file impacted.

```sh name=log_error_message
worker boot error: Uncaught SyntaxError:
Identifier 'some_var' has already been declared at file:///var/tmp/sb-compile-edge-runtime/source/index.ts:6:7
```

### Key word violations

Some key words can only be used in specific contexts. For instance, the `await` key word can only be used inside `async` functions.

```js name=await_in_non_async_function
(req: Request) => {
  const { name } = await req.json(); // await only works inside async functions
}
```

The log message for these errors should state the cause `Unexpected reserved word` and the file impacted.

```sh name=log_error_message
worker boot error: Uncaught SyntaxError:
Unexpected reserved word at file:///var/tmp/sb-compile-edge-runtime/source/index.ts:6:28
```

### Bad imports: Non-existent modules or named exports

Imports can cause errors if they're not available within the edge function:

```js name=bad_imports
// importing non-existent module
import supabase from 'does_not_exist'

// or accessing non-existent export
import { doesNotExist } from 'jsr:@supabase/functions-js'

doesNotExist()
```

The log message for these errors should state the cause `requested module... does not provide an export` and the file impacted.

```sh name=log_error_message
worker boot error: Uncaught SyntaxError:
The requested module 'jsr:@supabase/functions-js' does not provide an export named 'doesNotExist' at file:///var/tmp/sb-compile-edge-runtime/source/index.ts:2:10”
```

To fix, check the module and its imports to make sure they exist and are supported by Supabase Edge Functions.

If the module worked before, check to see if the most recent release had breaking changes and then only import the working version.

## Platform issue

The edge function runtime is overwhelmed, or the API Gateway is returning its own 503 due to excessive load.

Open a [support ticket](/dashboard/support/new) and include the relevant log output from Step 1.

## Additional resources

- [Logging Edge Function Requests](/docs/guides/functions/logging)
- [Error Handling Edge Functions](/docs/guides/functions/error-handling)
- [Local Debugging with Chrome Dev Tools](/docs/guides/functions/debugging-tools)
- [Quickstart Deployment: Dashboard](/docs/guides/functions/quickstart-dashboard)
- [Quickstart Deployment: CLI](/docs/guides/functions/quickstart)

## Still stuck?

- Check the [Discord](https://discord.com/channels/839993398554656828/1006358244786196510), [Supabase GitHub Discussions](https://github.com/orgs/supabase/discussions), and [Reddit page](https://www.reddit.com/r/Supabase/) for similar reports that can help with debugging
- Open a [support ticket](/dashboard/support/new) for your project if the problem persists and you believe it is a platform issue
