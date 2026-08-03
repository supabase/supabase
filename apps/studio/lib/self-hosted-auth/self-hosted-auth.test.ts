import { describe, it, expect } from 'vitest'
import { configEnvMap, envConfigMap } from './config-map'
import { processSecretUpdates } from './secrets'
import { validateSmtpPort, validateHookUrl } from './validation'

describe('Config Maps', () => {
  it('should map facebook to FACEBOOK_SECRET', () => {
    expect(configEnvMap['external_facebook_secret']).toBe('FACEBOOK_SECRET')
    expect(envConfigMap['FACEBOOK_SECRET']).toBe('external_facebook_secret')
  })
})

describe('Secrets processing', () => {
  it('should process clear_ flags', () => {
    const payload = {
      smtp_pass: '',
      clear_smtp_pass: true,
      external_google_secret: 'new-secret',
    }
    const result = processSecretUpdates(payload)
    expect(result).toEqual({
      smtp_pass: '',
      external_google_secret: 'new-secret',
    })
  })
})

describe('Validation', () => {
  it('should validate SMTP port correctly', () => {
    expect(validateSmtpPort('587')).toBeNull()
    expect(validateSmtpPort('587abc')).not.toBeNull()
    expect(validateSmtpPort('-1')).not.toBeNull()
    expect(validateSmtpPort('65536')).not.toBeNull()
  })

  it('should validate Hook URIs correctly', () => {
    expect(validateHookUrl('https://example.com')).toBeNull()
    expect(validateHookUrl('http://localhost')).toBeNull()
    expect(validateHookUrl('pg-functions://postgres/public/my_func')).toBeNull()
    expect(validateHookUrl('ftp://invalid')).not.toBeNull()
  })
})
