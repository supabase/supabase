---
title = "Edge Function 404 error response"
topics = [ "functions" ]
keywords = [ "404", "error" ]
database_id = "a3cfff33-d640-4395-99bc-a110b7fb637c"

[[errors]]
http_status_code = 404
code = "NOT_FOUND"
message = "Requested function was not found"
---

The edge function is not recognized by Supabase

## Context for the error

If the Supabase Edge Function Runtime does not recognize the function specified in the URL endpoint:

```sh
https://PROJECT_REF.supabase.co/functions/v1/UNRECOGNIZED_FUNCTION_NAME
```

then the runtime will return a 404 error.

## Solving the error

### Step 1: Identifying the error

<Admonition type="note">

If the tests return a 404 but do not match the criteria below, the error is coming from your app's logic.

</Admonition>

### Inspecting the return message from the request

<Admonition type="caution">

Platform 404 errors cannot be detected in the browser. Instead, to confirm 404s from the browser, you must [check the logs](#inspecting-the-logs) instead.

Browsers misreport 404s as generic `CORS errors`. As a result, the [Supabase JavaScript client](/docs/reference/javascript/introduction) surfaces only a generic message: `Failed to send a request to the Edge Function`.

</Admonition>

When an edge function fails due to a platform 404 error, it will return the error:

```json
{
  "code": "NOT_FOUND",
  "message": "Requested function was not found"
}
```

### Inspecting the logs

<Admonition type='tip'>

Always configure an appropriate time frame when using the log explorer

        ![image](/docs/img/troubleshooting/edge_function_404_set_timeframe.png)

</Admonition>

You cannot inspect the function dashboard to find platform 404 errors, instead, run the below query in the [log explorer](</dashboard/project/_/logs/explorer?its=&ite=&s=select+distinct%0A++req.pathname+as+function_name,%0A++res.status_code,%0A++CASE+%0A++++WHEN+metadata.execution_id+is+null+THEN+%27FUNCTION_NOT_FOUND%27%0A++++ELSE+%27FUNCTION+RECOGNIZED:+custom+404+message+in+app+logic%27%0A++END+AS+type_of_404%0Afrom%0A++function_edge_logs%0A++cross+join+UNNEST(metadata)+as+metadata%0A++cross+join+UNNEST(metadata.request)+as+req%0A++cross+join+UNNEST(metadata.response)+as+res%0Awhere+status_code+=+404%0Alimit+10;>). The results show all requests that reached Supabase but were rejected as unrecognizable.

```sql
select distinct
  req.pathname as function_name,
  res.status_code,
  case
    when metadata.execution_id is null then 'FUNCTION_NOT_FOUND'
    else 'FUNCTION RECOGNIZED: custom 404 message in app logic'
  end as type_of_404
from
  function_edge_logs
  cross join UNNEST(metadata) as metadata
  cross join UNNEST(metadata.request) as req
  cross join UNNEST(metadata.response) as res
where status_code = 404
limit 10;
```

### Step 2: Check the function for typos

In your code, make sure your function name doesn't have any typos, such as:

- miscapitalization
- em-dashes instead of dashes
- misplaced characters
- unnecessary slashes `///`

### Step 3: Try calling the function from the dashboard

When selecting your function in the [Function Dashboard](/dashboard/project/_/functions), you should have the option to make a test call:

![image](/docs/img/troubleshooting/edge_function_404_test_call.png)

If the call works, consider double checking your code for typos or to see if it is overwriting the function name dynamically. Otherwise, go on to step 4.

### Step 4: Redeploy the function

If step 3 fails, it may be a sign of an internal bug and it may be necessary to redeploy your function. This can be done within the [Function Dashboard](/dashboard/project/_/functions) under the respective function's code tab:

![image](/docs/img/troubleshooting/edge_function_404_redeploy.png)

Alternatively, if you develop locally, you can redeploy the function with the [Supabase CLI](/docs/guides/local-development/cli/getting-started?queryGroups=platform&platform=macos):

```sh
supabase functions deploy FUNCTION_NAME

# If you want to deploy all functions, run the `deploy` command without specifying a function name:
supabase functions deploy
```

Then write in a ticket to [Supabase Support](/dashboard/support/new)

## Additional resources

- [Securing Edge Functions](/docs/guides/functions/auth)
- [Debugging Edge Functions](/docs/guides/functions/logging)
- [Quickstart Deployment: Dashboard](/docs/guides/functions/quickstart-dashboard)
- [Quickstart Deployment: CLI](/docs/guides/functions/quickstart)
