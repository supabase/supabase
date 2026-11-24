# KB redirects

Redirects for `/kb` URLs live here and in `vercel.json`. `apps/kb` is an Astro app that builds to static files, so it has no server-side redirect layer of its own. Astro's `redirects` config would emit meta-refresh HTML pages instead of real 308s, which is why none of these live in `astro.config.mjs`. Vercel serves all of them.

All entries use full public paths, including the `/kb` prefix.

| File                                          | Contains                                                                                                                | Served by                                                                   |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `static-redirects.json`                       | One-to-one mappings: a fixed `source` maps to a fixed `destination`, with no params, splats, regex, or `has`/`missing`. | Source only. Hand-edited.                                                   |
| `generated/static-redirects-md-variants.json` | Build output: `static-redirects.json` plus the generated `.md` variants. Gitignored.                                    | Vercel bulk redirects, through `bulkRedirectsPath` in `apps/kb/vercel.json` |
| `vercel.json` `redirects`                     | Anything with conditional logic (`:param`, splats), the `/` → `/kb` redirect, and the rules that serve generated `.md`. | Vercel project config                                                       |

The `redirects` in `vercel.json` are the KB equivalent of `dynamic-redirects.js` in docs. They are the markdown-serving rules (`/kb/<section>/:path+.md` → `/kb/markdown/<section>/:path+.md`, and `/kb/sitemap.md`) and `/`. See "Pages and markdown export" in `apps/kb/AGENTS.md` before changing them.

## Adding a redirect

1. If it has no params, splats, regex, or conditions, add it to `static-redirects.json`. Otherwise add it to `redirects` in `vercel.json`.
2. In `static-redirects.json`, use the same shape as the existing entries:

   ```json
   { "source": "/kb/guides/old-slug", "destination": "/kb/guides/new-slug", "permanent": true }
   ```

   Do not add a `.md` entry by hand. The generator creates it for every entry whose destination is a path on this site.

3. To preview the Vercel file locally, run:

   ```bash
   pnpm run redirects:generate
   ```

   The build (`redirects:generate` is a turbo dependency of `build`) regenerates it on every deploy, so do not commit it.

4. Use `permanent: true` for permanent (308) redirects and `permanent: false` for temporary (307) redirects.
5. JSON does not support comments, so put the reason for a static entry in the PR description.
6. Keep each source unique across both files.
7. Run `pnpm test` in `apps/kb` to check the file shape.

## Generator

`scripts/generate-static-redirects-md-variants.mjs` builds `generated/static-redirects-md-variants.json` from `static-redirects.json`:

- It adds a `.md` variant for every entry with a destination on this site. Destinations on other sites get none.
- It adds `preserveQueryParams`, because bulk redirects drop the query string by default.
- It fails if a source is duplicated, uses route syntax or a `\` escape, doesn't start with `/kb/`, already ends in `.md`, or has a non-boolean `permanent`.
- It groups each base entry with its `.md` variant, base first, and sorts the groups by base path.

The generator runs as a turbo dependency of `build`, so an invalid source fails the build before anything deploys. The output is gitignored, so generated redirects do not appear in PR diffs.

## Notes

- Bulk redirects run before the redirects in `vercel.json`. A static `.md` entry such as `/kb/guides/old.md` therefore wins over the generic `/kb/guides/:path+.md` rule, which is what makes renamed pages work as markdown.
- Static redirects only apply on Vercel. They do not run in `pnpm dev`, so check them on a preview deployment.
- Troubleshooting guides keep their hash suffix in the slug, so a renamed one needs a static entry for the old slug.
