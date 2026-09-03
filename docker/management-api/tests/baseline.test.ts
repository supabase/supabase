import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { baselineConfigFrom } from '../src/baseline.js'

describe('baselineConfigFrom', () => {
  it('reads every allowlisted key with its declared type', () => {
    const config = baselineConfigFrom({
      AUTH_DEFAULT_SITE_URL: 'http://localhost:3000',
      AUTH_DEFAULT_EXTERNAL_GITHUB_ENABLED: 'true',
      AUTH_DEFAULT_DISABLE_SIGNUP: 'false',
      AUTH_DEFAULT_PASSWORD_MIN_LENGTH: '12',
      AUTH_DEFAULT_JWT_EXP: '3600',
      AUTH_DEFAULT_SMTP_PASS: 'p@ss',
    })

    assert.deepEqual(config, {
      SITE_URL: 'http://localhost:3000',
      EXTERNAL_GITHUB_ENABLED: true,
      DISABLE_SIGNUP: false,
      PASSWORD_MIN_LENGTH: 12,
      JWT_EXP: 3600,
      SMTP_PASS: 'p@ss',
    })
  })

  it('ignores unknown keys and unparsable values', () => {
    const config = baselineConfigFrom({
      AUTH_DEFAULT_NOT_A_REAL_KEY: 'x',
      AUTH_DEFAULT_JWT_EXP: '',
      AUTH_DEFAULT_PASSWORD_MIN_LENGTH: 'many',
      AUTH_DEFAULT_DISABLE_SIGNUP: '',
      AUTH_DEFAULT_MAILER_AUTOCONFIRM: 'yes',
      SITE_URL: 'ignored-without-prefix',
    })

    assert.deepEqual(config, {})
  })
})
