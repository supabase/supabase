---
title: 'Implicit flow'
subtitle: 'About authenticating with implicit flow.'
---

The implicit flow is one of two ways that a user can authenticate and your app can receive the necessary access and refresh tokens.

The flow is an implementation detail handled for you by Supabase Auth, but understanding the difference between implicit and [PKCE flow](/docs/guides/auth/sessions/pkce-flow) is important for understanding the difference between client-only and server-side auth.

## How it works

After a successful signin, the user is redirected to your app with a URL that looks like this:

```
https://yourapp.com/...#access_token=<...>&refresh_token=<...>&...
```

The access and refresh tokens are contained in the URL fragment.

The client libraries:

- Detect this type of URL
- Extract the access token, refresh token, and some extra information
- Persist this information to local storage for further use by the library and your app

## Limitations

The implicit flow only works on the client. Web browsers do not send the URL fragment to the server by design. This is a security feature:

- You may be hosting your single-page app on a third-party server. The third-party service shouldn't get access to your user's credentials.
- Even if the server is under your direct control, `GET` requests and their full URLs are often logged. This approach avoids leaking credentials in request or access logs.

If you wish to obtain the access token and refresh token on a server, use the [PKCE flow](/docs/guides/auth/sessions/pkce-flow).
