export const REPO_ROOT = '/vercel/sandbox'
export const SANDBOX_COMMAND_TIMEOUT_MS = 30_000
export const SANDBOX_OUTPUT_LIMIT_BYTES = 128 * 1024
export const SANDBOX_TIMEOUT_MS = 30 * 60 * 1000

export function isSandboxConfigured(env: Record<string, string | undefined> = process.env) {
  return (
    Boolean(env.VERCEL_OIDC_TOKEN) ||
    Boolean(env.VERCEL_TEAM_ID && env.VERCEL_PROJECT_ID && env.VERCEL_TOKEN)
  )
}
