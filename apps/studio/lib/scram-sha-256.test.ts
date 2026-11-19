import { createHash, createHmac, pbkdf2Sync } from 'node:crypto'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { buildScramSha256Verifier, getRolePasswordForSql } from './scram-sha-256'

// An independent implementation of how Postgres builds a SCRAM-SHA-256 secret
const referenceVerifier = (password: string, salt: Buffer, iterations: number) => {
  const saltedPassword = pbkdf2Sync(password, salt, iterations, 32, 'sha256')
  const clientKey = createHmac('sha256', saltedPassword).update('Client Key').digest()
  const storedKey = createHash('sha256').update(clientKey).digest()
  const serverKey = createHmac('sha256', saltedPassword).update('Server Key').digest()
  return `SCRAM-SHA-256$${iterations}:${salt.toString('base64')}$${storedKey.toString('base64')}:${serverKey.toString('base64')}`
}

const VERIFIER_PATTERN =
  /^SCRAM-SHA-256\$4096:[A-Za-z0-9+/]{22}==\$[A-Za-z0-9+/]{43}=:[A-Za-z0-9+/]{43}=$/

describe('buildScramSha256Verifier', () => {
  test.each(['pencil', `it's a "secret"`, '100%s%I%%', 'a'.repeat(200)])(
    'matches the reference implementation for %j',
    async (password) => {
      const salt = Buffer.from('W22ZaJ0SNY7soEsUEjb6gQ==', 'base64')

      expect(await buildScramSha256Verifier(password, new Uint8Array(salt), 4096)).toBe(
        referenceVerifier(password, salt, 4096)
      )
    }
  )

  test('uses a new random salt each time', async () => {
    const [first, second] = await Promise.all([
      buildScramSha256Verifier('pencil'),
      buildScramSha256Verifier('pencil'),
    ])

    expect(first).toMatch(VERIFIER_PATTERN)
    expect(second).toMatch(VERIFIER_PATTERN)
    expect(first).not.toBe(second)
  })
})

describe('getRolePasswordForSql', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test.each(['pencil', `it's a "secret"`, 'with space & symbols !@#$%^*()'])(
    'sends a verifier instead of the ASCII password %j',
    async (password) => {
      const result = await getRolePasswordForSql(password)

      expect(result).toMatch(VERIFIER_PATTERN)
      expect(result).not.toContain(password)
    }
  )

  // Postgres applies SASLprep to these before hashing them, which this doesn't, so a
  // verifier built here could stop the role from logging in
  test.each(['pässword', '密码', 'emoji 🔑'])(
    'leaves the non-ASCII password %j as is',
    async (password) => {
      expect(await getRolePasswordForSql(password)).toBe(password)
    }
  )
  // Browsers don't expose crypto.subtle outside secure contexts, such as self-hosted Studio over HTTP
  test('leaves an ASCII password as is when crypto.subtle is unavailable', async () => {
    vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) })

    expect(await getRolePasswordForSql('pencil')).toBe('pencil')
  })
})
