import assert from 'node:assert/strict'
import { test } from 'node:test'

process.env.DATABASE_URL ??= 'postgres://test'
process.env.MANAGEMENT_API_TOKEN ??= 'test-token'
process.env.VAULT_ENC_KEY ??= 'test-encryption-key'
process.env.SELF_URL ??= 'http://management-api:8085'
process.env.API_EXTERNAL_URL ??= 'http://localhost:8000'

const { escapeEnvValue, renderEnvFile, templateTypeFromConfigKey } = await import(
  '../src/envfile.js'
)

function parseGodotenvDoubleQuoted(quoted: string, vars: Record<string, string>): string {
  const inner = quoted.slice(1, -1)
  const unescaped = inner
    .replace(/\\(.)/g, (match, c: string) => (c === 'n' ? '\n' : c === 'r' ? '\r' : match))
    .replace(/\\([^$])/g, '$1')
  return unescaped.replace(
    /(\\)?(\$)(\()?\{?([A-Z0-9_]+)?\}?/g,
    (match, escaped: string | undefined, _dollar, _paren, name: string | undefined) =>
      escaped ? match.slice(1) : name ? (vars[name] ?? '') : match
  )
}

test('renders simple config values with GOTRUE_ prefix', () => {
  const out = renderEnvFile({ DISABLE_SIGNUP: true, SITE_URL: 'http://example.com' }, [])
  assert.match(out, /^GOTRUE_DISABLE_SIGNUP="true"$/m)
  assert.match(out, /^GOTRUE_SITE_URL="http:\/\/example\.com"$/m)
})

test('skips unknown keys', () => {
  const out = renderEnvFile({ NOT_A_REAL_KEY: 'x' }, [])
  assert.ok(!out.includes('NOT_A_REAL_KEY'))
})

test('skips null values', () => {
  const out = renderEnvFile({ SITE_URL: null }, [])
  assert.ok(!out.includes('SITE_URL'))
})

test('converts duration keys to Go duration strings', () => {
  const out = renderEnvFile(
    { SESSIONS_TIMEBOX: 24, SMTP_MAX_FREQUENCY: 60, MFA_PHONE_MAX_FREQUENCY: 10 },
    []
  )
  assert.match(out, /^GOTRUE_SESSIONS_TIMEBOX="24h"$/m)
  assert.match(out, /^GOTRUE_SMTP_MAX_FREQUENCY="60s"$/m)
  assert.match(out, /^GOTRUE_MFA_PHONE_MAX_FREQUENCY="10s"$/m)
})

test('omits zero durations so GoTrue defaults apply', () => {
  const out = renderEnvFile({ SESSIONS_TIMEBOX: 0 }, [])
  assert.ok(!out.includes('SESSIONS_TIMEBOX'))
})

test('escapes newlines and quotes in values', () => {
  const out = renderEnvFile({ SITE_URL: 'a"b\nc' }, [])
  assert.match(out, /^GOTRUE_SITE_URL="a\\"b\\nc"$/m)
})

test('escapes dollar signs so godotenv does not expand them', () => {
  const values = ['pa$$word', 'a${HOME}b', '$HOME', 'back\\slash$1', 'plain', '"$X"\n$Y']
  const vars = { HOME: '/root', X: 'x', Y: 'y' }
  for (const value of values) {
    const escaped = escapeEnvValue(value)
    assert.ok(!/(^|[^\\])\$/.test(escaped.slice(1, -1)), escaped)
    assert.equal(parseGodotenvDoubleQuoted(escaped, vars), value)
  }
})

test('adds redirect URI for enabled OAuth providers', () => {
  const out = renderEnvFile({ EXTERNAL_GITHUB_ENABLED: true }, [])
  assert.match(out, /^GOTRUE_EXTERNAL_GITHUB_ENABLED="true"$/m)
  assert.match(
    out,
    /^GOTRUE_EXTERNAL_GITHUB_REDIRECT_URI="http:\/\/localhost:8000\/auth\/v1\/callback"$/m
  )
})

test('does not add redirect URI for non-OAuth EXTERNAL_*_ENABLED keys', () => {
  const out = renderEnvFile({ EXTERNAL_EMAIL_ENABLED: true }, [])
  assert.ok(!out.includes('EXTERNAL_EMAIL_REDIRECT_URI'))
})

test('template content keys become template URLs instead of inline content', () => {
  const out = renderEnvFile({ MAILER_TEMPLATES_CONFIRMATION_CONTENT: '<p>hi</p>' }, [
    'confirmation',
  ])
  assert.ok(!out.includes('<p>hi</p>'))
  assert.match(
    out,
    /^GOTRUE_MAILER_TEMPLATES_CONFIRMATION="http:\/\/management-api:8085\/templates\/confirmation"$/m
  )
})

test('templateTypeFromConfigKey extracts template type', () => {
  assert.equal(templateTypeFromConfigKey('MAILER_TEMPLATES_CONFIRMATION_CONTENT'), 'confirmation')
  assert.equal(templateTypeFromConfigKey('MAILER_TEMPLATES_EMAIL_CHANGE_CONTENT'), 'email_change')
  assert.equal(templateTypeFromConfigKey('SITE_URL'), null)
})
