---
title = "Inspecting edge function environment variables"
github_url = "https://github.com/orgs/supabase/discussions/27139"
date_created = "2024-06-09T18:44:40+00:00"
topics = [ "functions", "cli" ]
keywords = [ "logging", "environment", "variables", "secrets", "docker" ]
database_id = "f47c9b0e-f537-4908-8d35-5dd3dc4c5627"

[api]
cli = [ "supabase-init", "supabase-secrets-set", "supabase-secrets-list" ]
---

Sometimes it can be informative to log values from your Edge Functions. This walks you through the process of logging environment variables for inspection, but it can be generalized for all logging.

**Steps:**

1. enable docker

2. Create a local Supabase project

```bash
npx supabase init
```

3. create a .env file in the `supabase` folder

```bash
echo "MY_NAME=Some_name" >> ./supabase/.env
```

4. deploy the newly added secret

```bash
npx supabase secrets set --env-file ./supabase/.env --project-ref <PROJECT REF>
```

5. Run the following CLI command to check secrets:

```
npx supabase secrets list
```

For security reasons, it is not advised to log secrets, but you can log a truncated version just for the reassurance that they're being updated:

```typescript
//logs the function call and the secrets
console.log('Hello from Functions!')

//custom secret
console.log('logging custom secret', Deno.env.get('MY_NAME'))

// default secrets
console.log('logging SUPABASE_URL:', Deno.env.get('SUPABASE_URL').slice(0, 15))

Deno.serve(async (req) => {
  const { name } = await req.json()
  const data = {
    message: `Hello ${name}!`,
  }

  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
})
```

After calling your function, you can check your [edge function logs](/dashboard/project/_/functions/hello-world/logs?s=logging) to observe the logged values. It should look something like this:

> Note: search filters are case sensitive and must be present in the event message.

![image](/docs/img/troubleshooting/a360b417-e0cc-4706-8df4-89af63dcdc70.png)

> Note: excessively long JSON logs may be truncated. If this occurs, use the [JSON.stringify()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) function to convert the JSON object into text. You can then copy and paste the log into a [JSON beautifier.](https://jsonformatter.org/)
