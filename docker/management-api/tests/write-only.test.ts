import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { REDACTED_VALUE, isRedactedWriteOnlyValue, redactWriteOnlyKeys } from '../src/write-only.js'

describe('redactWriteOnlyKeys', () => {
  it('replaces the SMTP password without touching other keys or the input', () => {
    const config = { SMTP_PASS: 'p@ss', SMTP_USER: 'mailer', EXTERNAL_GITHUB_SECRET: 'gh' }
    const redacted = redactWriteOnlyKeys(config)

    assert.equal(redacted.SMTP_PASS, REDACTED_VALUE)
    assert.equal(redacted.SMTP_USER, 'mailer')
    assert.equal(redacted.EXTERNAL_GITHUB_SECRET, 'gh')
    assert.equal(config.SMTP_PASS, 'p@ss')
  })

  it('leaves an unset or empty SMTP password as is', () => {
    assert.deepEqual(redactWriteOnlyKeys({}), {})
    assert.deepEqual(redactWriteOnlyKeys({ SMTP_PASS: '' }), { SMTP_PASS: '' })
  })
})

describe('isRedactedWriteOnlyValue', () => {
  it('only matches the placeholder on write-only keys', () => {
    assert.equal(isRedactedWriteOnlyValue('SMTP_PASS', REDACTED_VALUE), true)
    assert.equal(isRedactedWriteOnlyValue('SMTP_PASS', 'new-pass'), false)
    assert.equal(isRedactedWriteOnlyValue('SMTP_USER', REDACTED_VALUE), false)
  })
})
