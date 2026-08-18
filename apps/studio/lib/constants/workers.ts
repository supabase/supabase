export const PRODUCT_NAME = 'Compute'
export const CLI_NAME = 'compute'

export const WORKERS_CLI_DEPLOY = `supabase ${CLI_NAME} push`

export const WORKERS_SKILL_MARKDOWN = `# Supabase ${PRODUCT_NAME} — agent skill

Deploy and manage backend workers (microVMs) that run next to a Supabase project's Postgres.

## Deploy from config.toml

Add a block to \`supabase/config.toml\`:

\`\`\`toml
[${CLI_NAME}.embed]
runtime   = "python"   # node | deno | bun | python | dockerfile
size      = "2x1"      # 2x1 (2GB/1vCPU) | 4x2 (4GB/2vCPU) — fixed at deploy
access    = "public"   # public | private
instances = 1          # 1..10 per deploy; 100 cap per project
secrets   = ["OPENAI_API_KEY"]   # names only — values live in the Secrets API
\`\`\`

Then run:

\`\`\`bash
supabase ${CLI_NAME} new embed --runtime python
supabase ${CLI_NAME} push embed
\`\`\`

Config precedence: \`--flag\` > \`config.toml\` > interactive prompt > default.

## Conventions

- Workers under \`supabase/${CLI_NAME}/<name>/\` are auto-discovered; the folder name is the slug.
- \`entrypoint\` is inferred from the runtime (node index.js, deno run main.ts, python main.py, Dockerfile CMD).
- \`region\` is locked to us-west-1 at alpha — do not set it.
- Sizes are fixed at deploy time. To change size, delete the worker and redeploy.

## Manage

- \`supabase ${CLI_NAME} list\`
- \`supabase ${CLI_NAME} status <name>\`
- \`supabase ${CLI_NAME} logs <name> --follow\`
- \`supabase ${CLI_NAME} stop <name>\`   # scale to zero (reversible)
- \`supabase ${CLI_NAME} start <name>\`
- \`supabase ${CLI_NAME} delete <name>\`
`
