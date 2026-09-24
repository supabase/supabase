import { describe, expect, it, vi } from 'vitest'

import {
  getSnowflakeValidationIssues,
  isPrivateKey,
  MAX_PRIVATE_KEY_LENGTH,
  readPrivateKeyFile,
  SNOWFLAKE_PRIVATE_KEY_FORMAT_MESSAGE,
} from './Snowflake.utils'

describe('isPrivateKey', () => {
  it.each([
    ['a plain PKCS#8 key', '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----', true],
    [
      'a PKCS#1 RSA key',
      '-----BEGIN RSA PRIVATE KEY-----\nabc\n-----END RSA PRIVATE KEY-----',
      true,
    ],
    [
      'an encrypted PKCS#8 key',
      '-----BEGIN ENCRYPTED PRIVATE KEY-----\nabc\n-----END ENCRYPTED PRIVATE KEY-----',
      true,
    ],
    [
      'a legacy encrypted RSA key with headers',
      '-----BEGIN RSA PRIVATE KEY-----\nProc-Type: 4,ENCRYPTED\nDEK-Info: AES-128-CBC,ABC\n\nabc\n-----END RSA PRIVATE KEY-----',
      true,
    ],
    [
      'a key using CRLF line endings',
      '-----BEGIN PRIVATE KEY-----\r\nabc\r\n-----END PRIVATE KEY-----',
      true,
    ],
    ['a public key', '-----BEGIN PUBLIC KEY-----\nabc\n-----END PUBLIC KEY-----', false],
    [
      'mismatched BEGIN/END markers',
      '-----BEGIN PRIVATE KEY-----\nabc\n-----END RSA PRIVATE KEY-----',
      false,
    ],
    [
      'a body with no newline before the END marker',
      '-----BEGIN PRIVATE KEY-----\nabc-----END PRIVATE KEY-----',
      false,
    ],
    [
      'trailing content after the END marker',
      '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\nextra',
      false,
    ],
    [
      'a body that is only whitespace',
      '-----BEGIN PRIVATE KEY-----\n   \n-----END PRIVATE KEY-----',
      false,
    ],
    ['plain text', 'not a private key', false],
  ])('returns %s as %s', (_, contents, expected) => {
    expect(isPrivateKey(contents)).toBe(expected)
  })
})

describe('getSnowflakeValidationIssues', () => {
  const VALID_DATA = {
    snowflakeAccountId: 'MYORG-MYACCOUNT',
    snowflakeUser: 'PIPELINES_USER',
    snowflakePrivateKey: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----',
    snowflakeDatabase: 'PIPELINES_DB',
    snowflakeSchema: 'REPLICATED',
  }

  it('flags a pasted private key that is not a real key', () => {
    const issues = getSnowflakeValidationIssues({
      ...VALID_DATA,
      snowflakePrivateKey: 'asdasdasda',
    })

    expect(issues).toContainEqual({
      path: 'snowflakePrivateKey',
      message: SNOWFLAKE_PRIVATE_KEY_FORMAT_MESSAGE,
    })
  })

  it('does not flag a valid private key', () => {
    expect(getSnowflakeValidationIssues(VALID_DATA)).toEqual([])
  })

  it('skips the format check when validatePrivateKeyFormat is false', () => {
    const issues = getSnowflakeValidationIssues(
      { ...VALID_DATA, snowflakePrivateKey: 'asdasdasda' },
      { validatePrivateKeyFormat: false }
    )

    expect(issues).toEqual([])
  })

  it('does not flag an empty private key left blank while editing', () => {
    const issues = getSnowflakeValidationIssues(
      { ...VALID_DATA, snowflakePrivateKey: '' },
      { secretsOptional: true }
    )

    expect(issues).toEqual([])
  })
})

describe('readPrivateKeyFile', () => {
  const PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nprivate-key\n-----END PRIVATE KEY-----'

  const createForm = () => ({
    setError: vi.fn(),
    setValue: vi.fn(),
    clearErrors: vi.fn(),
  })

  const isCurrent = () => true

  it('sets a size error when the file is larger than the limit', async () => {
    const file = new File([PRIVATE_KEY], 'rsa_key.p8')
    Object.defineProperty(file, 'size', { value: MAX_PRIVATE_KEY_LENGTH + 1 })
    const form = createForm()

    await readPrivateKeyFile(file, form, isCurrent)

    expect(form.setError).toHaveBeenCalledWith('snowflakePrivateKey', {
      message: 'Private key must be 10,000 characters or fewer.',
    })
    expect(form.setValue).not.toHaveBeenCalled()
  })

  it('sets a size error when the file contents exceed the limit after reading', async () => {
    const file = new File([PRIVATE_KEY], 'rsa_key.p8')
    const longContents = 'a'.repeat(MAX_PRIVATE_KEY_LENGTH + 1)
    Object.defineProperty(file, 'text', { value: vi.fn().mockResolvedValue(longContents) })
    const form = createForm()

    await readPrivateKeyFile(file, form, isCurrent)

    expect(form.setError).toHaveBeenCalledWith('snowflakePrivateKey', {
      message: 'Private key must be 10,000 characters or fewer.',
    })
    expect(form.setValue).not.toHaveBeenCalled()
  })

  it('sets a format error for a file that is not a private key', async () => {
    const publicKey = '-----BEGIN PUBLIC KEY-----\npublic-key\n-----END PUBLIC KEY-----'
    const file = new File([publicKey], 'rsa_key.pub')
    Object.defineProperty(file, 'text', { value: vi.fn().mockResolvedValue(publicKey) })
    const form = createForm()

    await readPrivateKeyFile(file, form, isCurrent)

    expect(form.setError).toHaveBeenCalledWith('snowflakePrivateKey', {
      message: 'Select a P8 or PEM private key.',
    })
    expect(form.setValue).not.toHaveBeenCalled()
  })

  it('applies the contents of a valid private key file', async () => {
    const file = new File([PRIVATE_KEY], 'rsa_key.p8')
    Object.defineProperty(file, 'text', { value: vi.fn().mockResolvedValue(PRIVATE_KEY) })
    const form = createForm()

    await readPrivateKeyFile(file, form, isCurrent)

    expect(form.setValue).toHaveBeenCalledWith('snowflakePrivateKey', PRIVATE_KEY, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
    expect(form.clearErrors).toHaveBeenCalledWith('snowflakePrivateKey')
    expect(form.setError).not.toHaveBeenCalled()
  })

  it('sets a read error when the file cannot be read', async () => {
    const file = new File([PRIVATE_KEY], 'rsa_key.p8')
    Object.defineProperty(file, 'text', { value: vi.fn().mockRejectedValue(new Error('boom')) })
    const form = createForm()

    await readPrivateKeyFile(file, form, isCurrent)

    expect(form.setError).toHaveBeenCalledWith('snowflakePrivateKey', {
      message: 'Could not read the selected private key.',
    })
  })

  it('discards the result when the request is no longer current', async () => {
    const file = new File([PRIVATE_KEY], 'rsa_key.p8')
    Object.defineProperty(file, 'text', { value: vi.fn().mockResolvedValue(PRIVATE_KEY) })
    const form = createForm()

    await readPrivateKeyFile(file, form, () => false)

    expect(form.setValue).not.toHaveBeenCalled()
    expect(form.setError).not.toHaveBeenCalled()
    expect(form.clearErrors).not.toHaveBeenCalled()
  })
})
