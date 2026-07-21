---
name: studio-ui-patterns
description: Design system UI patterns for Supabase Studio. Use when building or updating
  pages, forms, tables, charts, empty states, navigation, cards, alerts, or side panels
  (sheets). Covers layout selection, component choice, and placement conventions.
---

# Studio UI Patterns

The Design System docs and demos are the source of truth. Always check the relevant
demo file before composing new UI.

## Layout

Docs: `apps/design-system/content/docs/ui-patterns/layout.mdx`

Build pages with `PageContainer`, `PageHeader`, and `PageSection`.

| Content type      | `size`      |
| ----------------- | ----------- |
| Settings / config | `"default"` |
| Lists / tables    | `"large"`   |
| Full-screen views | `"full"`    |

- If filters/search exist on a list page, align table actions with the filters (don't use `PageHeaderAside`/`PageSectionAside` for those actions)
- If no filters, actions can go in `PageHeaderAside` or `PageSectionAside`

Demos: `page-layout-settings.tsx`, `page-layout-list.tsx`, `page-layout-list-simple.tsx`, `page-layout-detail.tsx`
(all in `apps/design-system/registry/default/example/`)

## Forms

Docs: `apps/design-system/content/docs/ui-patterns/forms.mdx`

- Use `react-hook-form` + `zod`
- Use `FormItemLayout` instead of manually composing `FormItem`/`FormLabel`/`FormMessage`/`FormDescription`
- Wrap inputs with `FormControl_Shadcn_`; use `_Shadcn_` imports from `ui` for primitives

Layout selection:

| Context                                    | Layout                                     | Container                                                  |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------------------------- |
| Page (settings/config)                     | `FormItemLayout layout="flex-row-reverse"` | `Card` (`CardContent` per field; `CardFooter` for actions) |
| Side panel — wide                          | `FormItemLayout layout="horizontal"`       | `SheetSection`                                             |
| Side panel — narrow (`size="sm"` or below) | `FormItemLayout layout="vertical"`         | `SheetSection`                                             |

Dirty state / submit:

- Destructure `isDirty` from `form.formState` to show Cancel and disable Save
- Show loading on submit button via `loading` prop
- If submit button is outside `<form>`, set a stable `formId` and use `form` prop on the button

Demos: `form-patterns-pagelayout.tsx`, `form-patterns-sidepanel.tsx`

## Tables

Docs: `apps/design-system/content/docs/ui-patterns/tables.mdx`

| Pattern    | Use when                                                                |
| ---------- | ----------------------------------------------------------------------- |
| `Table`    | Simple, static, semantic display                                        |
| Data Table | TanStack-powered; sorting, filtering, pagination; composed per use-case |
| Data Grid  | Virtualization, column resizing, or complex cell editing                |

- Actions: above the table, aligned right
- Search/filters: above the table, aligned left
- If table is primary content with no filters, actions can live in the page's primary/secondary actions area

Demos: `table-demo.tsx`, `data-table-demo.tsx`, `data-grid-demo.tsx`

## Charts

Docs: `apps/design-system/content/docs/ui-patterns/charts.mdx`

- Use provided chart building blocks; avoid passing raw Recharts components to `ChartContent`
- Use `useChart` context flags for loading/disabled states
- Keep composition straightforward — avoid over-abstraction

Demos (in `apps/design-system/__registry__/default/block/`): `chart-composed-demo.tsx`, `chart-composed-basic.tsx`, `chart-composed-states.tsx`, `chart-composed-metrics.tsx`, `chart-composed-actions.tsx`, `chart-composed-table.tsx`

## Empty States

Docs: `apps/design-system/content/docs/ui-patterns/empty-states.mdx`

| Scenario                 | Pattern                                                             |
| ------------------------ | ------------------------------------------------------------------- |
| Initial / onboarding     | Presentational empty state with value prop + clear next action      |
| Data-heavy lists         | Informational empty state matching the list/table layout            |
| Zero results from search | Keep layout consistent with data state to avoid jarring transitions |
| Missing route            | Centered `Admonition`                                               |

Demos: `empty-state-presentational-icon.tsx`, `empty-state-initial-state-informational.tsx`, `empty-state-zero-items-table.tsx`, `data-grid-empty-state.tsx`, `empty-state-missing-route.tsx`

## Navigation

Docs: `apps/design-system/content/docs/ui-patterns/navigation.mdx`

- Use `NavMenu` for a horizontal list of related views within a consistent page layout
- Activating an item must trigger a **URL change** — no local-only tab state

## Cards

- Group related information in cards
- `CardContent` for sections, `CardFooter` for actions
- Only use `CardHeader`/`CardTitle` when context isn't already provided by surrounding content
- Use headers/titles when multiple cards represent distinct groups (e.g. multiple settings sections)

## Alerts

- Use `Admonition` to call out important actions, restrictions, or critical context
- Place at the **top of a page's content** (below page title) or **top of the relevant section** (below section title)
- Use sparingly

## Sheets (Side Panels)

Use a `Sheet` when switching pages would be disruptive and the user needs to maintain context (e.g. selecting a row from a list to edit).

Structure:

- `SheetContent` with `size="lg"` for forms needing horizontal layout
- Use `SheetHeader`, `SheetTitle`, `SheetSection`, `SheetFooter`
- Submit/cancel actions go in `SheetFooter`

Forms in sheets:

- `layout="horizontal"` for wider sheets
- `layout="vertical"` for narrow sheets (`size="sm"` or below)
