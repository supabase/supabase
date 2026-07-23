---
name: generate-quickstart-prompts
description: >-
  Generate AI-ready "Help me..." prompts for all 18 Supabase framework quickstarts,
  store them in apps/docs/data/quickstart-prompts.json, and wire each quickstart
  MDX with <QuickstartAiPrompt framework="…" />. Use when adding or refreshing
  the AI prompt blocks on quickstart pages.
---

# Generate quickstart prompts

Reads each framework quickstart MDX, generates a concise "Help me add Supabase
to my [Framework] project…" prompt, and writes it into the shared JSON data
file. Each quickstart MDX gets a `<QuickstartAiPrompt framework="…" />` tag
that looks up the string and renders the panel.

See also [`apps/docs/data/quickstart-prompts.md`](../../../apps/docs/data/quickstart-prompts.md).

## Scope

All 18 files in `apps/docs/content/guides/getting-started/quickstarts/*.mdx`.
Auth quickstarts (`guides/auth/quickstarts/`) are out of scope for this skill.

## Prompt template

```
Help me add Supabase to my [Framework] project. Create a Supabase project at
database.new and run the instruments table SQL. Then: 1. [Step 1 — imperative
one-liner with key command]. 2. [Step 2]. … N. Start the app.

REFERENCE
https://supabase.com/docs/guides/getting-started/quickstarts/[framework].md
```

Rules:

- Open with exactly: `"Help me add Supabase to my [Framework] project."`
- Always include `database.new` and the instruments SQL setup before "Then:"
- Derive one numbered item per `<StepHikeCompact.Step>` — condense the step
  title plus the key command/action into a single imperative sentence
- The DB setup step (from `quickstart_db_setup.mdx`) always becomes:
  "Create a Supabase project at database.new and run the instruments table SQL."
  — do not repeat this in the numbered list
- Final numbered item is a start/run instruction for that framework
  (e.g. `npm run dev`, `flutter run`, or Xcode `Cmd + R`)
- Append a `REFERENCE` footer with the production markdown URL for that
  quickstart: `REFERENCE\nhttps://supabase.com/docs/guides/getting-started/quickstarts/{framework}.md`
  (`{framework}` is the filename stem)
- Store the prompt as a normal JSON string (`JSON.stringify` with indent 2)

## Step 1 — Update the JSON data file

**Path:** `apps/docs/data/quickstart-prompts.json`

Shape:

```json
{
  "nextjs": "Help me add Supabase to my Next.js project. …\n\nREFERENCE\nhttps://supabase.com/docs/guides/getting-started/quickstarts/nextjs.md"
}
```

Key is the quickstart filename stem (`nextjs`, `expo-react-native`, …). Value
is the full prompt string including the `REFERENCE` footer.

## Step 2 — Inject the MDX tag into the quickstart

Insert the following after the frontmatter `---`, before the next content block:

```mdx
<QuickstartAiPrompt framework="{framework}" />
```

One blank line after the tag. `QuickstartAiPrompt` is globally registered for
MDX — no imports needed. Markdown export reads the same JSON via
`internals/markdown-schema/QuickstartAiPrompt.ts`.

## Idempotency

Before modifying a quickstart file, check whether it already contains
`<QuickstartAiPrompt framework=` on the first non-blank line after the
frontmatter. If so:

- Skip injection (tag already present)
- Still update the JSON entry if the prompt has changed

## Steps

1. List all `*.mdx` files in
   `apps/docs/content/guides/getting-started/quickstarts/` (skip `_*.mdx`)
2. Load existing `apps/docs/data/quickstart-prompts.json` (or start `{}`)
3. For each file:
   a. Read the file
   b. Extract step titles from `<StepHikeCompact.Details title="…">` attributes
   c. Generate the prompt string using the template above
   d. Set `prompts[framework] = prompt`
   e. Check idempotency — skip tag injection if already present
   f. Otherwise insert `<QuickstartAiPrompt framework="{framework}" />`
   after the frontmatter `---`
   g. Write the modified quickstart file
4. Write `apps/docs/data/quickstart-prompts.json` with indent 2

## Output

After completion, print a table:

| Framework | Steps | JSON updated | Tag injected |
| --------- | ----- | ------------ | ------------ |
| nextjs    | 5     | ✓            | ✓            |
| …         | …     | …            | …            |

Note any files skipped (idempotency) or failed.
