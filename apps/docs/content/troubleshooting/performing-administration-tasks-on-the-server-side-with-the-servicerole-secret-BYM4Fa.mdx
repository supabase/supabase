---
title = "Performing administration tasks on the server side with the service_role secret"
github_url = "https://github.com/orgs/supabase/discussions/15860"
date_created = "2023-07-18T12:25:03+00:00"
topics = [ "auth", "platform" ]
keywords = [ "service_role", "server", "security" ]
database_id = "0d3389c0-5e75-473c-a18b-0699d0911fb2"
---

By default, the auth-helpers/ssr do not permit the use of the `service_role` `secret`. This restriction is in place to prevent the accidental exposure of your `service_role` `secret` to the public. Since the auth-helpers/ssr function on both the server and client side, it becomes challenging to separate the key specifically for client-side usage.

However, there is a solution. You can create a separate Supabase client using the `createClient` method from `@supabase/supabase-js` and provide it with the `service_role` `secret`. In a server environment, you will also need to disable certain properties to ensure proper functionality. See the example code below for the required settings.

By implementing this approach, you can safely utilize the `service_role` `secret` without compromising security or exposing sensitive information to the public.

```ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(supabaseUrl, serviceRoleSecret, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})
```
