const originalAuthEncryptionKey = process.env.AUTH_ENCRYPTION_KEY
const originalEncryptionKey = process.env.ENCRYPTION_KEY
const testEncryptionKey = 'pässwörd🔐'
const plaintext = 'payload-with-unicode-åß∂ƒ 🚀'
const legacyCiphertext =
  'U2FsdGVkX19JcSpAtQJU9fvPXdI8x6Z+4ypCCnuXdgd/Zs58/g+VpYtZbrJxC/IXXfEQuzgK4qamUe5rFiuxsA=='
const deterministicCiphertext =
  'U2FsdGVkX18AAQIDBAUGBygEQu5lvcWZgoqOtz6uMHKNaYgKr4hzXYxDM0EVHrks1kCp7vbFjcIAbNivFk4DzQ=='

process.env.AUTH_ENCRYPTION_KEY = testEncryptionKey
process.env.ENCRYPTION_KEY = testEncryptionKey

let encrypt: typeof import('./crypto').encrypt
let decrypt: typeof import('./crypto').decrypt

beforeAll(async () => {
  ;({ encrypt, decrypt } = await import('./crypto'))
})

afterAll(() => {
  if (originalAuthEncryptionKey === undefined) {
    delete process.env.AUTH_ENCRYPTION_KEY
  } else {
    process.env.AUTH_ENCRYPTION_KEY = originalAuthEncryptionKey
  }

  if (originalEncryptionKey === undefined) {
    delete process.env.ENCRYPTION_KEY
  } else {
    process.env.ENCRYPTION_KEY = originalEncryptionKey
  }
})

describe('auth crypto', () => {
  test('decrypts legacy CryptoJS ciphertext', () => {
    expect(decrypt(legacyCiphertext)).toBe(plaintext)
  })

  test('decrypts fixed-salt CryptoJS ciphertext', () => {
    expect(decrypt(deterministicCiphertext)).toBe(plaintext)
  })

  test('Node encrypt/decrypt roundtrip is stable', () => {
    expect(decrypt(encrypt(plaintext))).toBe(plaintext)
  })
})
