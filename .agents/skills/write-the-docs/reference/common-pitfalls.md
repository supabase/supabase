# Common pitfalls in docs drafts

Patterns to avoid when drafting docs, grounded in actual review feedback from shipped PRs.

## 1. Internal business context in open-source docs

**Problem:** Leaving HTML comments that reference internal PRDs, roadmaps, ticket discussions, or business strategy in MDX files that ship to production.

**Why it's a problem:** Supabase docs are open source. Internal planning context, unshipped features, and business intent shouldn't be visible in the public repo.

**Examples from real reviews:**

❌ **Bad:**
```mdx
{/* gap-fill: this section paraphrases the PRFAQ's core value prop (Linear project "Multigres - Supabase Integration", PRFAQ doc "PRFAQ - Multigres (HA @ SELECT)") in plain language per the ticket's "no K8s/operator language" requirement. The PRFAQ's own framing goes further (zero-data-loss guarantees, enterprise reliability positioning) than what's confirmed as shipped for Alpha; kept intentionally more modest here since the PRD explicitly states Alpha does not target mission-critical workloads. */}
```

✅ **Good:**
- Remove the comment entirely from MDX
- If it's useful context for reviewers, put it in the PR description instead

**Where to put internal context:**
- PR description (for review-time context)
- Linear ticket (for product/PM handoff)
- Internal Notion/docs (for roadmap tracking)
- NOT in the MDX that ships

## 2. Violating timeless documentation

**Problem:** Promising future features, using "coming soon", or making time-dependent statements that will become stale or wrong.

**Why it's a problem:** Docs get stale. Future promises either never happen (embarrassing) or do happen but the docs never get updated to remove "coming soon" (confusing). Follows [Google's timeless documentation principle](https://developers.google.com/style/timeless-documentation).

**Examples from real reviews:**

❌ **Bad:**
```mdx
A full walkthrough of the creation flow is coming once that experience is finalized.
```
```mdx
<Admonition type="note">
This page is a placeholder. Detailed compatibility notes are coming soon.
</Admonition>
```
```mdx
Availability is being rolled out gradually, so the option to enable it may not yet appear.
```

✅ **Good:**
```mdx
For eligible organizations, an administrator can turn on Multigres when creating a new project.
```
(Either document what exists now, or wait until the complete feature ships)

```mdx
Multigres targets full compatibility with standard Postgres, verified against the pg_regress test suite.
```
(State what's true today; remove the placeholder page entirely until you have the actual content)

**Other timeless violations to avoid:**
- "will be available"
- "once finalized"
- "in the future"
- "soon"
- "planned for [quarter/year]"

**When gradual rollout is real:**
If a feature genuinely has phased eligibility, be concrete:
- ✅ "Available to organizations on Pro and Enterprise plans"
- ✅ "Available to projects in the US region during Public Alpha"
- ❌ "Being rolled out" (to whom? when? how do they know if they have it?)

## 3. Placeholder pages

**Problem:** Shipping a page that says "This is a placeholder" or "More details coming soon."

**Why it's a problem:** A published placeholder signals "we know this is incomplete but we shipped it anyway." It's better to not ship the page at all until you have the real content.

**When placeholder pages make sense:**
- Never for external docs (wait until the content is ready)
- Rarely even for internal docs (a ticket/spec is often better than a stub)

**What to do instead:**
- If the content doesn't exist yet, don't publish the page
- If a stub is required for navigation structure, make it link to the real content elsewhere (e.g. a more complete external resource) rather than saying "coming soon"
- If you must ship a minimal page, make it useful as-is (what's true today) not a promise of future content

## 4. Redundancy

**Problem:** Stating the same point multiple times in slightly different words, often across an admonition and the body text.

**Examples from real reviews:**

❌ **Bad:**
```mdx
<Admonition type="caution">
It's free during the Alpha. You won't be billed for it yet, but pricing may change once it leaves Alpha. Use it at your own risk.
</Admonition>

## What's not included
...

<Admonition type="caution">
Treat this as a one-way decision. Use at your own risk.
</Admonition>
```
("It's free" + "You won't be billed" is redundant. "Use at your own risk" appears twice.)

✅ **Good:**
```mdx
<Admonition type="caution">
It's free during the Alpha for organizations on a paid plan, but pricing may change once it leaves Alpha. It isn't covered by the uptime SLA.
</Admonition>

## What's not included
...

<Admonition type="caution">
Enabling Multigres migrates your project's database to run on Multigres. There's currently no managed path to move it back to a standard Postgres project.
</Admonition>
```
(Each admonition makes a distinct point. No repetition.)

**How to catch redundancy:**
- If an admonition already stated a risk/limitation, don't restate it in the body
- "Free" and "no charge" and "won't be billed" all mean the same thing — pick one
- If a sentence feels like it's just rephrasing the previous sentence, it probably is

## 5. Single-item lists

**Problem:** Using a bullet list when there's only one item.

**Why it's a problem:** A single-item list signals "we know there should be more here but we only have one." It looks incomplete.

**Examples from real reviews:**

❌ **Bad:**
```mdx
## Resources

- [Multigres documentation](https://multigres.com/docs) — architecture, self-hosted deployment, and other technical depth.
```

✅ **Good:**
```mdx
## Resources

[Multigres documentation](https://multigres.com/docs) — architecture, self-hosted deployment, and other technical depth.
```

**When single-item lists are OK:**
- Inside a multi-section layout where each section has a list (for consistency)
- Rarely; default to paragraph format when there's only one item

## 6. Restating content from admonitions

**Problem:** Writing an admonition box with a key point, then repeating that same point in the body text immediately after.

**Why it's a problem:** Readers already saw it in the admonition. Repeating verbatim feels like padding or like the author wasn't sure if the admonition would be read.

**Example from real review:**

❌ **Bad:**
```mdx
<Admonition type="caution">
Multigres is in Public Alpha. It isn't covered by the uptime SLA, and Supabase isn't targeting production or mission-critical workloads with it during this stage.
</Admonition>

## Eligibility

During the Public Alpha, Multigres isn't covered by the uptime SLA and isn't recommended for production workloads.
```

✅ **Good:**
```mdx
<Admonition type="caution">
Multigres is in Public Alpha. It isn't covered by the uptime SLA, and Supabase isn't targeting production or mission-critical workloads with it during this stage.
</Admonition>

## Eligibility

During the Public Alpha:
- Multigres is available to organizations on a paid plan.
- Up to two projects per eligible organization can use Multigres for free during the Alpha.
```
(The Eligibility section covers new information, not a restatement of the admonition)

## Summary checklist

Before submitting a draft, check:

- [ ] No HTML comments with internal PRD/roadmap/ticket context in MDX
- [ ] No "coming soon" or future promises (timeless documentation)
- [ ] No placeholder pages (either ship complete content or don't ship the page)
- [ ] No redundant restatements of the same point
- [ ] No single-item bullet lists (use paragraphs instead)
- [ ] Admonitions and body text cover distinct points, not the same content twice
