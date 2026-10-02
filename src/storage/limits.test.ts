import { afterEach, describe, expect, it, vi } from 'vitest'

const ENV = { ...process.env }

afterEach(() => {
  process.env = { ...ENV }
  vi.doUnmock('../internal/database/tenant')
  vi.resetModules()
})

// Previous capturing-alternation patterns. Kept as the charset oracle so a rewrite
// cannot silently expand or shrink the accepted set.
const LEGACY_VALID_OBJECT_KEY = /^(\w|\/|!|-|\.|\*|'|\(|\)| |&|\$|@|=|;|:|\+|,|\?)*$/
const LEGACY_VALID_BUCKET_NAME = /^(\w|!|-|\.|\*|'|\(|\)| |&|\$|@|=|;|:|\+|,|\?)*$/

function legacyIsValidKey(key: string): boolean {
  return key.length > 0 && LEGACY_VALID_OBJECT_KEY.test(key)
}

function legacyIsValidBucketName(bucketName: string): boolean {
  return (
    bucketName.length > 0 && bucketName.length < 101 && LEGACY_VALID_BUCKET_NAME.test(bucketName)
  )
}

function findCharsetMismatches(
  currentValidator: (value: string) => boolean,
  legacyValidator: (value: string) => boolean
): string[] {
  const mismatches: string[] = []

  for (let codeUnit = 0; codeUnit <= 0xffff; codeUnit++) {
    const value = `a${String.fromCharCode(codeUnit)}b`
    if (currentValidator(value) !== legacyValidator(value)) {
      mismatches.push(`U+${codeUnit.toString(16).toUpperCase().padStart(4, '0')}`)
    }
  }

  const astralValue = 'a\u{1F600}b'
  if (currentValidator(astralValue) !== legacyValidator(astralValue)) {
    mismatches.push('U+1F600')
  }

  return mismatches
}

describe('enforceDeleteObjectsLimit', () => {
  it('does not enforce the object request cap until hard limits are enabled', async () => {
    process.env.MULTI_TENANT = 'false'
    process.env.REQUEST_HARD_LIMITS_ENABLED = 'false'
    vi.resetModules()

    const { enforceDeleteObjectsLimit, MAX_OBJECTS_PER_REQUEST } = await import('./limits')

    await expect(
      enforceDeleteObjectsLimit('tenant-id', MAX_OBJECTS_PER_REQUEST + 1)
    ).resolves.toBeUndefined()
  })

  it('enforces the default object request cap when hard limits are enabled', async () => {
    process.env.MULTI_TENANT = 'false'
    process.env.REQUEST_HARD_LIMITS_ENABLED = 'true'
    vi.resetModules()

    const { enforceDeleteObjectsLimit, MAX_OBJECTS_PER_REQUEST } = await import('./limits')

    await expect(
      enforceDeleteObjectsLimit('tenant-id', MAX_OBJECTS_PER_REQUEST + 1)
    ).rejects.toMatchObject({
      code: 'InvalidRequest',
      message: `Bulk object requests are limited to ${MAX_OBJECTS_PER_REQUEST} objects per request.`,
    })
  })

  it('uses the tenant delete objects limit in multitenant mode', async () => {
    process.env.MULTI_TENANT = 'true'
    process.env.REQUEST_HARD_LIMITS_ENABLED = 'true'
    const getDeleteObjectsLimit = vi.fn().mockResolvedValue(2000)
    vi.doMock('../internal/database/tenant', () => ({
      getDeleteObjectsLimit,
      getFeatures: vi.fn(),
      getFileSizeLimit: vi.fn(),
    }))
    vi.resetModules()

    const { enforceDeleteObjectsLimit } = await import('./limits')

    await expect(enforceDeleteObjectsLimit('tenant-id', 1500)).resolves.toBeUndefined()
    await expect(enforceDeleteObjectsLimit('tenant-id', 2001)).rejects.toMatchObject({
      code: 'InvalidRequest',
      message: 'Bulk object requests are limited to 2000 objects per request.',
    })
    expect(getDeleteObjectsLimit).toHaveBeenCalledWith('tenant-id')
  })
})

describe('isValidKey', () => {
  const allowedPunctuation = "/!-*'() &$=@;:+,?"
  const typicalKey = 'folder/file-name_01.jpg'

  it('matches the legacy charset for every UTF-16 code unit and an astral character', async () => {
    const { isValidKey } = await import('./limits')

    expect(findCharsetMismatches(isValidKey, legacyIsValidKey)).toEqual([])
  })

  it.each([
    ['a typical object path', typicalKey],
    ['every accepted punctuation character', `file${allowedPunctuation}name`],
    ['underscore from the word-character set', 'file_name'],
    ['a single slash', '/'],
    ['a 1024-character key', `${'a'.repeat(1023)}/`],
  ])('accepts %s', async (_name, key) => {
    const { isValidKey } = await import('./limits')

    expect(isValidKey(key)).toBe(true)
  })

  it.each([
    ['an empty string', ''],
    ['a tab', 'file\tname'],
    ['a newline', 'file\nname'],
    ['DEL', `file${String.fromCharCode(0x7f)}`],
    ['a percent-encoded fragment', 'file%20name'],
    ['S3 characters to avoid', 'file#[]{}^~`"<>\\|'],
    ['a raw unicode name', 'ファイル-emoji-😀.txt'],
  ])('rejects %s', async (_name, key) => {
    const { isValidKey } = await import('./limits')

    expect(isValidKey(key)).toBe(false)
  })
})

describe('isValidBucketName', () => {
  it('matches the legacy charset for every UTF-16 code unit and an astral character', async () => {
    const { isValidBucketName } = await import('./limits')

    expect(findCharsetMismatches(isValidBucketName, legacyIsValidBucketName)).toEqual([])
  })

  it('accepts a 100-character name and rejects 101 characters', async () => {
    const { isValidBucketName } = await import('./limits')

    expect(isValidBucketName('a'.repeat(100))).toBe(true)
    expect(isValidBucketName('a'.repeat(101))).toBe(false)
  })

  it('rejects a slash that would be valid in an object key', async () => {
    const { isValidBucketName, isValidKey } = await import('./limits')

    expect(isValidBucketName('folder/name')).toBe(false)
    expect(isValidKey('folder/name')).toBe(true)
  })
})

describe('parseFileSizeToBytes', () => {
  it('keeps every significant figure of the size', async () => {
    const { parseFileSizeToBytes } = await import('./limits')

    expect(parseFileSizeToBytes('1024MB')).toBe(1_024_000_000)
    expect(parseFileSizeToBytes('2048KB')).toBe(2_048_000)
    expect(parseFileSizeToBytes('1234B')).toBe(1234)
  })

  it('returns whole bytes for every two-decimal size', async () => {
    const { parseFileSizeToBytes } = await import('./limits')
    const bytesPerHundredth = { GB: 10_000_000, MB: 10_000, KB: 10 }

    for (let hundredths = 1; hundredths <= 9999; hundredths++) {
      const size = (hundredths / 100).toFixed(2)
      for (const [unit, bytes] of Object.entries(bytesPerHundredth)) {
        expect(parseFileSizeToBytes(`${size}${unit}`)).toBe(hundredths * bytes)
      }
    }
  })

  it('accepts lowercase units', async () => {
    const { parseFileSizeToBytes } = await import('./limits')

    expect(parseFileSizeToBytes('1.5gb')).toBe(1_500_000_000)
    expect(parseFileSizeToBytes('50mb')).toBe(50_000_000)
  })

  it('rejects a size it cannot parse', async () => {
    const { parseFileSizeToBytes } = await import('./limits')

    for (const size of ['', 'MB', '10', '-1MB', '1.MB', '10TB', '10 MB']) {
      expect(() => parseFileSizeToBytes(size)).toThrow('Invalid file size format')
    }
  })
})
