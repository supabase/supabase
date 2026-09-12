# Adding features to `apps/docs`

Best-practices guidance for adding features to the docs app. Read this
**before** writing code — most "fix it in the next round" review comments
trace back to skipping one of these steps.

The premise: `apps/docs` has accumulated significant surface area already.
Any new file, build step, lint job, or content shape is a permanent
maintenance cost. The goal is to deliver the feature with the smallest
durable footprint by **understanding the existing code first** and
**reusing what's already there**.

## The cost lens

Every change adds one of two things:

- **Reach** — the feature now does more (user-visible value).
- **Surface** — there is now more code, configuration, or vocabulary to
  maintain (recurring cost).

A good change maximizes reach per unit of surface. When a design discussion
stalls, re-frame as: _"Does the user-visible improvement justify the
maintenance cost?"_ If you cannot answer yes confidently, cut scope before
defending the design.

See [`docs-app-direction.md`](./docs-app-direction.md) for the broader
context — the docs app already carries known tech debt, and the maintainer's
stated direction is to reduce surface, not extend it.

## Step 1 — Inventory before you write

Before adding a file, search for what's already there. The docs app has
existing systems for almost every common job; using them is faster than
building parallel ones.

| Need                                        | Look first at                                                                                               |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Rendering MDX with a custom component       | The MDX component map in `features/docs/MdxBase.shared.tsx`                                                 |
| Markdown export of a component              | The schema registry in `internals/generate-guides-markdown.ts` and handlers in `internals/markdown-schema/` |
| Reusable content blocks                     | `<$Partial path="..." />` and `content/_partials/`                                                          |
| Headings / typography                       | `<Heading>` from `MdxBase.shared.tsx`; prose / `not-prose` classes                                          |
| Visual primitives (cards, panels, callouts) | `ui-patterns/GlassPanel`, `ui-patterns/IconPanel`, `ui/Admonition`, etc.                                    |
| Internal vs external link logic             | `withDocsBasePath` / `addBaseUrlPrefix` in `lib/internal-links.ts`                                          |
| Telemetry                                   | `useSendTelemetryEvent` + `packages/common/telemetry-constants.ts`                                          |
| Validation / schemas                        | `zod` schemas under `apps/docs/lib/`                                                                        |
| Code samples in MDX                         | `$CodeSample` directive                                                                                     |
| Build steps                                 | `prebuild` / `postbuild` chain in `apps/docs/package.json`                                                  |
| CI checks                                   | Existing workflows under `.github/workflows/`. See [`ci-and-lint.md`](./ci-and-lint.md).                    |
| Lint rules for MDX content                  | `supa-mdx-lint` configuration — extend it, don't add a new lint job                                         |

If something close to what you need already exists, **the default is to
extend it**, not to build alongside.

## Step 2 — Pick the smallest viable shape

For most feature requests, the shapes in descending order of preference are:

1. **Pure content change** — MDX edit, partial, or data file. No new code.
2. **Configuration of an existing component** — pass a new prop to an
   existing primitive; extend a config object.
3. **A new data shape consumed by existing components** — a typed
   `*.data.ts` module read by an already-registered MDX component.
4. **A thin component that composes existing primitives** — a small file
   that orchestrates `<Link>`, `<GlassPanel>`, `<Heading>`, etc. Adds an
   MDX component-map entry but no new visual primitives.
5. **A new primitive in the design system** — last resort. Justify against
   `packages/ui` / `ui-patterns`.

Move down the list only when the option above genuinely cannot express the
feature. The further down you go, the more you should write down why.

## Step 3 — Reuse pipelines, don't fork them

If a feature has to render in more than one place (HTML + markdown export,
runtime + build, etc.), wire both consumers through a **single shared
shape** — a data registry, a schema, a constant map — instead of
maintaining parallel implementations.

Pattern that works well in this codebase:

- The MDX component reads from a data registry keyed by an `id`.
- The markdown-export handler reads from the _same_ registry, using the
  same `id` carried as a JSX prop.
- The data shape (zod schema) is the single source of truth.

Antipatterns to avoid:

- Two extraction paths that serialize the same content differently.
- A bespoke link-wrapper component when `<Link>` + `<GlassPanel>` already
  covers the pattern — compose at the call site instead.
- New custom build steps that run alongside the existing `prebuild` /
  `postbuild` chain when a hook already exists.
