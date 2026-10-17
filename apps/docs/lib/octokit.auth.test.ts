import crypto from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { githubAuthOptions } from './octokit.auth.js'

const APP_ID = '123456'
const INSTALLATION_ID = '7890'
// PKCS1 on purpose: the App rung has to convert it, and universal-github-app-jwt
// only accepts PKCS8.
const PKCS1_PRIVATE_KEY = crypto
  .generateKeyPairSync('rsa', { modulusLength: 2048 })
  .privateKey.export({ type: 'pkcs1', format: 'pem' })
  .toString()

function stubEnv(env: Record<string, string>) {
  // Empty string rather than `undefined`: some Vitest versions stringify the
  // latter to 'undefined', which is truthy and would silently defeat these tests.
  for (const name of [
    'DOCS_GITHUB_APP_ID',
    'DOCS_GITHUB_APP_INSTALLATION_ID',
    'DOCS_GITHUB_APP_PRIVATE_KEY',
    'GH_TOKEN',
    'GITHUB_TOKEN',
  ]) {
    vi.stubEnv(name, env[name] ?? '')
  }
}

const APP_ENV = {
  DOCS_GITHUB_APP_ID: APP_ID,
  DOCS_GITHUB_APP_INSTALLATION_ID: INSTALLATION_ID,
  DOCS_GITHUB_APP_PRIVATE_KEY: PKCS1_PRIVATE_KEY,
}

describe('githubAuthOptions', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('authenticates as the App and converts the key to PKCS8', () => {
    stubEnv(APP_ENV)
    const options = githubAuthOptions()
    if (!('authStrategy' in options)) throw new Error('expected App auth')
    expect(options.auth).toMatchObject({ appId: APP_ID, installationId: INSTALLATION_ID })
    expect(options.auth.privateKey).toMatch(/^-----BEGIN PRIVATE KEY-----/)
  })

  it('prefers the App when a token is also present', () => {
    stubEnv({ ...APP_ENV, GITHUB_TOKEN: 'ghp_example' })
    expect(githubAuthOptions()).toHaveProperty('authStrategy')
  })

  it.each(['GH_TOKEN', 'GITHUB_TOKEN'])(
    'authenticates with a token from %s when the App is not configured',
    (name) => {
      stubEnv({ [name]: 'ghp_example' })
      expect(githubAuthOptions()).toEqual({ auth: 'ghp_example' })
    }
  )

  it('gives GH_TOKEN precedence over GITHUB_TOKEN, as the gh CLI documents', () => {
    stubEnv({ GH_TOKEN: 'ghp_from_gh', GITHUB_TOKEN: 'ghp_from_actions' })
    expect(githubAuthOptions()).toEqual({ auth: 'ghp_from_gh' })
  })

  it('refuses a partially configured App instead of masking it with a token', () => {
    stubEnv({ DOCS_GITHUB_APP_ID: APP_ID, GITHUB_TOKEN: 'ghp_example' })
    expect(githubAuthOptions).toThrow(/Incomplete GitHub App configuration/)
    // Names what is missing, and not what is already set.
    expect(githubAuthOptions).toThrow(/DOCS_GITHUB_APP_INSTALLATION_ID/)
    expect(githubAuthOptions).toThrow(/DOCS_GITHUB_APP_PRIVATE_KEY/)
    expect(githubAuthOptions).not.toThrow(/DOCS_GITHUB_APP_ID\b/)
  })

  it('reports only the missing App var when one is absent', () => {
    stubEnv({
      DOCS_GITHUB_APP_ID: APP_ID,
      DOCS_GITHUB_APP_INSTALLATION_ID: INSTALLATION_ID,
      GITHUB_TOKEN: 'ghp_example',
    })
    expect(githubAuthOptions).toThrow(/DOCS_GITHUB_APP_PRIVATE_KEY not set\. Set all three/)
  })

  it('names every credential option when none is set', () => {
    stubEnv({})
    expect(githubAuthOptions).toThrow(/DOCS_GITHUB_APP_ID/)
    expect(githubAuthOptions).toThrow(/GH_TOKEN/)
    expect(githubAuthOptions).toThrow(/GITHUB_TOKEN/)
  })
})
