import crypto from 'node:crypto'
import { createAppAuth } from '@octokit/auth-app'

/**
 * Prefers the docs GitHub App. Falls back to `GH_TOKEN` / `GITHUB_TOKEN` for
 * local runs. A partially configured App is an error rather than a token
 * fall-back, to avoid silently authenticating as the wrong identity.
 */
export function githubAuthOptions() {
  const appId = process.env.DOCS_GITHUB_APP_ID
  const installationId = process.env.DOCS_GITHUB_APP_INSTALLATION_ID
  const privateKey = process.env.DOCS_GITHUB_APP_PRIVATE_KEY

  if (appId && installationId && privateKey) {
    return {
      authStrategy: createAppAuth,
      auth: {
        appId,
        installationId,
        privateKey: crypto
          .createPrivateKey(privateKey)
          .export({ type: 'pkcs8', format: 'pem' })
          .toString(),
      },
    }
  }

  const appVars: Array<[string, string | undefined]> = [
    ['DOCS_GITHUB_APP_ID', appId],
    ['DOCS_GITHUB_APP_INSTALLATION_ID', installationId],
    ['DOCS_GITHUB_APP_PRIVATE_KEY', privateKey],
  ]
  const missing = appVars.filter(([, value]) => !value).map(([name]) => name)
  if (missing.length < appVars.length) {
    throw new Error(`Incomplete GitHub App configuration: ${missing.join(', ')} not set.`)
  }

  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN
  if (token) return { auth: token }

  throw new Error(
    'Missing GitHub credentials. Set DOCS_GITHUB_APP_ID/_INSTALLATION_ID/_PRIVATE_KEY, or GH_TOKEN / GITHUB_TOKEN.'
  )
}
