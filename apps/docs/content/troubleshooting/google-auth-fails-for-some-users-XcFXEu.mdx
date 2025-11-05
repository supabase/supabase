---
title = "Google Auth fails for some users"
github_url = "https://github.com/orgs/supabase/discussions/14883"
date_created = "2023-06-07T20:38:48+00:00"
topics = [ "auth" ]
keywords = [ "OAuth", "Google", "credential", "email" ]
database_id = "1ea7b605-dc1d-43d8-a365-5bc2801dd90e"

[api]
sdk = [ "supabase.auth.signInWithOAuth" ]

[[errors]]
http_status_code = 500
code = "server_error"
message = "Error getting user email from external provider"

[[errors]]
http_status_code = 401
code = "UNAUTHENTICATED"
message = "Missing required authentication credential. Expected OAuth 2 access token, login cookie or other valid authentication credential."
---

## Google Auth fails for some users

If you start facing either of these errors:

```
error=server_error&error_description=Error+getting+user+email+from+external+provider

Missing required authentication credential.

Expected OAuth 2 access token, login cookie or other valid authentication credential.

See https://developers.google.com/identity/sign-in/web/devconsole-project.\",\n \"status\": \"UNAUTHENTICATED\"

 }
 "level":"error","method":"GET","msg":"500: Error getting user email from external provider","path":"/callback","referer":"https://accounts.google.com/","remote_addr":"x.x.X.x","time":"2023-06-06T21:46:11Z","timestamp":"2023-06-06T21:46:11Z"}
```

It is happening because some Google Suite requires the explicit request of email Auth Scopes:
`https://www.googleapis.com/auth/userinfo.email`

```js
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google'
  options: {
    scopes: 'https://www.googleapis.com/auth/userinfo.email'
  }
})
```
