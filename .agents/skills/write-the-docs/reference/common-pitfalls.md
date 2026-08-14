# Common pitfalls in docs drafts

Patterns to watch for when drafting docs, based on review feedback. These are guidelines, not absolute rules — use judgment based on context.

## 1. Internal business context in open-source docs

**Principle:** Supabase docs are open source. Internal planning context, unshipped features, and business intent shouldn't be visible in the public repo.

**What to watch for:**
- HTML comments referencing PRDs, roadmaps, or internal ticket discussions
- "Gap-fill" notes about what's planned but not shipped
- Internal product strategy or positioning discussions

**Where to put internal context instead:**
- PR description (for review-time context)
- Linear ticket (for product/PM handoff)
- Internal Notion/docs (for roadmap tracking)

## 2. Timeless documentation

**Principle:** Prefer documenting what exists now over promising future features ([Google's timeless documentation](https://developers.google.com/style/timeless-documentation)). Future promises become stale.

**Common patterns to watch for:**
- "Coming soon" / "will be available" / "once finalized"
- "This page is a placeholder"
- "Being rolled out gradually" without concrete eligibility criteria

**Better alternatives:**
- Document what exists today
- Wait to publish until the feature is complete
- If phased rollout is real, be specific: "Available to organizations on Pro and Enterprise plans"

**Context matters:** Changelog and roadmap content naturally references the future — this guidance applies primarily to feature documentation.

## 3. Placeholder pages

**Principle:** Generally avoid shipping pages that explicitly say "This is a placeholder" or "More details coming soon."

**Alternatives:**
- Wait to publish until content is ready
- If navigation structure requires it, link to external resources that are complete
- Ship minimal but useful content (what's true today) rather than promises

**Valid exceptions:** Navigation structure needs, federated docs where the placeholder provides context and links out, cross-references where the page existing (even minimal) provides value.

## 4. Redundancy

**Principle:** Avoid restating the same point in multiple ways.

**Common patterns:**
- Multiple ways of saying the same thing: "It's free" + "You won't be billed" + "No charge"
- Admonition stating a risk, then body text restating it verbatim
- Adjacent sentences that rephrase each other

**How to catch it:** If you can remove a sentence without losing information, it's probably redundant.

## 5. Single-item lists

**Principle:** Prefer paragraphs over single-item bullet lists.

**Why:** Single-item lists can signal incomplete content.

**Valid exceptions:** Layout consistency across sections, future expansion expected, or when the item needs special visual emphasis.

## 6. Restating admonition content

**Principle:** Admonitions and body text should cover distinct points, not repeat each other.

**What to watch for:** An admonition stating a risk/limitation, then the next paragraph restating it verbatim.

## Summary checklist

Before submitting a draft, check:

- [ ] No HTML comments with internal PRD/roadmap/ticket context in MDX
- [ ] Future promises minimized where appropriate (timeless documentation)
- [ ] Placeholder pages avoided where possible
- [ ] No unnecessary redundancy
- [ ] Single-item lists avoided unless there's a reason
- [ ] Admonitions and body text cover distinct points

**Note:** These are guidelines based on review feedback, not absolute rules. Use judgment based on content type, context, and the specific documentation needs. The goal is clearer, more maintainable docs, not rigid adherence to formatting rules.
