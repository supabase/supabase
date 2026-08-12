# Write the docs — checklist mirror

> Mirrors Supabase's proposed "Write the docs" process as of 2026-08-10. Process specifics may evolve — treat this as a snapshot, not a live sync. If this looks stale or contradicts current practice, check with your docs team.

A practical six-stage checklist and quality standard for planning, drafting, and reviewing product documentation.

## What good looks like

- The **why** is explicit: a reader learns what problem this solves and when to reach for it, not only the steps.
- The **content type is deliberate** and consistent within the page.
- **Audience and prerequisites** are stated up front.
- At least one **example is runnable and has been run** (commands, code, expected result).
- **Correct stage** is stated; limitations are named honestly.
- The page **lives in the right place** in the IA and links to and from related pages.
- Terminology and formatting match existing docs (defer to the style guide once one lands).

## 1. Frame

_Skills:_ `/ask-the-docs` to see how the surface works today; `/pm-the-docs` for audience, stage, and cross-cutting scope calls.

- [ ] P: State the product stage (private/public alpha, beta, GA)
- [ ] P: Name the audience and the job they are trying to do
- [ ] P: Write one line on _why_ the feature exists (the problem it solves), not only what it does

## 2. Shape

_Skill:_ `/ask-the-docs` for IA placement, architecture, and where content lives.

- [ ] P: Pick the content type(s): tutorial (learning), how-to (a task), reference (lookup), explanation (the why). Do not mix types on one page (refer to [Diátaxis](https://diataxis.fr/))
- [ ] P: Decide where the page lives in the existing IA and what links in and out (avoid orphan pages)
- [ ] P: List prerequisites and assumed knowledge up front

## 3. Draft

_Skill:_ `/write-the-docs` to draft net-new content grounded in Linear and the code.

- [ ] P: Lead with the why and the outcome, then the how/what (product story first)
- [ ] P: Include at least one runnable, copy-pasteable example that you have actually run
- [ ] E: Contribute technical depth and verify accuracy (APIs, limits, edge cases)
- [ ] P: Call out the current stage inline and any known limitations

## 4. Self-review against the bar

_Skill:_ `/review-the-docs` — [Local self-review](../review-the-docs/SKILL.md#local-self-review-no-open-pr) on your own branch before opening the PR.

- [ ] P/E: Check the draft against "What good looks like" above before opening the PR
- [ ] P/E: Follow authoring-experience standards and tooling when available

## 5. PR review

_Skill:_ `/review-the-docs` to triage, classify, verify the build, and report.

- [ ] P/E: Open the PR and request review per the rules of engagement
- [ ] Docs: Review against the published bar

## 6. Keep it honest

- [ ] P: Keep the product launch checklist's "start on day 1" docs gate honest through ship (update as stage or behavior changes)

## Ask the Docs PM

**Self-serve when:** the checklist above is clear, standards exist, and you know the product stage and audience.

**Ask when:** scope or stage is unclear, you need a review path, the bar is ambiguous, or the launch docs touch cross-cutting surfaces (quickstarts, API keys, tutorials, onboarding, platform concepts).

**What to expect:** the docs PM is the point of contact for questions and review against the bar.

**Where to ping:** your team's PR-review channel and current docs PM — check your contributor guide for who that is today.

## Reference

Role prefixes:

- **P** = Product. The product lead / area PM who writes the docs.
- **E** = Engineering. Contributes technical depth and verifies accuracy.
- **P/E** = Product and Engineering together.
- **Docs** = Docs team, the reviewer.
