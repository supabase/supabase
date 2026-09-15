/**
 * Design guidance for generated pages.
 *
 * Structured in three parts, in the order the model needs them:
 *
 * 1. `CRAFT` — rules that hold whatever the page looks like. Mostly about hierarchy and
 *    copy, plus a named list of the patterns that make a page read as machine-generated.
 * 2. `STUDIO_DESIGN` — the default: how to build a page that belongs in the dashboard.
 * 3. `CUSTOM_DESIGN` — only after the user asks for a different look.
 *
 * Splitting them matters more than it looks. The single blob these replaced left the model
 * to infer which sentences applied when, and the inference it made was "all of them,
 * always" — which is why a request for a custom look still produced Studio cards, and why
 * Studio pages inherited flourishes meant for custom ones. The `design` field on
 * `render_page` now makes that choice explicit, and these two bodies are what it selects
 * between.
 *
 * Rules are phrased as what to do rather than what to avoid wherever a positive form
 * exists. Prohibitions are the first thing a smaller model drops, and "do not wrap each
 * metric in a card" gives it nothing to do instead. Mechanical rules that survived being
 * stated here and were violated anyway now live in `tools/generated-page-markup.ts`, where
 * they are checked rather than asked for.
 */

/** Applies to every generated page, Studio-default or custom. */
const GENERATED_PAGE_CRAFT_PROMPT = `
### Plan before you build
Fill in \`design\`, \`layout\`, and \`design_plan\` before writing any markup — the plan is what the page is judged against, so write it honestly rather than describing the page type back. Name the one thing the page leads with, the order of everything after it, and what you are leaving out. If the plan reads like something you would write for any page of this shape, it is not yet a plan: make it specific to this project's data and this user's question.

### Hierarchy is the design
- **Lead with the answer.** The fact the user came for goes at the top, at the largest size on the page. Everything else is ordered by how much it helps interpret that fact. Never bury the key number under rows of secondary detail.
- **Spend emphasis once.** One element is the memorable thing; everything around it stays quiet. A page where three regions all shout has no hierarchy at all. One primary action per page; secondary actions stay quiet.
- **Group with space first.** Three tools create grouping, in order of preference: negative space (the default — related things sit close, unrelated things far apart); a bordered surface (only where a group must read as one unit); a divider line (last resort, for dense data like tables and long lists where space is too expensive). Keep the gap between groups at least twice the gap within a group, or the eye cannot find the boundary.
- **Structure carries information.** A border, divider, badge, number, or label earns its place by encoding something true about the content. The right side of a section header is for controls that act on the section, not for a caption restating what the heading already said. Numbered markers mean the content is a sequence. A badge means a real status. Applied for visual interest, each one is noise that costs the reader attention.
- **Align to shared edges.** Pick a small set of alignment edges and put everything on them. A stray edge reads as sloppiness even when nobody can name it.
- **Never show more than the user needs at once.** Push long technical detail into a disclosure. A short page that links or expands into depth beats a long page that shows everything at one level.

### Patterns that read as machine-generated
These appear regardless of subject, which is what makes them tells rather than choices. Avoid them unless the user asked for one:
- Content chopped into identical surfaces: every metric, filter, or list item in its own bordered box, all at the same size and radius.
- A summary strip that restates figures shown in full below it.
- Tracked-out uppercase eyebrow labels above headings; metadata joined with middle dots; labels built as "WORD — fragment"; an arrow appended to button and link text.
- Decorative icon tiles, gradient washes, and hover transitions on every surface.
- A status banner that announces success and then stays on screen. Remove transient confirmations once loading finishes; keep only states that still mean something.
- Tracked-out uppercase mini-labels standing in for headings, or a hero heading far larger than anything Studio uses.

### Copy is design content
- Name things as the user understands them, not as the system implements them. Plain terms over internal vocabulary.
- Active voice, sentence case, no filler. A button says what happens when it is pressed — "Refresh data", not "Submit" — and keeps the same word through the flow, so the control that says "Export" produces a result that says "Exported".
- An error says what went wrong and what to do next, in the interface's voice. It does not apologize and is never vague. Show the actual error text you received.
- An empty state is an invitation to act, not a shrug. Say what would appear here and how to make it appear.
- Give every figure its units and its time range. A number without either is unreadable.
`

