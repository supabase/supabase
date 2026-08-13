/**
 * Static copy + agent-facing SKILL markdown for the Workers prototype.
 * Single source of truth so the empty state, docs, and any future skill file
 * stay in sync.
 */

export const WORKERS_DOCS_URL = 'https://supabase.com/docs/guides/workers'

export const WORKERS_CLI_DEPLOY = 'supabase workers deploy'

/**
 * Markdown dropped into an agent so it can deploy and manage workers. Copied
 * verbatim by the "Copy SKILL.md" button on the empty state.
 */
export const WORKERS_SKILL_MARKDOWN = `# Supabase Workers — agent skill

Deploy and manage managed compute (microVMs) that run next to a Supabase project's Postgres.

## Deploy from config.toml

Add a block to \`supabase/config.toml\`:

\`\`\`toml
[workers.embed]
runtime   = "python"   # node | deno | bun | python | dockerfile
size      = "2x1"      # 2x1 (2GB/1vCPU) | 4x2 (4GB/2vCPU) — fixed at deploy
access    = "public"   # public | private
instances = 1          # 1..10 per deploy; 100 cap per project
secrets   = ["OPENAI_API_KEY"]   # names only — values live in the Secrets API
\`\`\`

Then run:

\`\`\`bash
supabase workers deploy embed
\`\`\`

Config precedence: \`--flag\` > \`config.toml\` > interactive prompt > default.

## Conventions

- Workers under \`supabase/workers/<name>/\` are auto-discovered; the folder name is the slug.
- \`entrypoint\` is inferred from the runtime (node index.js, deno run main.ts, python main.py, Dockerfile CMD).
- \`region\` is locked to us-west-1 at alpha — do not set it.
- Sizes are fixed at deploy time. To change size, delete the worker and redeploy.

## Manage

- \`supabase workers list\`
- \`supabase workers logs <name>\`
- \`supabase workers delete <name>\`
`