- A new CI workflow when `docs_lint`, `Docs Tests`, or the existing
  typecheck/prettier jobs could absorb the check. See
  [`ci-and-lint.md`](./ci-and-lint.md).
- A new content vocabulary (custom front-matter block, novel MDX directive,
  new YAML schema) when a React component + partial would express the same
  thing.

## Step 4 — Conventions that keep the diff small

These are the patterns most often called out in PR review. None of them
matter individually; together they keep the surface tight.

### File naming

A file's name matches what it exports. If the file exports `Foo`, it's
`Foo.ts(x)`. The directory listing should answer "what's in here?" without
opening the file. Same for handler files in `internals/markdown-schema/` —
the file name is the JSX element name.

### Import aliases

`import { Foo as Bar }` is reserved for genuine name collisions. Aliasing
for "clarity" or "consistency with old naming" adds friction.

### Single-use helpers stay inline

A helper used in one place lives in that place. New files are for shared
code. Wandering helpers in unrelated folders make code hard to find.

### Pure helpers live in `*.utils.ts`

Schema files hold schemas. Data / constant files hold data. Helpers —
including lookups like `getXById` over a constant map — live in
`X.utils.ts`. Predictable location beats "logical grouping by concept."

### Don't override the design system

Use shared primitives (`<Heading>`, `<GlassPanel>`, prose classes) and let
them carry typography and spacing. Adding `text-xl` or `font-semibold` to
a new component is the wrong escape hatch.

### Keep `internals/` out of client and MDX code

`apps/docs/internals/` is for build-time markdown generation. Client
components and the MDX runtime should not import from it. If a function is
needed on both sides, it belongs in `lib/`.

### Markup follows semantics, not visuals

A collection of links is a `<ul>`, regardless of whether it visually
renders as a list or a grid. CSS handles layout; markup handles semantics.

### Collapse near-duplicates with discriminator props

When two components share structure and differ only in classes or markup
details, collapse them. Extract the differences into class-name constants
keyed by the discriminator (`type: 'grid' | 'list'`). Don't ship two
components that are 90% identical.

### Use maps / lookups over arithmetic on known sets

If the input domain is `'h2' | 'h3' | 'h4'`, a `Map` (or `Record<Literal, T>`)
keyed by those literals is clearer than slicing strings and synthesizing
output. Exhaustiveness checking comes along for free.

### Avoid render-time closure churn

Hooks should return _stable_ callbacks (`useCallback`) that consumers
invoke, not curried builders that create a new closure per item per render.
Inline arrow functions at the call site are fine; building closures in a
loop during render is not.

### Be robust on URL / string parsing

`/^https?:\/\//i` is incomplete. Protocol-relative (`//host`), `mailto:`,
`tel:`, and bare schemes are all external. Prefer `new URL(href, base)` or
a regex that covers `^(?:[a-z][a-z0-9+\-.]*:|\/\/)`.

### Keep diffs minimal

Import reordering, prettier reflows, or unrelated whitespace edits in a
feature PR muddy the review. If a file isn't conceptually part of the
change, revert it. Auto-formatter ran on a file you didn't touch? Reset
it.

## Step 5 — Pre-flight before opening the PR

Run through this checklist before pushing:

- [ ] Searched the inventory in Step 1 for existing primitives / pipelines.
- [ ] Picked the smallest shape that delivers the feature (Step 2).
- [ ] Renders consistently across pipelines that share content (Step 3).
- [ ] File and export names match (Step 4 — file naming).
- [ ] No unnecessary helpers, imports, files, or aliases.
- [ ] Typography defers to shared primitives.
- [ ] No `internals/` imports from client / MDX code.
- [ ] Diff contains only changes relevant to the feature.
- [ ] `pnpm format`, `pnpm typecheck`, and the relevant lint job pass.

Replies on review threads move faster when they point to a specific commit
("done in abc1234") than when they explain the reasoning at length.
Expect review to come in **passes** that go progressively deeper — that is
the path to a minimum-surface design, not nitpicking.

## Related

- [`docs-app-direction.md`](./docs-app-direction.md) — broader context on
  the docs app's tech debt and refactoring direction.
- [`app-map.md`](./app-map.md) — where each existing seam lives.
- [`build-pipeline.md`](./build-pipeline.md) — the build steps you should
  consider extending before adding a new one.
- [`ci-and-lint.md`](./ci-and-lint.md) — the CI checks you should consider
  extending before adding a new workflow.
- [`gotchas.md`](./gotchas.md) — specific traps known to bite.