/** The default. Selected by `design: 'studio'`. */
const GENERATED_PAGE_STUDIO_DESIGN_PROMPT = `
## Studio design (design: "studio")
This is the default and applies unless the user asked for something else. The page should look like it was always part of the dashboard: restrained surfaces, normal heading sizes, the injected palette, and no decoration that is not carrying information.

### Writing the CSS
There is no component library, no Tailwind, and no React in the frame. The page gets Studio's theme variables and base element styles — a plain \`<h2>\` is already the right size — and you write everything else as ordinary CSS in one \`<style>\` block. Build only the few pieces this page needs; do not recreate a design system.

Match Studio's geometry so the page reads as part of the dashboard:
- Controls — buttons, inputs, selects — are 34px tall with \`var(--radius-md)\` corners and a \`1px solid var(--input)\` border. On a coarse pointer give them 44px and at least 16px text so they are not zoomed into.
- Space sections about 40px apart and content within a section about 20px, keeping the gap between groups at least twice the gap inside one. Cap the reading column around 1200px and center it; go full width only for wide data, and narrower for a focused form.
- A surface that genuinely needs to read as one unit gets \`background: var(--card)\`, a \`1px solid var(--border)\`, and \`var(--radius-lg)\` — nothing more. No shadows, no gradients, no hover lift.
- Focus is visible everywhere: \`outline: 2px solid var(--ring); outline-offset: 2px\`.

### Typography
A small, fixed scale. Too many sizes reads as noise rather than hierarchy; too few reads as an undesigned wall of text. Both are tells.

The injected styles already implement the scale. Use the right element and you do not need to set a font size at all:

- **Body (\`--text-base\`) carries most of the page**: paragraphs, labels, table cells, and panel titles.
- **Section headings step up to \`--text-xl\` — that is \`<h2>\`.** Sections need a visible step above body text; weight alone is not enough to separate them. Below that, \`<h3>\`–\`<h6>\` sit at body size and separate by weight, so a panel title inside a section does not compete with the section's own heading.
- **One step down (\`--text-sm\`) for secondary text**: descriptions, units, captions, metadata, the label under a figure.
- **The largest step is spent once.** \`--text-2xl\` or larger belongs either to the page's \`<h1>\`, when it has one, or to the single prominent figure the page leads with — not both, and never to a row of equal-weight metrics. Spending it four times means nothing is prominent.
- **Semibold (\`var(--font-weight-semibold)\`) is the heaviest weight on the page.** 400 for body, 500 for quiet emphasis, 600 for headings and the expressive figure. No bold, no black, no letter-spaced uppercase.
- That is four steps in total and most pages use three. Do not invent a fifth by restyling the injected sizes or reaching for \`--text-lg\`; if something needs to stand out, change its weight or give it space.

### Page title and description
Add an \`<h1>\` and a description **only when the page cannot explain itself**. Explorer already shows the page's name in its tab, so a title that restates it is a wasted line at the top of every page. A dashboard whose first section is clearly labelled, or a table whose columns say what it holds, starts at the content. When a description does earn its place, it says something the content does not — the time window, the data's source, a caveat — in one sentence at \`--text-sm\`. A section heading follows the same test: keep it when it names something the content does not already make obvious, and drop the sentence underneath that only rephrases it.

### Tables
Most generated pages are mostly table, and a table is where the width goes wrong. Decide what each column holds before writing the markup, then size the columns to that.

- **Give every column the width its content needs, and the leftover to the one that reads as prose.** Let short columns size to their content (\`width: 1%; white-space: nowrap\` on the cell) so the message, path, or error column keeps the remaining space with a \`min-width\` around 16rem. A layout where one column wraps every few characters while another sits half empty is the most common way a generated table fails.
- **Never wrap a value character by character.** \`overflow-wrap: anywhere\` and \`word-break: break-all\` belong on one deliberately chosen prose column, never on the table. A URL, id, or JSON blob broken mid-token is unreadable — give it room, truncate it, or move it out of the table.
- **Long values get a summary in the cell and the full text in a \`<details>\`.** Show the part that distinguishes this row — the path, the error message, the id's last segment — not the whole URL or the raw payload. Letting an unformatted value set the column width is what starves every other column.
- **Format timestamps; never print the raw value.** Query results arrive as ISO strings or epoch numbers. Render a readable local date and time — and for rows within a day, the time alone with the date in the header — inside \`<time datetime="...">\` carrying the original. \`2026-09-14T07:58:31.752000\` is not a date the reader can use.
- **Every column earns its place.** If a status, path, or id already appears in another column, do not repeat it. Two columns showing the same thing cost width the prose column needed.
- Headers stay on one line, in \`var(--muted-foreground)\` at medium weight. Numbers and identifiers align on their trailing edge with \`font-variant-numeric: tabular-nums\`; identifiers use \`var(--font-mono)\` at the text size, not smaller. Wrap the table in a \`overflow-x: auto\` container so a wide table scrolls rather than crushing its columns.
- Keep headers, filters, and the result count in place when there are no rows, and put the empty message in the table's own body.

Use semantic HTML and let it do the work: \`<table>\` for tabular data, \`<dl>\` for label/value pairs, \`<details>\` for long technical detail, \`<time>\` for timestamps, \`<button type="button">\` for actions. Toggle states with the \`hidden\` attribute. Write the sorting, filtering, and pagination yourself in JavaScript over the rows you already fetched.

### Color
Use the injected Studio variables for every color: backgrounds, text, borders, shadows, gradients, hover/focus/disabled states, SVG fills and strokes, and any color assigned in JavaScript. \`var(--background)\`, \`var(--foreground)\`, \`var(--card)\`, \`var(--border)\`, \`var(--muted-foreground)\`, \`var(--destructive)\`, \`var(--warning)\`. Derive tints with \`color-mix(in oklab, var(--primary) 12%, transparent)\` rather than guessing a neutral. Do not add literal fallbacks inside \`var()\` — the variables are always present. A local alias may reference a token (\`--panel-bg: var(--card)\`). Semantic tokens are complete colors; only the legacy brand scale takes channels, as \`hsl(var(--brand-link))\`.

Charts are the one exception. Where a visualization needs concrete values no token provides, declare them once as \`--chart-*\` custom properties and reference those everywhere. For a Canvas or chart API that demands a resolved string, read it at runtime with \`getComputedStyle(document.documentElement).getPropertyValue('--chart-1').trim()\` rather than pasting a value into the source. Use color only to mark real warning and error states, always alongside text.

### Composition by layout
Take these as relationships between content, not templates. Include only what answers the user's question — never add a table, metric strip, or summary because it appears here.
- **dashboard:** group each subject's label, figures, and chart together so they read as one thing. A few coherent panels beat a detached metric strip above unrelated charts. Give the dominant chart the space it needs. Put the time range and freshness near the heading. Add recent events only where they help investigate what the chart shows.
- **table:** filters and actions side by side above the table, with the result count and any pagination nearby. Column sizing and long values are covered under Tables above.
- **detail:** lead with the record or the question itself, then order facts by how much they explain it. Inline facts for metadata, a list or table for repeated evidence, a disclosure for long technical detail. Name sections for their actual content rather than "Summary" and "Evidence".
- **form:** one column, fields in the order the user thinks about them, related fields grouped by spacing. Validation messages next to their field. The primary action sits at the end, with a quiet secondary beside it.

### Before you submit
Check the page against your own \`design_plan\`, then check the hierarchy: is the most important thing the most prominent thing? Remove every surface, badge, and heading that is not carrying information. Confirm the narrow layout, keyboard operation, and the loading, empty, and error state of every query-dependent region — the loading state carrying \`role="status"\` and the error state \`role="alert"\`.
`

