# www redirects

Redirects for non-docs URLs on `supabase.com`. Redirects for `/docs` URLs live in [`apps/docs/lib/redirects/`](../../../docs/lib/redirects/README.md).

Sources and destinations are full public paths (for example `/blog/old-post`), or `https://` URLs for external destinations.

| File                    | Contains                                                                                                                | Served by                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `static-redirects.json` | One-to-one mappings: a fixed `source` maps to a fixed `destination`, with no params, splats, regex, or `has`/`missing`. | Next.js `redirects()` in `apps/www/next.config.mjs`, via `index.js` |
| `dynamic-redirects.js`  | Anything with conditional logic: `:param`, `*` / `:path*` splats, regex groups, `has`, or `missing`.                    | Next.js `redirects()` in `apps/www/next.config.mjs`, via `index.js` |
| `index.js`              | Combines both files. Static entries come first, then dynamic ones.                                                      | `next.config.mjs` and `scripts/generateMdContent.mjs`               |

Next.js serves the first rule that matches, so the order matters. Keep a more specific entry in the static file when a dynamic rule would otherwise catch it.

## Adding a redirect

1. If it has no params, splats, regex, or conditions, add it to `static-redirects.json`. Otherwise add it to `dynamic-redirects.js`.
2. In `static-redirects.json`, use the same shape as the existing entries:

   ```json
   { "source": "/old-path", "destination": "/new-path", "permanent": true }
   ```

3. Use `permanent: true` for permanent (308) redirects and `permanent: false` for temporary (307) redirects.
4. JSON does not support comments, so put the reason for a static entry in the PR description.
5. Run `pnpm test` in `apps/www`.

## Checks

`redirects.test.ts` runs in CI and fails when a redirect has any of these problems:

- **Loops:** following the redirect leads back to a path it already passed through.
- **Chains:** the destination is itself redirected, which costs the visitor an extra hop. Point the source at the final destination instead.
- **Duplicate sources:** two unconditional rules share a source, so the second never applies.
- **Invalid locations:** a source or destination that does not start with `/` or `https://`, or a source with an anchor (`#`), which never reaches the server.
- **Misplaced entries:** a `:param`, splat, regex group, `has`, or `missing` in `static-redirects.json`.
- **Missing destinations:** an internal destination that has no page. The check looks at the `app/` and `pages/` routes, the blog, customer, event, alternative, and feature content, `public/` files, markdown twins, and `/docs/guides` pages. Other zones and build-generated files (`/rss.xml`, `/changelog/*`) are not checked.

Rules with a `has` condition, such as the `supabase.design` host rule, are left out of the loop and chain checks, because they only apply to some requests.
