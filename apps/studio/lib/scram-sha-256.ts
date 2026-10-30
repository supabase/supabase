const ITERATIONS = 4096
const SALT_BYTES = 16

const encoder = new TextEncoder()

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))

const hmacSha256 = async (key: Uint8Array<ArrayBuffer>, message: string) => {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message)))
}

/**
 * Builds the `SCRAM-SHA-256$...` secret Postgres stores for a password (see
 * `scram_build_secret` in the Postgres source), so that the password itself never needs to be
 * sent to the server.
 *
 * This does not apply SASLprep, so only pass ASCII passwords: Postgres normalizes other
 * passwords before hashing them, and a verifier built from the raw text wouldn't match what
 * clients send at login. Use `getRolePasswordForSql` for arbitrary input.
 */
export const buildScramSha256Verifier = async (
  password: string,
  salt: Uint8Array<ArrayBuffer> = crypto.getRandomValues(new Uint8Array(SALT_BYTES)),
  iterations = ITERATIONS
) => {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const saltedPassword = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
      passwordKey,
      256
    )
  )

  const clientKey = await hmacSha256(saltedPassword, 'Client Key')
  const storedKey = new Uint8Array(await crypto.subtle.digest('SHA-256', clientKey))
  const serverKey = await hmacSha256(saltedPassword, 'Server Key')

  return `SCRAM-SHA-256$${iterations}:${toBase64(salt)}$${toBase64(storedKey)}:${toBase64(serverKey)}`
}

/**
 * Returns the value to put in a role's `password` clause. ASCII passwords are sent as a
 * precomputed SCRAM-SHA-256 verifier so the plaintext stays out of the SQL, and with it the
 * server logs. Anything else is returned as is for Postgres to normalize and hash, because
 * SASLprep is not applied here.
 */
export const getRolePasswordForSql = async (password: string) => {
  const isAscii = /^\p{ASCII}*$/u.test(password)
  return isAscii ? buildScramSha256Verifier(password) : password
}
