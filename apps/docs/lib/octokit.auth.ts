import { createAppAuth } from '@octokit/auth-app'
import crypto from 'node:crypto'

type AppAuth = { appId: string; installationId: string; privateKey: string }

/**
 * Octokit auth options for reading public content from GitHub.
 *
 * Prefers the docs GitHub App (CI and production). Falls back to a personal
 * access token so contributors can run the search index build locally without
 * the App's private key: `GH_TOKEN` then `GITHUB_TOKEN`, matching the
 * precedence the GitHub CLI documents (`gh help environment`), so an
 * already-exported token just works.
 *
 * Both rungs authenticate on purpose: unauthenticated calls are limited to
 * 60 req/hr per IP, which is what caused the flaky CI failures fixed in #43015,
 * and callers here fetch one file per request. Env is read on each call rather
 * than at module scope so the choice reflects the environment at call time.
 *
 * A partially configured App is an error rather than a token fall-back: a
 * rotated-out or misnamed secret would otherwise be masked by whatever token
 * happens to be in the environment, quietly reading as the wrong identity.
 *
 * Deliberately free of `server-only` imports: the search index scripts use this
 * too, and they run outside Next.
 */
export function githubAuthOptions():
  | { authStrategy: typeof createAppAuth; auth: AppAuth }
  | { auth: string } {
  const appId = process.env.DOCS_GITHUB_APP_ID
  const installationId = process.env.DOCS_GITHUB_APP_INSTALLATION_ID
  const privateKey = process.env.DOCS_GITHUB_APP_PRIVATE_KEY

  if (appId && installationId && privateKey) {
    return {
      authStrategy: createAppAuth,
      auth: {
        appId,
        installationId,
        // https://github.com/gr2m/universal-github-app-jwt?tab=readme-ov-file#converting-pkcs1-to-pkcs8
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
  const partiallyConfigured = missing.length < appVars.length
  if (partiallyConfigured) {
    throw new Error(
      `Incomplete GitHub App configuration: ${missing.join(', ')} not set. Set all three, or unset the others to authenticate with GH_TOKEN / GITHUB_TOKEN instead.`
    )
  }

  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN
  if (token) {
    return { auth: token }
  }

  throw new Error(
    'Missing GitHub credentials. Set DOCS_GITHUB_APP_ID, DOCS_GITHUB_APP_INSTALLATION_ID, and DOCS_GITHUB_APP_PRIVATE_KEY, or set GH_TOKEN / GITHUB_TOKEN for a local run (export GH_TOKEN=$(gh auth token)).'
  )
}
