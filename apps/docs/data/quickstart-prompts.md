# Framework quickstart AI prompts

Source of truth for the copyable “Help me add Supabase…” prompts on each
framework quickstart page.

## Files

| Path                                                                                                         | Role                                              |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| [`quickstart-prompts.json`](./quickstart-prompts.json)                                                       | Prompt text keyed by quickstart filename stem     |
| [`../features/ui/QuickstartAiPrompt.tsx`](../features/ui/QuickstartAiPrompt.tsx)                             | MDX component that looks up and renders the panel |
| [`../internals/markdown-schema/QuickstartAiPrompt.ts`](../internals/markdown-schema/QuickstartAiPrompt.ts)   | Same lookup for guides markdown export            |
| [`.claude/skills/generate-quickstart-prompts`](../../../.claude/skills/generate-quickstart-prompts/SKILL.md) | Agent skill to regenerate JSON + MDX tags         |

## Add a 19th framework

1. Write the prompt string (template below) and add it to
   `quickstart-prompts.json` under the quickstart filename stem.
2. In the quickstart MDX, after frontmatter, add:

   ```mdx
   <QuickstartAiPrompt framework="your-stem" />
   ```

3. Prefer regenerating with `/generate-quickstart-prompts` (skill under the
   monorepo `.claude/skills/`).

## Prompt template

```
Help me add Supabase to my [Framework] project. Create a Supabase project at
database.new and run the instruments table SQL. Then:
1. …
N. Start / run the app.

REFERENCE
https://supabase.com/docs/guides/getting-started/quickstarts/{stem}.md
```

Rules:

- Open with exactly: `Help me add Supabase to my [Framework] project.`
- Include `database.new` and the instruments SQL setup before `Then:`
- One numbered item per quickstart step (skip re-listing the DB setup step)
- End with a `REFERENCE` footer pointing at the production `.md` URL for that guide
