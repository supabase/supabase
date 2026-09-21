import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

process.env.MANAGEMENT_API_TOKEN = process.env.MANAGEMENT_API_TOKEN || 'test-token'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/test'
process.env.VAULT_ENC_KEY = process.env.VAULT_ENC_KEY || 'test-encryption-key'

const { decryptString, encryptString, isEncrypted, isSensitiveConfigKey } = await import(
  '../src/crypto.js'
)

describe('encryption at rest', () => {
  it('round-trips a value', () => {
    const encrypted = encryptString('hello world')
    assert.ok(isEncrypted(encrypted))
    assert.ok(!encrypted.includes('hello world'))
    assert.equal(decryptString(encrypted), 'hello world')
  })

  it('produces a different ciphertext per call', () => {
    assert.notEqual(encryptString('same'), encryptString('same'))
  })

  it('rejects plaintext values', () => {
    assert.throws(() => decryptString('plain-value'))
    assert.ok(!isEncrypted('plain-value'))
  })

  it('rejects tampered ciphertext', () => {
    const encrypted = encryptString('secret')
    const tampered = encrypted.slice(0, -4) + 'AAA='
    assert.throws(() => decryptString(tampered))
  })

  it('round-trips with a context and rejects the wrong context', () => {
    const encrypted = encryptString('secret', 'SMTP_PASS')
    assert.equal(decryptString(encrypted, 'SMTP_PASS'), 'secret')
    assert.throws(() => decryptString(encrypted, 'OTHER_KEY'))
    assert.throws(() => decryptString(encrypted))
  })

  it('round-trips an empty string', () => {
    assert.equal(decryptString(encryptString('', 'K'), 'K'), '')
  })

  it('still decrypts legacy v1 ciphertexts regardless of context', () => {
    const v2 = encryptString('legacy-secret')
    const v1 = `enc:v1:${v2.slice('enc:v2:'.length)}`
    assert.equal(decryptString(v1, 'ANY_CONTEXT'), 'legacy-secret')
  })

  it('rejects malformed structure and bad base64', () => {
    assert.throws(() => decryptString('enc:v2:only-two:parts'))
    assert.throws(() => decryptString('enc:v2:!!:!!:!!'))
    const [, , iv, tag, ct] = encryptString('x', 'K').split(':')
    assert.throws(() => decryptString(`enc:v2:${tag}:${tag}:${ct}`, 'K'))
    assert.throws(() => decryptString(`enc:v2:${iv}:${iv}:${ct}`, 'K'))
  })
})

describe('isSensitiveConfigKey', () => {
  it('flags secret-bearing config keys', () => {
    assert.ok(isSensitiveConfigKey('EXTERNAL_GITHUB_SECRET'))
    assert.ok(isSensitiveConfigKey('SMTP_PASS'))
    assert.ok(isSensitiveConfigKey('HOOK_SEND_SMS_SECRETS'))
    assert.ok(isSensitiveConfigKey('SMS_TWILIO_AUTH_TOKEN'))
    assert.ok(isSensitiveConfigKey('SMS_VONAGE_API_KEY'))
    assert.ok(isSensitiveConfigKey('SECURITY_CAPTCHA_SECRET'))
    assert.ok(isSensitiveConfigKey('SMS_TEST_OTP'))
  })

  it('leaves non-sensitive keys alone', () => {
    assert.ok(!isSensitiveConfigKey('SITE_URL'))
    assert.ok(!isSensitiveConfigKey('EXTERNAL_GITHUB_ENABLED'))
    assert.ok(!isSensitiveConfigKey('SMS_TEST_OTP_VALID_UNTIL'))
  })
})
