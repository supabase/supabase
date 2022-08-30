# Remix Auth - Supabase Strategy with redirectTo

Authentication using `signInWithEmail` handling redirectTo.

## Setup

1. Copy `.env.example` to create a new file `.env`:

```sh
cp .env.example .env
```

2. Go to https://app.supabase.com/project/{PROJECT}/api?page=auth to find your secrets
3. Add your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE` in `.env`

```env
SUPABASE_SERVICE_KEY="{SERVICE_KEY}"
SUPABASE_URL="https://{YOUR_INSTANCE_NAME}.supabase.co"
```

## Using the Remix Auth & SupabaseStrategy 🚀

SupabaseStrategy provides `checkSession` working like Remix Auth `isAuthenticated` but handles token refresh

You must use `checkSession` instead of `isAuthenticated`

## Example

This is using Remix Auth, `remix-auth-supabase` and `supabase-js` packages.

> Thanks to Remix, we can securely use server only authentication with `supabase.auth.api.signInWithEmail`
>
> This function should only be called on a server (`loader` or `action` functions).
>
> **⚠️ Never expose your `service_role` key in the browser**

The `/login` route renders a form with a email and password input. After a submit it runs some validations and store `user` object, `access_token` and `refresh_token` in the session.

The `/private` routes redirects the user to `/login` if it's not logged-in, or shows the user email and a logout form if it's logged-in.

The `/private/profile` routes redirects the user to `/login?redirectTo=/private/profile` if it's not logged-in, or shows the user email and a logout form if it's logged-in.

If the user go to `/private/profile` and is not logged-in, it'll be redirected here after login success.

**Handle refreshing of tokens** (if expired) or redirects to `/login` if it fails

More use cases can be found on [Remix Auth Supabase - Use cases](https://github.com/mitchelvanbever/remix-auth-supabase#using-the-authenticator--strategy-)

## Related Links

- [Remix Auth](https://github.com/sergiodxa/remix-auth)
- [Remix Auth Supabase](https://github.com/mitchelvanbever/remix-auth-supabase)
- [supabase-js](https://github.com/supabase/supabase-js)
