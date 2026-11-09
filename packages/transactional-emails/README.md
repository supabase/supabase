# Transactional emails

Prototype email templates for Supabase Compute usage and billing notices.

```bash
pnpm --filter transactional-emails preview   # renders out/index.html
```

The index frames every template next to the subject line it would arrive under. Review the
subjects together: an inbox shows six subject lines, not six emails.

> Values in the previews are illustrative. The pricing they imply is not settled.

## Why these are hand-rolled

`components/Primitives.tsx` is a small subset of [react-email](https://react.email)'s surface,
with matching names, so adopting `@react-email/components` later is an import-path change
rather than a rewrite. It is hand-rolled today only because adding the dependency means a
lockfile change this prototype does not need yet.

Everything renders table-based, inline-styled markup. Outlook has no flexbox, no grid, and no
`<style>` support worth relying on, so layout is tables and every rule is an inline attribute.
Design tokens cannot travel as `var(--brand-default)` either — `theme.ts` holds the same values
resolved to hex, lifted from `packages/ui/build/css/themes/light.css`.

## The lifecycle these sit in

Email is one channel of several, and most of the lifecycle is not email. The table is the full
inventory; the **Email** column marks the six moments that earn one.

| Moment                           | Scope         | Shape      | Channel                                      | Email                     |
| -------------------------------- | ------------- | ---------- | -------------------------------------------- | ------------------------- |
| Compute enabled for an org       | Org           | —          | Email, dashboard                             | `compute-available`       |
| No instances yet                 | Project       | —          | Empty state                                  | —                         |
| First deploy                     | Project       | —          | CLI output                                   | —                         |
| Steady-state usage               | Org + project | Consumable | Meters in Studio, `compute usage` in the CLI | —                         |
| Burn rate projects an overrun    | Org           | Consumable | Banner, email                                | `compute-quota-projected` |
| 80% of quota                     | Org           | Consumable | Banner, advisor, CLI warning on write, email | `compute-quota-warning`   |
| 100%, spend cap off              | Org           | Consumable | Banner, CLI warning, email                   | `compute-quota-overage`   |
| 100%, spend cap on               | Org           | Consumable | Banner, CLI block, email                     | `compute-quota-stopped`   |
| Concurrency cap reached          | **Project**   | Capacity   | Deploy dialog, CLI error                     | —                         |
| Size not on plan                 | Project       | Gate       | Disabled option, CLI error                   | —                         |
| Private instance not on plan     | Project       | Gate       | Disabled option, CLI error                   | —                         |
| Invocation exceeded max duration | Project       | Gate       | Runtime error, logs, advisor                 | —                         |
| Payment overdue                  | Org           | Billing    | Existing restriction ladder                  | existing                  |
| New cycle restores a stopped org | Org           | Recovery   | Email                                        | `compute-quota-reset`     |
| Instance crash or boot failure   | Project       | Error      | Advisor, logs                                | —                         |

Two rules decide that **Email** column.

**Capacity and gate rows never get email.** They are per-project, binary, and hit someone
mid-action who is already looking at an error. An email about a limit you just met in your own
terminal is noise.

**Consumable rows do**, because the quota is org-wide: it can be exhausted at 3am by a
scheduled job in a project the billing owner has never opened. Email is the only channel that
reaches someone who is not currently anywhere.

## Who receives them

Org roles are Owner / Administrator / Developer / Read-only, and billing visibility sits with
the first two. Mailing only those two tells the people who can pay but cannot diagnose, so
every quota email is **org-scoped but project-attributed**: the subject names the org, the body
leads with the ranked projects that consumed it. One email serves both readers — the owner sees
the money, and the project list is what they forward.

## Frequency

Every template fires on a **transition**, never on a state, and at most once per billing cycle.
The projection has a 48-hour floor on its trailing window; without one it cries wolf on any
Tuesday-afternoon spike.

`compute-quota-projected` is deliberately allowed to land _before_ `compute-quota-warning`.
The quota is 500 vCPU-minutes — eight hours and twenty minutes of a single instance — so a
threshold crossed at 80% can leave under two hours of headroom. Rate is the signal; level is
the receipt.

## What is still missing

None of this can fire without a metering rollup that aggregates vCPU-minutes per org per
cycle. The templates and their triggers are a design, not an implementation.
