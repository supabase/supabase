---
id: 'redirect-urls'
title: 'Redirect URLs'
description: 'Set up redirect urls with Supabase Auth.'
subtitle: 'Set up redirect urls with Supabase Auth.'
---

## Overview

Supabase Auth allows you to control how the [user sessions](/docs/guides/auth/sessions) are handled by your application.

<Admonition type="note">

**Looking for OAuth client redirect URIs?**

This guide covers redirect URLs for users signing **into** your application (using social providers like Google, GitHub, etc.). If you're setting up your Supabase project as an **OAuth 2.1 provider** for third-party applications, see the [OAuth Server Redirect URI configuration](/docs/guides/auth/oauth-server/getting-started#redirect-uri-configuration) instead.

</Admonition>

When using [passwordless sign-ins](/docs/reference/javascript/auth-signinwithotp) or [third-party providers](/docs/reference/javascript/auth-signinwithoauth#sign-in-using-a-third-party-provider-with-redirect), the Supabase client library provides a `redirectTo` parameter to specify where to redirect the user after authentication. The URL in `redirectTo` should match the [Redirect URLs](/dashboard/project/_/auth/url-configuration) list configuration.

To configure allowed redirect URLs, go to the [URL Configuration](/dashboard/project/_/auth/url-configuration) page. Once you've added necessary URLs, you can use the URL you want the user to be redirected to in the `redirectTo` parameter.

The Site URL in [URL Configuration](/dashboard/project/_/auth/url-configuration) defines the **default redirect URL** when no `redirectTo` is specified in the code. Change this from `http://localhost:3000` to your production URL (e.g., https://example.com). This setting is critical for email confirmations and password resets.

When using [Sign in with Web3](/docs/guides/auth/auth-web3), the message signed by the user in the Web3 wallet application will indicate the URL on which the signature took place. Supabase Auth will reject messages that are signed for URLs that are not on the allowed list.

In local development or self-hosted projects, use the [configuration file](/docs/guides/local-development/cli/config#auth.additional_redirect_urls). See below for more information on configuring `SITE_URL` when deploying to Vercel or Netlify.

## Use wildcards in redirect URLs

Supabase allows you to specify wildcards when adding redirect URLs to the [allow list](/dashboard/project/_/auth/url-configuration). You can use wildcard match patterns to support preview URLs from providers like Netlify and Vercel.

| Wildcard                 | Description                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `*`                      | matches any sequence of non-separator characters                                                                                           |
| `**`                     | matches any sequence of characters                                                                                                         |
| `?`                      | matches any single non-separator character                                                                                                 |
| `c`                      | matches character c (c != `*`, `**`, `?`, `\`, `[`, `{`, `}`)                                                                              |
| `\c`                     | matches character c                                                                                                                        |
| `[!{ character-range }]` | matches any sequence of characters not in the `{ character-range }`. For example, `[!a-z]` will not match any characters ranging from a-z. |

The separator characters in a URL are defined as `.` and `/`. Use [this tool](https://www.digitalocean.com/community/tools/glob?comments=true&glob=http%3A%2F%2Flocalhost%3A3000%2F%2A%2A&matches=false&tests=http%3A%2F%2Flocalhost%3A3000&tests=http%3A%2F%2Flocalhost%3A3000%2F&tests=http%3A%2F%2Flocalhost%3A3000%2F%3Ftest%3Dtest&tests=http%3A%2F%2Flocalhost%3A3000%2Ftest-test%3Ftest%3Dtest&tests=http%3A%2F%2Flocalhost%3A3000%2Ftest%2Ftest%3Ftest%3Dtest) to test your patterns.

<Admonition type="note" label="Recommendation">

While the "globstar" (`**`) is useful for local development and preview URLs, we recommend setting the exact redirect URL path for your site URL in production.

</Admonition>

### Redirect URL examples with wildcards

| Redirect URL                   | Description                                                                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `http://localhost:3000/*`      | matches `http://localhost:3000/foo`, `http://localhost:3000/bar` but not `http://localhost:3000/foo/bar` or `http://localhost:3000/foo/` (note the trailing slash) |
| `http://localhost:3000/**`     | matches `http://localhost:3000/foo`, `http://localhost:3000/bar` and `http://localhost:3000/foo/bar`                                                               |
| `http://localhost:3000/?`      | matches `http://localhost:3000/a` but not `http://localhost:3000/foo`                                                                                              |
| `http://localhost:3000/[!a-z]` | matches `http://localhost:3000/1` but not `http://localhost:3000/a`                                                                                                |

## Netlify preview URLs

For deployments with Netlify, set the `SITE_URL` to your official site URL. Add the following additional redirect URLs for local development and deployment previews:

- `http://localhost:3000/**`
- `https://**--my_org.netlify.app/**`

## Vercel preview URLs

For deployments with Vercel, set the `SITE_URL` to your official site URL. Add the following additional redirect URLs for local development and deployment previews:

- `http://localhost:3000/**`
- `https://*-<team-or-account-slug>.vercel.app/**`

Vercel provides an environment variable for the URL of the deployment called `NEXT_PUBLIC_VERCEL_URL`. See the [Vercel docs](https://vercel.com/docs/concepts/projects/environment-variables#system-environment-variables) for more details. You can use this variable to dynamically redirect depending on the environment. You should also set the value of the environment variable called NEXT_PUBLIC_SITE_URL, this should be set to your site URL in production environment to ensure that redirects function correctly.

```js
const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    'http://localhost:3000/'
  // Make sure to include `https://` when not localhost.
  url = url.startsWith('http') ? url : `https://${url}`
  // Make sure to include a trailing `/`.
  url = url.endsWith('/') ? url : `${url}/`
  return url
}

const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: getURL(),
  },
})
```

## Email templates when using `redirectTo`

When using a `redirectTo` option, you may need to replace the `{{ .SiteURL }}` with `{{ .RedirectTo }}` in your email templates. See the [Email Templates guide](/docs/guides/auth/auth-email-templates) for more information.

For example, change the following:

```html
<!-- Old -->
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your mail</a>

<!-- New -->
<a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email"
  >Confirm your mail</a
>
```

## Mobile deep linking URIs

For mobile applications you can use deep linking URIs. For example, for your `SITE_URL` you can specify something like `com.supabase://login-callback/` and for additional redirect URLs something like `com.supabase.staging://login-callback/` if needed.

Read more about deep linking and find code examples for different frameworks [here](/docs/guides/auth/native-mobile-deep-linking).

## Error handling

When authentication fails, the user will still be redirected to the redirect URL provided. However, the error details will be returned as query fragments in the URL. You can parse these query fragments and show a custom error message to the user. For example:

```js
const params = new URLSearchParams(window.location.hash.slice())

if (params.get('error_code').startsWith('4')) {
  // show error message if error is a 4xx error
  window.alert(params.get('error_description'))
}
```