/** Selected by `design: 'custom'`, which requires the user to have asked. */
const GENERATED_PAGE_CUSTOM_DESIGN_PROMPT = `
## Custom design (design: "custom")
Only when the user asked for a different look. Record what they asked for in \`custom_design_request\`, and let it decide every axis it touches.

- **Scope the change to the request.** A request to change density, layout, or one color changes that and leaves the rest of the Studio design alone. A request for a different aesthetic — a terminal, a printed report, a particular brand, something playful — authorizes a complete departure: layout, type, color, density, and component styling together. Do not make the user ask for each part separately, and do not steer them back toward Studio defaults once they have asked.
- **Make deliberate choices, not different defaults.** Where the request pins something down, follow it exactly. Where it leaves an axis free, choose for this project's actual subject matter rather than reaching for a generic alternative look. Generated pages cluster hard around a few: cream background with a serif display and a warm clay accent; near-black with one acid accent; hairline-ruled broadsheet columns; and identical rounded cards with the same soft grey shadow under each. Each is legitimate if asked for, and a tell if not.
- **Type carries the personality.** One family, or two that are clearly distinct. Set a real scale with intentional weights and spacing, and keep body line length under about 80 characters. The sandbox blocks external fonts, so work with system families or an inline data font.
- **Build to the same floor.** A custom look does not change the sandbox, the approval rules, or the requirements: the page still works at narrow widths, still shows visible keyboard focus, still respects reduced motion, still keeps text readable against its background, and still has a loading, empty, and error state for every query. Motion stays sparse and deliberate — one orchestrated moment, and transitions that answer what the user just did.
- **Override freely.** The kit sits in a low-priority cascade layer, so ordinary CSS beats it — including hover and focus rules — with no \`!important\` and no specificity tricks. Override the classes, write your own, or drop the kit entirely. Define your palette once as custom properties near the top. Watch for selectors that cancel each other out, especially section padding and margins. When you revise an existing custom page, preserve the design it already has.
`

export const GENERATED_PAGE_DESIGN_PROMPT = `
${GENERATED_PAGE_CRAFT_PROMPT}
${GENERATED_PAGE_STUDIO_DESIGN_PROMPT}
${GENERATED_PAGE_CUSTOM_DESIGN_PROMPT}
`
