## I have read the [CONTRIBUTING.md](https://github.com/supabase/supabase/blob/master/CONTRIBUTING.md) file.

YES

## What kind of change does this PR introduce?

Docs update. A Stripe PM had their agent try to provision a Supabase project via Stripe Projects (the Stripe CLI workflow that lets a human or agent provision a full Supabase project from one command), but the agent couldn't find any reference to it in our docs or `llms.txt` and got misdirected toward the standalone `supabase projects create` path instead. This adds Stripe Projects as a documented, discoverable option: a short peer entry on the Integrations overview (next to the existing Vercel Marketplace entry) plus a focused guide page.

Closes DOCS-1337.

## What is the current behavior?

- Linear item: `DOCS-1337`: Document programmatic project provisioning, with Stripe Projects as a partner example
- No page under `apps/docs/content/**` mentions Stripe Projects. The only existing prose is a blog post and a `/go/` marketing page, neither indexed as docs nor surfaced in `llms.txt` (which is generated purely from `content/guides/**` directory names/titles).
- The Studio-side confirmation flow (`apps/studio/pages/partners/stripe/projects/login.tsx`) already exists and works; the gap is entirely on the docs side.

## What is the new behavior?

- `apps/docs/content/guides/integrations.mdx`: added a "Stripe Projects" section, same weight as the existing "Vercel Marketplace" section (short description + link), so Stripe is presented as one of several provisioning paths rather than singled out.
- `apps/docs/content/guides/integrations/stripe-projects.mdx` (new): Overview, Quickstart (CLI commands from the Stripe Projects blog post), Authorizing the request (the actual Supabase-side confirmation screen behavior), and Limitations.
- `apps/docs/components/Navigation/NavigationMenu/NavigationMenu.constants.ts`: added the new page to the Integrations sidebar nav, alongside Vercel Marketplace.

## Additional context

- Worktree: `~/GitHub/supabase/supabase/.claude/worktrees/docs-1337-stripe-projects`
- Paired eval issue: `DOCS-1338`: a regression eval to be added/run separately, before and after this PR, to confirm agent discoverability actually improves.
- Out of scope: the agent-skills piece (separate `supabase/agent-skills` repo, federated into docs at `content/guides/ai-tools/ai-skills.mdx`) is being picked up separately.
- One line in the new page (org-linking behavior in Limitations) is flagged inline with an MDX comment as inferred from the Supabase-side UI code rather than confirmed against the account-request API schema; worth a sanity check from the Stripe Projects team.
- The first Vercel deploy on this branch failed on an invalid `<!-- -->` HTML comment (not valid MDX); fixed in a follow-up commit to use `{/* */}`.

### Proof: Stripe Projects section and guide render on the docs preview

**Verified:** preview URLs return `200` for `/docs/guides/integrations` and `/docs/guides/integrations/stripe-projects` (curl) · Prettier passes on all three changed files

![integrations-after](https://moijyfpvgnmgoxvwcikq.supabase.co/storage/v1/object/public/pr-proof/supabase/supabase/pr49354/integrations-after-44f7cbe0.png)

![stripe-projects-after](https://moijyfpvgnmgoxvwcikq.supabase.co/storage/v1/object/public/pr-proof/supabase/supabase/pr49354/stripe-projects-after-36c32581.png)

### Before & After

| [Before (production)](https://supabase.com/docs/guides/integrations) | [After (PR preview)](https://docs-git-nikrichers-docs-1337-document-programm-7b3426-supabase.vercel.app/docs/guides/integrations) |
| --- | --- |
| ![Before](https://moijyfpvgnmgoxvwcikq.supabase.co/storage/v1/object/public/pr-proof/supabase/supabase/pr49354/integrations-before-10809028.png) | ![After](https://moijyfpvgnmgoxvwcikq.supabase.co/storage/v1/object/public/pr-proof/supabase/supabase/pr49354/integrations-after-44f7cbe0.png) |

- **Before:** https://supabase.com/docs/guides/integrations
- **After:** https://docs-git-nikrichers-docs-1337-document-programm-7b3426-supabase.vercel.app/docs/guides/integrations
- **New page (no production equivalent):** https://docs-git-nikrichers-docs-1337-document-programm-7b3426-supabase.vercel.app/docs/guides/integrations/stripe-projects

### Test plan

- [ ] Confirm the "Stripe Projects" section renders on [the Integrations overview page (preview)](https://docs-git-nikrichers-docs-1337-document-programm-7b3426-supabase.vercel.app/docs/guides/integrations)
- [ ] Confirm [the new Stripe Projects page (preview)](https://docs-git-nikrichers-docs-1337-document-programm-7b3426-supabase.vercel.app/docs/guides/integrations/stripe-projects) renders and appears in the sidebar under Integrations
- [ ] Confirm the new page surfaces in `llms.txt` (directory/title based)
- [ ] Sanity-check the flagged org-linking limitation with the Stripe Projects team
