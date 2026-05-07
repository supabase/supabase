---
title = "Why is my service role key client getting RLS errors or not returning data?"
github_url = "https://github.com/orgs/supabase/discussions/30146"
date_created = "2024-10-28T18:31:39+00:00"
topics = [ "auth", "database" ]
keywords = [ "rls", "service_role", "authorization", "session", "apikey" ]
database_id = "677f0a69-e454-4718-ad92-91053d40c085"
---

A Supabase client with the Authorization header set to the service role API key will ALWAYS bypass RLS. By default the Authorization header is the `apikey` used in `createClient`. If you are getting an RLS error then you have a user session getting into the client or you initialized with the anon key. RLS in enforced based on the `Authorization` header and not the `apikey` header.

Three common cases of the `createClient` `apikey` being replaced by a user session/token:

1. SSR client initialized with service role. The SSR clients are designed to share the user session from cookies. The user session will override the default `apikey` from `createClient` in the `Authorization` header. If you are using SSR, always create a separate server client using supabase-js directly for service role.

2. Edge functions or other server code setting the `Authorization` header in `createClient` options directly to a user token/JWT. When you set the `Authorization` header directly that overrides the default action of using the `apikey` for the `Authorization` header.

3. Server client initialized with service role using `signUp` to create a user or other auth functions. Many auth functions will return a user session to the client making the call. When that happens the `apikey` will be replaced by the user token/JWT in the `Authorization` header. If you are wanting to create a user in a service role client use `admin.createUser()` instead. Otherwise use a separate Supabase client for for service role from other actions.

Also note that adding `service_role` in RLS policies does nothing. Service role will never run the policies to begin with.
