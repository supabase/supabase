import { SUPABASE_FEATURES, type Example } from '@/data/types'

interface GitHubSource {
  cloneUrl: string
  branch: string
  /** Folder inside the repo, empty when the example is the whole repo. */
  path: string
}

/** Splits `https://github.com/<owner>/<repo>/tree/<branch>/<path>` into its parts. */
export function parseGitHubSource(repoUrl: string): GitHubSource {
  const match = repoUrl.match(
    /^https:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+)\/?(.*))?$/
  )
  if (!match) return { cloneUrl: repoUrl, branch: '', path: '' }
  const [, owner, repo, branch = '', path = ''] = match
  return { cloneUrl: `https://github.com/${owner}/${repo}.git`, branch, path }
}

function cloneCommands({ cloneUrl, branch, path }: GitHubSource) {
  const branchFlag = branch ? ` --branch ${branch}` : ''
  if (!path) return `git clone --depth 1${branchFlag} ${cloneUrl} app`
  // Sparse checkout fetches only the example's folder, not the whole repo.
  return [
    `git clone --depth 1 --filter=blob:none --sparse${branchFlag} ${cloneUrl} source`,
    `git -C source sparse-checkout set ${path}`,
    `mv source/${path} app && rm -rf source`,
  ].join('\n   ')
}

/**
 * Builds the prompt a user pastes into their coding agent. The agent fetches
 * the example, creates a Supabase project from its migrations, deploys it to
 * Vercel, then asks what you're building and adapts it.
 */
export function buildStartPrompt(example: Example) {
  const features = example.features.map((feature) => SUPABASE_FEATURES[feature].label).join(', ')
  const stack = example.stack.length > 0 ? `, with ${example.stack.join(', ')}` : ''
  const envNames = example.deploy.env.map((variable) => variable.name)

  return `Set up the Supabase "${example.title}" template (${example.repoUrl}) as a new project for me. It uses Supabase ${features}${stack}, and ships the SQL migrations for its database in supabase/migrations.

1. Fetch the template with plain git, which doesn't run any of its code:
   ${cloneCommands(parseGitHubSource(example.repoUrl))}

2. Work in the new app folder (cd app). Read the README, supabase/migrations and supabase/config.toml before running anything.

3. Create a Supabase project and set it up from the template. Use the Supabase MCP server if it's connected, otherwise the Supabase CLI:
   supabase projects create <name> --org-id <org> --region <region>
   supabase link --project-ref <ref>
   supabase db push
   supabase config push
   Deploy any Edge Functions in supabase/functions (supabase functions deploy), and do any other setup the README lists, such as Vault secrets for Cron jobs.
   Ask me which organization and region to use.

4. Get the project URL and publishable key (supabase projects api-keys --project-ref <ref>) and put them in .env.local as ${envNames.join(' and ')}.

5. Run the app locally and confirm it works against the new project.

6. Deploy it to Vercel: vercel link, add ${envNames.join(' and ')} with vercel env add for every environment, then vercel deploy. Set the deployed URL as the Site URL in the project's Auth settings.

7. Ask me what I'm building, then adapt the schema, row level security policies and UI to it. Make every schema change as a new migration, and keep every table protected by row level security.`
}
