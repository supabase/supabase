import {
  JWT_CACHE_NAME,
  JWT_SIGNING_KEY_CACHE_NAME,
  JWT_VERIFICATION_KEY_CACHE_NAME,
} from '@internal/cache'
import { ErrorCode } from '@internal/errors'
import * as metrics from '@internal/monitoring/metrics'
import * as crypto from 'crypto'
import { SignJWT } from 'jose'
import { vi } from 'vitest'
import { JwksConfig, JwksConfigKey, JwksConfigKeyOCT } from '../../config'
import {
  assertValidNumericJWTExpiration,
  generateES256JWK,
  generateHS512JWK,
  getMaxNumericJWTExpiration,
  isDownloadScopedToken,
  isUploadScopedToken,
  JWT_SIGNING_KEY_CACHE_MAX_ITEMS,
  SIGNED_URL_SCOPE_DOWNLOAD,
  SIGNED_URL_SCOPE_UPLOAD,
  signJWT,
  toPublicJwk,
  verifyJWT,
  verifyJWTWithCache,
} from './jwt'

type TestPublicKey = {
  export: () => JwksConfigKey | Record<string, string>
}

type AsymmetricKeyFixture = {
  alg: 'RS256' | 'ES256' | 'EdDSA'
  kid: string
  publicKey: TestPublicKey
  privateKey: crypto.KeyObject
}

type HmacKeyFixture = {
  alg: 'HS256'
  kid?: string
  publicKey: TestPublicKey
  privateKey: Buffer
}

type KeyFixture = AsymmetricKeyFixture | HmacKeyFixture
type AsymmetricKeyType = 'rsa' | 'ec' | 'ed25519'
type GeneratedKeyPair = {
  publicKey: crypto.KeyObject
  privateKey: crypto.KeyObject
}

const asymmetricKeyPairFactories: Record<AsymmetricKeyType, () => GeneratedKeyPair> = {
  rsa: () => crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }),
  ec: () => crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' }),
  ed25519: () => crypto.generateKeyPairSync('ed25519'),
}

function createAsymmetricKeyFixture(
  type: AsymmetricKeyType,
  alg: AsymmetricKeyFixture['alg'],
  kid: string
): AsymmetricKeyFixture {
  const { publicKey, privateKey } = asymmetricKeyPairFactories[type]()

  return {
    alg,
    kid,
    publicKey: {
      export: () => publicKey.export({ format: 'jwk' }) as JwksConfigKey,
    },
    privateKey,
  }
}

function spyOnImportKey() {
  return vi.spyOn(crypto.webcrypto.subtle, 'importKey')
}

function gateNextImportKey() {
  const originalImportKey = crypto.webcrypto.subtle.importKey.bind(crypto.webcrypto.subtle)
  let releaseImport: () => void = () => undefined
  const importGate = new Promise<void>((resolve) => {
    releaseImport = resolve
  })
  const importKeySpy = spyOnImportKey().mockImplementationOnce(async (...args) => {
    await importGate
    return originalImportKey(...args)
  })
  return { importKeySpy, releaseImport }
}

function stubbedJwtVerify() {
  return vi.fn(async (_token: string, getKey: unknown) => {
    await (getKey as (header: { alg: string }) => Promise<CryptoKey>)({ alg: 'HS256' })
    return { payload: {} }
  })
}

class StubbedSignJWT {
  setIssuedAt() {
    return this
  }

  setExpirationTime() {
    return this
  }

  setProtectedHeader() {
    return this
  }

  sign() {
    return Promise.resolve('token')
  }
}

async function withIsolatedJwtModule<T>(
  joseOverrides: Record<string, unknown>,
  run: (
    jwtModule: typeof import('./jwt'),
    importKeySpy: ReturnType<typeof spyOnImportKey>
  ) => Promise<T>
): Promise<T> {
  vi.resetModules()

  const actualJose = await vi.importActual<typeof import('jose')>('jose')
  vi.doMock('jose', () => ({ ...actualJose, ...joseOverrides }))

  const preparedKey = await crypto.webcrypto.subtle.importKey(
    'raw',
    crypto.randomBytes(32),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
  const importKeySpy = spyOnImportKey().mockResolvedValue(preparedKey)

  try {
    const jwtModule = await import('./jwt')
    // let import-time key usage settle before counting imports
    await new Promise<void>((resolve) => setImmediate(resolve))
    importKeySpy.mockClear()
    return await run(jwtModule, importKeySpy)
  } finally {
    vi.doUnmock('jose')
    vi.resetModules()
  }
}

async function withJwtAlgorithm<T>(
  algorithm: string,
  run: (jwtModule: typeof import('./jwt')) => Promise<T>
): Promise<T> {
  // loaded via config mock to bypass env variable validation
  const actualConfig = await vi.importActual<typeof import('../../config')>('../../config')
  vi.doMock('../../config', () => ({
    ...actualConfig,
    getConfig: () => ({ ...actualConfig.getConfig(), jwtAlgorithm: algorithm }),
  }))
  try {
    return await run(await import('./jwt'))
  } finally {
    vi.doUnmock('../../config')
    vi.resetModules()
  }
}

type SigningKeyFixture = {
  description: string
  createKey: () => Promise<{
    signingKey: string | JwksConfigKeyOCT
    verifySecret: string
    verifyJwks?: JwksConfig
  }>
}

const signingKeyFixtures: SigningKeyFixture[] = [
  {
    description: 'HMAC secret',
    createKey: async () => {
      const secret = crypto.randomBytes(32).toString('base64url')
      return { signingKey: secret, verifySecret: secret }
    },
  },
  {
    description: 'OCT JWK',
    createKey: async () => {
      const jwk = await generateHS512JWK()
      jwk.kid = `prepared-oct-signing-key-${crypto.randomUUID()}`
      return { signingKey: jwk, verifySecret: 'unused-secret', verifyJwks: { keys: [jwk] } }
    },
  },
]

describe('JWT', () => {
  describe('verifyJWT with JWKS', () => {
    afterEach(() => {
      vi.restoreAllMocks()
      vi.useRealTimers()
    })

    const keys: KeyFixture[] = [
      createAsymmetricKeyFixture('rsa', 'RS256', '0'),
      createAsymmetricKeyFixture('ec', 'ES256', '1'),
      createAsymmetricKeyFixture('ed25519', 'EdDSA', '2'),
    ]

    const hmacPrivateKeyWithoutKid = crypto.randomBytes(256 / 8).toString('hex')

    // without kid, so the value from the secret argument will be taken
    keys.push({
      alg: 'HS256',
      privateKey: Buffer.from(hmacPrivateKeyWithoutKid, 'utf-8'),
      publicKey: {
        export: () => ({
          doesntmatter: 'wontbeused',
        }),
      },
    })

    const hmacPrivateKeyWithKid = crypto.randomBytes(256 / 8).toString('hex')

    // with kid, so the value from the JWKS will be used
    keys.push({
      alg: 'HS256',
      kid: keys.length.toString(),
      privateKey: Buffer.from(hmacPrivateKeyWithKid, 'utf-8'),
      publicKey: {
        export: () => ({
          kty: 'oct',
          k: Buffer.from(hmacPrivateKeyWithKid, 'utf-8').toString('base64url'),
        }),
      },
    })

    const jwks = {
      keys: keys.map(
        ({ publicKey, kid, alg }) =>
          ({
            ...publicKey.export(),
            kid,
            alg,
          }) as JwksConfigKey
      ),
    }

    keys.forEach(({ privateKey, alg, kid }, keyIdx) => {
      const iat = Math.trunc(Date.now() / 1000)
      const exp = iat + 60

      const parts = [
        Buffer.from(JSON.stringify({ typ: 'JWT', kid, alg }), 'utf-8').toString('base64url'),
        Buffer.from(JSON.stringify({ sub: 'abcdef' + keyIdx, iat, exp }), 'utf-8').toString(
          'base64url'
        ),
      ]

      switch (alg) {
        case 'EdDSA': {
          // Ed25519 signs the raw message directly
          const message = Buffer.from(parts.join('.'))
          parts.push(crypto.sign(null, message, privateKey).toString('base64url'))
          break
        }
        case 'ES256': {
          const sign = crypto.createSign('SHA256')
          sign.write(parts.join('.'))
          sign.end()
          parts.push(
            sign.sign(Object.assign(privateKey, { dsaEncoding: 'ieee-p1363' }), 'base64url')
          )
          break
        }
        case 'RS256': {
          const sign = crypto.createSign('SHA256')
          sign.write(parts.join('.'))
          sign.end()
          parts.push(sign.sign(privateKey, 'base64url'))
          break
        }
        case 'HS256': {
          const hmac = crypto.createHmac('SHA256', privateKey)
          hmac.update(parts.join('.'))
          parts.push(hmac.digest('base64url'))
          break
        }
      }

      const jwtStr = parts.join('.')

      test(`it should verify a JWT with alg=${alg}`, async () => {
        const result = await verifyJWT(jwtStr, hmacPrivateKeyWithoutKid, jwks)
        expect(result.sub).toEqual('abcdef' + keyIdx)
      })
    })

    const algFixtures: { type: AsymmetricKeyType; alg: AsymmetricKeyFixture['alg'] }[] = [
      { type: 'rsa', alg: 'RS256' },
      { type: 'ec', alg: 'ES256' },
      { type: 'ed25519', alg: 'EdDSA' },
    ]

    describe('JWK alg field matching', () => {
      algFixtures.forEach(({ type, alg }) => {
        test(`it should verify a ${alg} JWT when the matching jwk has no alg field`, async () => {
          const { publicKey, privateKey } = asymmetricKeyPairFactories[type]()
          const kid = `no-alg-${alg}`

          const { alg: _omitted, ...jwkWithoutAlg } = {
            ...(publicKey.export({ format: 'jwk' }) as JwksConfigKey),
            kid,
          }

          const token = await new SignJWT({ sub: `test-${alg}` })
            .setIssuedAt()
            .setExpirationTime('1h')
            .setProtectedHeader({ alg, kid })
            .sign(privateKey)

          const result = await verifyJWT(token, 'unused-secret', {
            keys: [jwkWithoutAlg as JwksConfigKey],
          })
          expect(result.sub).toEqual(`test-${alg}`)
        })
      })

      test('it should reject an algorithm outside the derived JWKS allowlist', async () => {
        const { publicKey, privateKey } = asymmetricKeyPairFactories.rsa()
        const kid = 'disallowed-ps256'
        const jwk = {
          ...(publicKey.export({ format: 'jwk' }) as JwksConfigKey),
          kid,
        } as JwksConfigKey

        const token = await new SignJWT({ sub: 'disallowed-ps256' })
          .setIssuedAt()
          .setExpirationTime('1h')
          .setProtectedHeader({ alg: 'PS256', kid })
          .sign(privateKey)

        await expect(verifyJWT(token, 'unused-secret', { keys: [jwk] })).rejects.toThrow(
          /not allowed/
        )
      })

      test('it should reject an asymmetric JWT when the matching jwk has a different alg', async () => {
        const { publicKey, privateKey } = asymmetricKeyPairFactories['rsa']()
        const kid = 'alg-mismatch-rsa'

        const jwkRS256 = {
          ...(publicKey.export({ format: 'jwk' }) as JwksConfigKey),
          kid,
          alg: 'RS256' as const,
        }

        const token = await new SignJWT({ sub: 'alg-mismatch-test' })
          .setIssuedAt()
          .setExpirationTime('1h')
          .setProtectedHeader({ alg: 'RS512', kid })
          .sign(privateKey)

        await expect(verifyJWT(token, 'unused-secret', { keys: [jwkRS256] })).rejects.toThrow()
      })

      test('it should reject an asymmetric JWK with an empty alg field', async () => {
        const { publicKey, privateKey } = asymmetricKeyPairFactories['rsa']()
        const kid = 'empty-alg-rsa'

        const jwkWithEmptyAlg = {
          ...(publicKey.export({ format: 'jwk' }) as JwksConfigKey),
          kid,
          alg: '',
        } as JwksConfigKey

        const token = await new SignJWT({ sub: 'empty-alg-rsa' })
          .setIssuedAt()
          .setExpirationTime('1h')
          .setProtectedHeader({ alg: 'RS256', kid })
          .sign(privateKey)

        await expect(
          verifyJWT(token, 'unused-secret', { keys: [jwkWithEmptyAlg] })
        ).rejects.toThrow()
      })

      test('it should use a later compatible asymmetric JWK after an empty alg candidate', async () => {
        const { publicKey, privateKey } = asymmetricKeyPairFactories['rsa']()
        const { publicKey: incompatiblePublicKey } = asymmetricKeyPairFactories['rsa']()
        const kid = 'compatible-rsa-after-empty-alg'

        const jwkWithEmptyAlg = {
          ...(incompatiblePublicKey.export({ format: 'jwk' }) as JwksConfigKey),
          kid,
          alg: '',
        } as JwksConfigKey
        const compatibleJwk = {
          ...(publicKey.export({ format: 'jwk' }) as JwksConfigKey),
          kid,
          alg: 'RS256',
        } as JwksConfigKey

        const token = await new SignJWT({ sub: 'compatible-rsa-after-empty-alg' })
          .setIssuedAt()
          .setExpirationTime('1h')
          .setProtectedHeader({ alg: 'RS256', kid })
          .sign(privateKey)

        const result = await verifyJWT(token, 'unused-secret', {
          keys: [jwkWithEmptyAlg, compatibleJwk],
        })
        expect(result.sub).toEqual('compatible-rsa-after-empty-alg')
      })

      test('it should reject a HMAC JWT when the matching jwk has a different alg', async () => {
        const rawKey = crypto.randomBytes(32)
        const kid = 'alg-mismatch-hmac'

        const jwkHS512: JwksConfigKey = {
          kty: 'oct',
          k: rawKey.toString('base64url'),
          kid,
          alg: 'HS512',
        } as JwksConfigKey

        const token = await new SignJWT({ sub: 'hmac-alg-mismatch' })
          .setIssuedAt()
          .setExpirationTime('1h')
          .setProtectedHeader({ alg: 'HS256', kid })
          .sign(rawKey)

        await expect(verifyJWT(token, 'wrong-secret', { keys: [jwkHS512] })).rejects.toThrow()
      })

      test('it should reject a HMAC JWT matching a kid with a different alg instead of falling back to the static secret', async () => {
        const secret = crypto.randomBytes(32).toString('base64url')
        const kid = 'alg-mismatch-hmac-static-fallback'

        const jwkHS512: JwksConfigKey = {
          kty: 'oct',
          k: crypto.randomBytes(32).toString('base64url'),
          kid,
          alg: 'HS512',
        } as JwksConfigKey

        const token = await new SignJWT({ sub: 'hmac-alg-mismatch-static-fallback' })
          .setIssuedAt()
          .setExpirationTime('1h')
          .setProtectedHeader({ alg: 'HS256', kid })
          .sign(new TextEncoder().encode(secret))

        await expect(verifyJWT(token, secret, { keys: [jwkHS512] })).rejects.toThrow(
          /does not match JWK algorithm/
        )
      })

      test('it should reject a HMAC JWK with an empty alg field', async () => {
        const rawKey = crypto.randomBytes(32)
        const kid = 'empty-alg-hmac'

        const jwkWithEmptyAlg: JwksConfigKey = {
          kty: 'oct',
          k: rawKey.toString('base64url'),
          kid,
          alg: '',
        } as JwksConfigKey

        const token = await new SignJWT({ sub: 'empty-alg-hmac' })
          .setIssuedAt()
          .setExpirationTime('1h')
          .setProtectedHeader({ alg: 'HS256', kid })
          .sign(rawKey)

        await expect(verifyJWT(token, 'wrong-secret', { keys: [jwkWithEmptyAlg] })).rejects.toThrow(
          /does not match JWK algorithm/
        )
      })

      test('it should use a later compatible HMAC JWK after an earlier alg mismatch', async () => {
        const rawKey = crypto.randomBytes(32)
        const kid = 'compatible-hmac-after-alg-mismatch'

        const incompatibleWildcardJwk: JwksConfigKey = {
          kty: 'oct',
          k: crypto.randomBytes(32).toString('base64url'),
          alg: 'HS512',
        } as JwksConfigKey
        const compatibleJwk: JwksConfigKey = {
          kty: 'oct',
          k: rawKey.toString('base64url'),
          kid,
          alg: 'HS256',
        } as JwksConfigKey

        const token = await new SignJWT({ sub: 'compatible-hmac-after-alg-mismatch' })
          .setIssuedAt()
          .setExpirationTime('1h')
          .setProtectedHeader({ alg: 'HS256', kid })
          .sign(rawKey)

        const result = await verifyJWT(token, 'wrong-secret', {
          keys: [incompatibleWildcardJwk, compatibleJwk],
        })
        expect(result.sub).toEqual('compatible-hmac-after-alg-mismatch')
      })
    })

    test('it should memoize derived algorithm allowlists by JWKS identity', async () => {
      vi.resetModules()

      const actualJose = await vi.importActual<typeof import('jose')>('jose')
      const jwtVerifyMock = vi.fn().mockResolvedValue({ payload: { sub: 'algorithm-cache' } })
      vi.doMock('jose', () => ({ ...actualJose, jwtVerify: jwtVerifyMock }))

      try {
        const { verifyJWT: isolatedVerifyJWT } = await import('./jwt')
        const rsaJwk = {
          ...keys[0].publicKey.export(),
          kid: 'algorithm-cache-rsa',
        } as JwksConfigKey
        const cachedJwks = { keys: [rsaJwk] }
        const refreshedJwks = { keys: [{ ...rsaJwk } as JwksConfigKey] }

        await isolatedVerifyJWT('token-1', 'unused-secret', cachedJwks)
        await isolatedVerifyJWT('token-2', 'unused-secret', cachedJwks)
        await isolatedVerifyJWT('token-3', 'unused-secret', refreshedJwks)
        await isolatedVerifyJWT('token-4', 'unused-secret')
        await isolatedVerifyJWT('token-5', 'unused-secret', { keys: [] })

        const algorithmsAt = (index: number) => {
          const options = jwtVerifyMock.mock.calls[index][2] as { algorithms: string[] }
          return options.algorithms
        }

        expect(algorithmsAt(0)).toBe(algorithmsAt(1))
        expect(algorithmsAt(0)).not.toBe(algorithmsAt(2))
        expect(algorithmsAt(0)).toEqual(algorithmsAt(2))
        expect(algorithmsAt(0)).toContain('RS256')
        expect(algorithmsAt(3)).toBe(algorithmsAt(4))
      } finally {
        vi.doUnmock('jose')
        vi.resetModules()
      }
    })

    algFixtures.forEach(({ type, alg }) => {
      test(`it should reject a ${alg} JWT when the token was signed with a key not in the jwks`, async () => {
        const { publicKey } = asymmetricKeyPairFactories[type]()
        const { privateKey: wrongPrivateKey } = asymmetricKeyPairFactories[type]()
        const kid = `wrong-key-${alg}`

        const { alg: _omitted, ...jwkWithoutAlg } = {
          ...(publicKey.export({ format: 'jwk' }) as JwksConfigKey),
          kid,
        }

        const token = await new SignJWT({ sub: `test-${alg}` })
          .setIssuedAt()
          .setExpirationTime('1h')
          .setProtectedHeader({ alg, kid })
          .sign(wrongPrivateKey)

        await expect(
          verifyJWT(token, 'unused-secret', { keys: [jwkWithoutAlg as JwksConfigKey] })
        ).rejects.toThrow()
      })
    })

    test('it should preserve the invalid-key error when no asymmetric JWK matches', async () => {
      const { publicKey, privateKey } = asymmetricKeyPairFactories.rsa()
      const token = await new SignJWT({ sub: 'missing-asymmetric-key' })
        .setProtectedHeader({ alg: 'RS256', kid: 'missing-key' })
        .sign(privateKey)
      const jwk = {
        ...(publicKey.export({ format: 'jwk' }) as JwksConfigKey),
        kid: 'different-key',
        alg: 'RS256',
      } as JwksConfigKey

      await expect(verifyJWT(token, 'fallback-secret', { keys: [jwk] })).rejects.toMatchObject({
        code: ErrorCode.AccessDenied,
        message: expect.stringContaining('Received an instance of Uint8Array'),
      })
    })

    test('it should preserve the invalid-key error without JWKS for an asymmetric algorithm', async () => {
      const { privateKey } = asymmetricKeyPairFactories.rsa()
      const token = await new SignJWT({ sub: 'missing-asymmetric-jwks' })
        .setProtectedHeader({ alg: 'RS256' })
        .sign(privateKey)

      await withJwtAlgorithm('RS256', async ({ verifyJWT: isolatedVerifyJWT }) => {
        await expect(isolatedVerifyJWT(token, 'fallback-secret')).rejects.toMatchObject({
          code: ErrorCode.AccessDenied,
          message: expect.stringContaining('Received an instance of Uint8Array'),
        })
      })
    })

    test('it should try secret if no matching jwk kty/alg found in jwks', async () => {
      const jwk = await generateHS512JWK()
      jwk.kid = 'abc123'
      const sub = 'weird-case-secret'
      const secret = crypto.randomBytes(32).toString('base64url')

      const jwtStr = await new SignJWT({ sub })
        .setIssuedAt()
        .setProtectedHeader({ alg: 'HS256', kid: 'def456' })
        .sign(new TextEncoder().encode(secret))

      const result = await verifyJWT(jwtStr, secret, { keys: [jwk] })
      expect(result.sub).toEqual(sub)
    })

    test('it should use jwt secret if jwks are missing', async () => {
      const jwt = await signJWT({ sub: 'things' }, hmacPrivateKeyWithoutKid, 100)
      const result = await verifyJWT(jwt, hmacPrivateKeyWithoutKid)
      expect(result.sub).toEqual('things')
    })

    test('it should import the same HMAC verification key only once', async () => {
      const secret = crypto.randomBytes(32).toString('base64url')
      const token = await signJWT({ sub: 'prepared-hmac-key' }, secret, 100)
      const importKeySpy = vi.spyOn(crypto.webcrypto.subtle, 'importKey')

      await expect(verifyJWT(token, secret)).resolves.toMatchObject({ sub: 'prepared-hmac-key' })
      await expect(verifyJWT(token, secret)).resolves.toMatchObject({ sub: 'prepared-hmac-key' })

      expect(importKeySpy).toHaveBeenCalledTimes(1)
    })

    test('it should preserve permissive base64 decoding for HMAC JWKs', async () => {
      const rawKey = Buffer.from([251, 255, 255, ...crypto.randomBytes(29)])
      const kid = `standard-base64-hmac-${crypto.randomUUID()}`
      const jwk = {
        kty: 'oct',
        k: rawKey.toString('base64'),
        kid,
        alg: 'HS256',
      } as JwksConfigKey
      const token = await new SignJWT({ sub: 'standard-base64-hmac' })
        .setProtectedHeader({ alg: 'HS256', kid })
        .sign(rawKey)
      const importKeySpy = vi.spyOn(crypto.webcrypto.subtle, 'importKey')

      expect(jwk.k).toMatch(/[+/]/)
      await expect(verifyJWT(token, 'unused-secret', { keys: [jwk] })).resolves.toMatchObject({
        sub: 'standard-base64-hmac',
      })
      await expect(verifyJWT(token, 'unused-secret', { keys: [jwk] })).resolves.toMatchObject({
        sub: 'standard-base64-hmac',
      })
      expect(importKeySpy).toHaveBeenCalledTimes(1)
    })

    test('it should share one HMAC key import across concurrent verifications', async () => {
      const secret = crypto.randomBytes(32).toString('base64url')
      const token = await signJWT({ sub: 'concurrent-prepared-hmac-key' }, secret, 100)
      const { importKeySpy, releaseImport } = gateNextImportKey()

      const firstVerification = verifyJWT(token, secret)
      const secondVerification = verifyJWT(token, secret)

      await vi.waitFor(() => expect(importKeySpy).toHaveBeenCalledTimes(1))
      releaseImport()

      await expect(Promise.all([firstVerification, secondVerification])).resolves.toEqual([
        expect.objectContaining({ sub: 'concurrent-prepared-hmac-key' }),
        expect.objectContaining({ sub: 'concurrent-prepared-hmac-key' }),
      ])
      expect(importKeySpy).toHaveBeenCalledTimes(1)
    })

    test('it should retry an HMAC key import after a failure', async () => {
      const secret = crypto.randomBytes(32).toString('base64url')
      const token = await signJWT({ sub: 'retried-prepared-hmac-key' }, secret, 100)
      const recordSpy = vi.spyOn(metrics, 'recordCacheRequest')
      const importKeySpy = vi
        .spyOn(crypto.webcrypto.subtle, 'importKey')
        .mockRejectedValueOnce(new Error('temporary key import failure'))

      await expect(verifyJWT(token, secret)).rejects.toThrow('temporary key import failure')
      await expect(verifyJWT(token, secret)).resolves.toMatchObject({
        sub: 'retried-prepared-hmac-key',
      })

      expect(importKeySpy).toHaveBeenCalledTimes(2)
      expect(recordSpy.mock.calls).toEqual([
        [JWT_VERIFICATION_KEY_CACHE_NAME, 'miss'],
        [JWT_VERIFICATION_KEY_CACHE_NAME, 'miss'],
      ])
    })

    test('it should evict the least-recently-used prepared secret key at capacity', async () => {
      await withIsolatedJwtModule(
        { jwtVerify: stubbedJwtVerify() },
        async (
          { JWT_VERIFICATION_KEY_CACHE_MAX_ITEMS, verifyJWT: isolatedVerifyJWT },
          importKeySpy
        ) => {
          for (let index = 0; index <= JWT_VERIFICATION_KEY_CACHE_MAX_ITEMS; index++) {
            await isolatedVerifyJWT('token', `capacity-secret-${index}`)
          }
          await isolatedVerifyJWT('token', 'capacity-secret-0')

          expect(importKeySpy).toHaveBeenCalledTimes(JWT_VERIFICATION_KEY_CACHE_MAX_ITEMS + 2)
        }
      )
    })

    test('it should not let an evicted failed import delete its successful replacement', async () => {
      await withIsolatedJwtModule(
        { jwtVerify: stubbedJwtVerify() },
        async (
          { JWT_VERIFICATION_KEY_CACHE_MAX_ITEMS, verifyJWT: isolatedVerifyJWT },
          importKeySpy
        ) => {
          let rejectStaleImport: (error: Error) => void = () => undefined
          const staleImport = new Promise<CryptoKey>((_resolve, reject) => {
            rejectStaleImport = reject
          })
          importKeySpy.mockImplementationOnce(() => staleImport)

          const staleVerification = isolatedVerifyJWT('token', 'stale-capacity-secret')
          const staleRejection = expect(staleVerification).rejects.toThrow('stale import failed')

          for (let index = 0; index < JWT_VERIFICATION_KEY_CACHE_MAX_ITEMS; index++) {
            await isolatedVerifyJWT('token', `replacement-capacity-secret-${index}`)
          }
          await isolatedVerifyJWT('token', 'stale-capacity-secret')

          rejectStaleImport(new Error('stale import failed'))
          await staleRejection
          await isolatedVerifyJWT('token', 'stale-capacity-secret')

          expect(importKeySpy).toHaveBeenCalledTimes(JWT_VERIFICATION_KEY_CACHE_MAX_ITEMS + 2)
        }
      )
    })

    test('it should import the same asymmetric verification key only once', async () => {
      const { publicKey, privateKey } = asymmetricKeyPairFactories.rsa()
      const kid = `prepared-rsa-key-${crypto.randomUUID()}`
      const jwk = {
        ...(publicKey.export({ format: 'jwk' }) as JwksConfigKey),
        kid,
        alg: 'RS256',
      } as JwksConfigKey
      const token = await new SignJWT({ sub: 'prepared-rsa-key' })
        .setProtectedHeader({ alg: 'RS256', kid })
        .sign(privateKey)
      const importKeySpy = vi.spyOn(crypto.webcrypto.subtle, 'importKey')

      await expect(verifyJWT(token, 'unused-secret', { keys: [jwk] })).resolves.toMatchObject({
        sub: 'prepared-rsa-key',
      })
      await expect(verifyJWT(token, 'unused-secret', { keys: [jwk] })).resolves.toMatchObject({
        sub: 'prepared-rsa-key',
      })

      expect(importKeySpy).toHaveBeenCalledTimes(1)
    })

    test('it should re-import an asymmetric key when the JWKS object is refreshed', async () => {
      const { publicKey, privateKey } = asymmetricKeyPairFactories.rsa()
      const kid = `refreshed-rsa-key-${crypto.randomUUID()}`
      const jwk = {
        ...(publicKey.export({ format: 'jwk' }) as JwksConfigKey),
        kid,
        alg: 'RS256',
      } as JwksConfigKey
      const token = await new SignJWT({ sub: 'refreshed-rsa-key' })
        .setProtectedHeader({ alg: 'RS256', kid })
        .sign(privateKey)
      const importKeySpy = vi.spyOn(crypto.webcrypto.subtle, 'importKey')

      await expect(verifyJWT(token, 'unused-secret', { keys: [jwk] })).resolves.toMatchObject({
        sub: 'refreshed-rsa-key',
      })
      // a JWKS refresh yields identity-new key objects: re-import once, then cache again
      const refreshedJwk = { ...jwk } as JwksConfigKey
      await expect(
        verifyJWT(token, 'unused-secret', { keys: [refreshedJwk] })
      ).resolves.toMatchObject({ sub: 'refreshed-rsa-key' })
      await expect(
        verifyJWT(token, 'unused-secret', { keys: [refreshedJwk] })
      ).resolves.toMatchObject({ sub: 'refreshed-rsa-key' })

      expect(importKeySpy).toHaveBeenCalledTimes(2)
    })

    test('it should not reuse a prepared HMAC key after secret rotation', async () => {
      const oldSecret = crypto.randomBytes(32).toString('base64url')
      const newSecret = crypto.randomBytes(32).toString('base64url')
      const oldToken = await signJWT({ sub: 'old-secret' }, oldSecret, 100)
      const newToken = await signJWT({ sub: 'new-secret' }, newSecret, 100)

      await expect(verifyJWT(oldToken, oldSecret)).resolves.toMatchObject({ sub: 'old-secret' })
      await expect(verifyJWT(newToken, newSecret)).resolves.toMatchObject({ sub: 'new-secret' })
      await expect(verifyJWT(oldToken, newSecret)).rejects.toThrow()
    })

    test.each(
      signingKeyFixtures
    )('it should share one $description signing key import across concurrent signs', async ({
      createKey,
    }) => {
      const { signingKey, verifySecret, verifyJwks } = await createKey()
      const { importKeySpy, releaseImport } = gateNextImportKey()

      const firstSigning = signJWT({ sub: 'prepared-signing-key' }, signingKey, 100)
      const secondSigning = signJWT({ sub: 'prepared-signing-key' }, signingKey, 100)

      await vi.waitFor(() => expect(importKeySpy).toHaveBeenCalledTimes(1))
      releaseImport()

      const [firstToken, secondToken] = await Promise.all([firstSigning, secondSigning])

      expect(importKeySpy).toHaveBeenCalledTimes(1)
      await expect(verifyJWT(firstToken, verifySecret, verifyJwks)).resolves.toMatchObject({
        sub: 'prepared-signing-key',
      })
      await expect(verifyJWT(secondToken, verifySecret, verifyJwks)).resolves.toMatchObject({
        sub: 'prepared-signing-key',
      })
    })

    test('it should re-import a signing key when the JWKS object is refreshed', async () => {
      const kid = `refreshed-oct-signing-key-${crypto.randomUUID()}`
      const jwk = await generateHS512JWK()
      jwk.kid = kid
      jwk.alg = 'HS512'
      const refreshedJwk = await generateHS512JWK()
      refreshedJwk.kid = kid
      refreshedJwk.alg = 'HS512'
      const importKeySpy = vi.spyOn(crypto.webcrypto.subtle, 'importKey')

      const oldToken = await signJWT({ sub: 'old-signing-key' }, jwk, 100)
      const refreshedToken = await signJWT({ sub: 'refreshed-signing-key' }, refreshedJwk, 100)

      expect(importKeySpy).toHaveBeenCalledTimes(2)
      await expect(verifyJWT(oldToken, 'unused-secret', { keys: [jwk] })).resolves.toMatchObject({
        sub: 'old-signing-key',
      })
      await expect(
        verifyJWT(refreshedToken, 'unused-secret', { keys: [refreshedJwk] })
      ).resolves.toMatchObject({ sub: 'refreshed-signing-key' })
      await expect(verifyJWT(oldToken, 'unused-secret', { keys: [refreshedJwk] })).rejects.toThrow()
    })

    test('it should retry a signing key import after a failure', async () => {
      const secret = crypto.randomBytes(32).toString('base64url')
      const recordSpy = vi.spyOn(metrics, 'recordCacheRequest')
      const importKeySpy = vi
        .spyOn(crypto.webcrypto.subtle, 'importKey')
        .mockRejectedValueOnce(new Error('temporary signing key import failure'))

      await expect(signJWT({ sub: 'retried-signing-key' }, secret, 100)).rejects.toThrow(
        'temporary signing key import failure'
      )
      await expect(signJWT({ sub: 'retried-signing-key' }, secret, 100)).resolves.toBeDefined()

      expect(importKeySpy).toHaveBeenCalledTimes(2)
      expect(recordSpy.mock.calls).toEqual([
        [JWT_SIGNING_KEY_CACHE_NAME, 'miss'],
        [JWT_SIGNING_KEY_CACHE_NAME, 'miss'],
      ])
    })

    test('it should evict the least-recently-used signing secret at capacity', async () => {
      await withIsolatedJwtModule(
        { SignJWT: StubbedSignJWT },
        async ({ signJWT: isolatedSignJWT }, importKeySpy) => {
          for (let index = 0; index <= JWT_SIGNING_KEY_CACHE_MAX_ITEMS; index++) {
            await isolatedSignJWT({}, `signing-capacity-secret-${index}`, 100)
          }
          await isolatedSignJWT({}, 'signing-capacity-secret-0', 100)

          expect(importKeySpy).toHaveBeenCalledTimes(JWT_SIGNING_KEY_CACHE_MAX_ITEMS + 2)
        }
      )
    })

    test('it should preserve the invalid-key error when signing with a non-HMAC algorithm', async () => {
      await withJwtAlgorithm('RS256', async ({ signJWT: isolatedSignJWT }) => {
        await expect(
          isolatedSignJWT({ sub: 'non-hmac-signing' }, 'some-secret', 100)
        ).rejects.toThrow('Received an instance of Uint8Array')
      })
    })

    test('it should preserve the invalid-key error when signing with a non-HMAC OCT JWK', async () => {
      const jwk = await generateHS512JWK()
      jwk.kid = 'non-hmac-oct-signing'
      jwk.alg = 'RS256'

      await expect(signJWT({ sub: 'non-hmac-oct-signing' }, jwk, 100)).rejects.toThrow(
        'CryptoKey instances for asymmetric algorithms must not be of type "secret"'
      )
    })

    test('it should sign and verify using our HS256 generation', async () => {
      const token = await generateHS512JWK()
      token.kid = 'this-is-my-kid'
      const jwt = await signJWT({ sub: 'stuff' }, token, 100)
      const result = await verifyJWT(jwt, 'totally-invalid-secret-not-used', { keys: [token] })
      expect(result.sub).toEqual('stuff')
    })

    test('it should reject if secret is invalid when signing', async () => {
      await expect(signJWT({ sub: 'things' }, '', 100)).rejects.toThrow(
        'Zero-length key is not supported'
      )
    })

    test('it should allow the current maximum numeric expiration and keep exp millisecond-safe', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))

      const maxNumericExpiration = getMaxNumericJWTExpiration()
      const jwt = await signJWT({ sub: 'things' }, hmacPrivateKeyWithoutKid, maxNumericExpiration)
      const result = await verifyJWT(jwt, hmacPrivateKeyWithoutKid)

      expect(maxNumericExpiration).toBeGreaterThan(0)
      expect(Number.isSafeInteger(result.exp)).toBe(true)
      expect(Number.isSafeInteger(result.exp! * 1000)).toBe(true)
    })

    test('it should reject numeric expirations above the current maximum', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))

      const maxNumericExpiration = getMaxNumericJWTExpiration()
      await expect(
        signJWT({ sub: 'things' }, hmacPrivateKeyWithoutKid, maxNumericExpiration + 1)
      ).rejects.toMatchObject({
        code: ErrorCode.InvalidParameter,
        httpStatusCode: 400,
        message: 'Invalid Parameter expiresIn',
      })
    })

    test('it should reject numeric expirations above the current maximum in the shared validator', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))

      expect(() => assertValidNumericJWTExpiration(getMaxNumericJWTExpiration() + 1)).toThrow(
        'Invalid Parameter expiresIn'
      )
    })

    test('it should reject numeric expirations below one second', async () => {
      await expect(signJWT({ sub: 'things' }, hmacPrivateKeyWithoutKid, 0)).rejects.toMatchObject({
        code: ErrorCode.InvalidParameter,
        httpStatusCode: 400,
        message: 'Invalid Parameter expiresIn',
      })

      await expect(signJWT({ sub: 'things' }, hmacPrivateKeyWithoutKid, -1)).rejects.toMatchObject({
        code: ErrorCode.InvalidParameter,
        httpStatusCode: 400,
        message: 'Invalid Parameter expiresIn',
      })
    })

    test('it should reject numeric expirations below one second in the shared validator', () => {
      expect(() => assertValidNumericJWTExpiration(0)).toThrow('Invalid Parameter expiresIn')
      expect(() => assertValidNumericJWTExpiration(-1)).toThrow('Invalid Parameter expiresIn')
    })

    test('it should reject if jwt is malformed', async () => {
      await expect(verifyJWT('this is not a jwt', 'and this is not a secret')).rejects.toThrow(
        'Invalid Compact JWS'
      )
    })

    test('it should reuse cached JWT verifications for the same inputs until the token expires', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))

      const recordSpy = vi.spyOn(metrics, 'recordCacheRequest')
      const secret = crypto.randomBytes(32).toString('base64url')
      const token = await signJWT({ sub: 'cached-user' }, secret, 2)

      recordSpy.mockClear()

      await expect(verifyJWTWithCache(token, secret)).resolves.toMatchObject({
        sub: 'cached-user',
      })
      await expect(verifyJWTWithCache(token, secret)).resolves.toMatchObject({
        sub: 'cached-user',
      })

      expect(recordSpy.mock.calls).toEqual([
        [JWT_CACHE_NAME, 'miss'],
        [JWT_VERIFICATION_KEY_CACHE_NAME, 'miss'],
        [JWT_CACHE_NAME, 'hit'],
      ])

      vi.advanceTimersByTime(2200)

      await expect(verifyJWTWithCache(token, secret)).rejects.toThrow()
    })

    test('it should not reuse cached JWT verifications when the secret changes', async () => {
      const recordSpy = vi.spyOn(metrics, 'recordCacheRequest')
      const secret = crypto.randomBytes(32).toString('base64url')
      const token = await signJWT({ sub: 'cached-user' }, secret, 2)

      recordSpy.mockClear()

      await expect(verifyJWTWithCache(token, secret)).resolves.toMatchObject({
        sub: 'cached-user',
      })
      await expect(verifyJWTWithCache(token, 'definitely-the-wrong-secret')).rejects.toThrow()

      expect(recordSpy.mock.calls).toEqual([
        [JWT_CACHE_NAME, 'miss'],
        [JWT_VERIFICATION_KEY_CACHE_NAME, 'miss'],
        [JWT_CACHE_NAME, 'miss'],
        [JWT_VERIFICATION_KEY_CACHE_NAME, 'miss'],
      ])
    })

    test('it should not reuse cached JWT verifications when the JWKS changes', async () => {
      const signingKey = await generateHS512JWK()
      signingKey.kid = 'cache-signing-key'
      const wrongKey = await generateHS512JWK()
      wrongKey.kid = 'wrong-cache-signing-key'
      const token = await signJWT({ sub: 'cached-user' }, signingKey, 2)

      await expect(
        verifyJWTWithCache(token, 'invalid-secret', { keys: [signingKey] })
      ).resolves.toMatchObject({
        sub: 'cached-user',
      })
      await expect(
        verifyJWTWithCache(token, 'invalid-secret', { keys: [wrongKey] })
      ).rejects.toThrow()
    })

    test('it should skip caching when the token expires before the cache ttl is computed', async () => {
      vi.useFakeTimers()

      const issuedAt = new Date('2026-01-01T00:00:00.000Z')
      const issuedAtMs = issuedAt.getTime()
      const tokenExp = issuedAtMs / 1000 + 2
      const secret = 'ttl-edge-secret'
      const token = 'header.payload.signature'

      vi.setSystemTime(issuedAt)
      vi.resetModules()

      const actualJose = await vi.importActual<typeof import('jose')>('jose')
      const jwtVerifyMock = vi
        .fn()
        .mockImplementationOnce(async () => {
          vi.setSystemTime(issuedAtMs + 2000)
          return {
            payload: {
              sub: 'cached-user',
              exp: tokenExp,
            },
          }
        })
        .mockResolvedValue({
          payload: {
            sub: 'cached-user',
            exp: tokenExp,
          },
        })

      vi.doMock('jose', () => ({
        ...actualJose,
        jwtVerify: jwtVerifyMock,
      }))

      try {
        const isolatedMetrics = await import('@internal/monitoring/metrics')
        const { verifyJWTWithCache: isolatedVerifyJWTWithCache } = await import('./jwt')
        const recordSpy = vi.spyOn(isolatedMetrics, 'recordCacheRequest')

        recordSpy.mockClear()

        await expect(isolatedVerifyJWTWithCache(token, secret)).resolves.toMatchObject({
          sub: 'cached-user',
        })

        vi.setSystemTime(issuedAtMs + 1000)

        await expect(isolatedVerifyJWTWithCache(token, secret)).resolves.toMatchObject({
          sub: 'cached-user',
        })
        await expect(isolatedVerifyJWTWithCache(token, secret)).resolves.toMatchObject({
          sub: 'cached-user',
        })

        expect(jwtVerifyMock).toHaveBeenCalledTimes(2)
        expect(recordSpy.mock.calls).toEqual([
          [JWT_CACHE_NAME, 'miss'],
          [JWT_CACHE_NAME, 'miss'],
          [JWT_CACHE_NAME, 'hit'],
        ])
      } finally {
        vi.doUnmock('jose')
        vi.resetModules()
      }
    })
  })

  describe('JWK generation', () => {
    test('generateHS512JWK returns a jwk with the HS512 alg set', async () => {
      const jwk = await generateHS512JWK()

      expect(jwk).toMatchObject({ kty: 'oct', alg: 'HS512' })
      expect(jwk.k).toBeTruthy()
    })

    test('generateECDSA256JWK returns a jwk with the ES256 alg set', async () => {
      const jwk = await generateES256JWK()

      expect(jwk).toMatchObject({ kty: 'EC', crv: 'P-256', alg: 'ES256' })
      expect(jwk.x).toBeTruthy()
      expect(jwk.y).toBeTruthy()
    })

    test('generateHS512JWK produces a jwk that signJWT/verifyJWT can use without an externally supplied alg', async () => {
      const jwk = { ...(await generateHS512JWK()), kid: 'jwk-gen-hs512-kid' }

      const token = await signJWT({ sub: 'jwk-gen-hs512' }, jwk, 100)

      await expect(
        verifyJWT(token, 'unused-fallback-secret', { keys: [jwk] })
      ).resolves.toMatchObject({ sub: 'jwk-gen-hs512' })
    })

    test('generateECDSA256JWK produces a jwk that signJWT/verifyJWT can use without an externally supplied alg', async () => {
      const jwk = { ...(await generateES256JWK()), kid: 'jwk-gen-es256-kid' }

      const token = await signJWT({ sub: 'jwk-gen-es256' }, jwk, 100)

      await expect(
        verifyJWT(token, 'unused-fallback-secret', { keys: [jwk] })
      ).resolves.toMatchObject({ sub: 'jwk-gen-es256' })
    })
  })

  describe('legacy "<kind>_<id>" kid backward compatibility', () => {
    test('ES256: a jwt signed with a legacy kind-prefixed kid still verifies against the current bare-id jwk', async () => {
      const jwk = await generateES256JWK()
      const id = 'shared-ec-id'
      const signedJwk = { ...jwk, kid: `storage-url-signing-key_${id}` }
      const token = await signJWT({ sub: 'legacy-kid' }, signedJwk, 100)

      const currentJwk = { ...jwk, kid: id }

      await expect(
        verifyJWT(token, 'unused-fallback-secret', { keys: [currentJwk] })
      ).resolves.toMatchObject({ sub: 'legacy-kid' })
    })

    test('HS512: a jwt signed with a legacy kind-prefixed kid still verifies against the current bare-id jwk', async () => {
      const jwk = await generateHS512JWK()
      const id = 'shared-hs-id'
      const signedJwk = { ...jwk, kid: `storage-url-signing-key_${id}` }
      const token = await signJWT({ sub: 'legacy-kid-hs' }, signedJwk, 100)

      const currentJwk = { ...jwk, kid: id }

      await expect(
        verifyJWT(token, 'totally-invalid-secret-not-used', { keys: [currentJwk] })
      ).resolves.toMatchObject({ sub: 'legacy-kid-hs' })
    })

    test('does not cross-match two genuinely different keys that happen to share a legacy kind prefix', async () => {
      const jwk = await generateES256JWK()
      const signedJwk = { ...jwk, kid: 'storage-url-signing-key_id-one' }
      const token = await signJWT({ sub: 'should-not-verify' }, signedJwk, 100)

      const unrelatedJwk = {
        ...(await generateES256JWK()),
        kid: 'id-two',
      }

      await expect(
        verifyJWT(token, 'unused-fallback-secret', { keys: [unrelatedJwk] })
      ).rejects.toThrow()
    })

    test('does not strip a "_" prefix from a non-reserved kind, and matches the full kid unmodified', async () => {
      const jwk = await generateES256JWK()
      const signedJwk = { ...jwk, kid: 'custom-provider_abc123' }
      const token = await signJWT({ sub: 'custom-kind-kid' }, signedJwk, 100)

      const fullKidJwk = { ...jwk, kid: 'custom-provider_abc123' }

      await expect(
        verifyJWT(token, 'unused-fallback-secret', { keys: [fullKidJwk] })
      ).resolves.toMatchObject({ sub: 'custom-kind-kid' })

      const suffixOnlyJwk = { ...jwk, kid: 'abc123' }

      await expect(
        verifyJWT(token, 'unused-fallback-secret', { keys: [suffixOnlyJwk] })
      ).rejects.toThrow()
    })
  })

  describe('toPublicJwk', () => {
    test('EC: strips the private "d" component and keeps only public fields', () => {
      const publicJwk = toPublicJwk({
        kty: 'EC',
        crv: 'P-256',
        x: 'x-value',
        y: 'y-value',
        d: 'private-value',
        kid: 'ec-kid',
        alg: 'ES256',
      } as unknown as JwksConfigKey)

      expect(publicJwk).toEqual({
        kty: 'EC',
        crv: 'P-256',
        x: 'x-value',
        y: 'y-value',
        kid: 'ec-kid',
        alg: 'ES256',
      })
    })

    test('RSA: strips all private components and keeps only public fields', () => {
      const publicJwk = toPublicJwk({
        kty: 'RSA',
        n: 'n-value',
        e: 'e-value',
        d: 'private-d',
        p: 'private-p',
        q: 'private-q',
        dp: 'private-dp',
        dq: 'private-dq',
        qi: 'private-qi',
        kid: 'rsa-kid',
        alg: 'RS256',
      } as unknown as JwksConfigKey)

      expect(publicJwk).toEqual({
        kty: 'RSA',
        n: 'n-value',
        e: 'e-value',
        kid: 'rsa-kid',
        alg: 'RS256',
      })
    })

    test('OKP: strips the private "d" component and keeps only public fields', () => {
      const publicJwk = toPublicJwk({
        kty: 'OKP',
        crv: 'Ed25519',
        x: 'x-value',
        d: 'private-value',
        kid: 'okp-kid',
        alg: 'EdDSA',
      } as unknown as JwksConfigKey)

      expect(publicJwk).toEqual({
        kty: 'OKP',
        crv: 'Ed25519',
        x: 'x-value',
        kid: 'okp-kid',
        alg: 'EdDSA',
      })
    })

    test('drops any field that is not on the public allowlist', () => {
      const publicJwk = toPublicJwk({
        kty: 'EC',
        crv: 'P-256',
        x: 'x-value',
        y: 'y-value',
        someFuturePrivateField: 'should-never-be-published',
      } as unknown as JwksConfigKey)

      expect(publicJwk).not.toHaveProperty('someFuturePrivateField')
      expect(publicJwk).toEqual({ kty: 'EC', crv: 'P-256', x: 'x-value', y: 'y-value' })
    })

    test('throws for "oct" (symmetric) keys, which have no public form', () => {
      expect(() =>
        toPublicJwk({ kty: 'oct', k: 'secret-value' } as unknown as JwksConfigKey)
      ).toThrow('Cannot derive a public jwk for kty "oct"')
    })
  })
})

describe('signed URL scope predicates', () => {
  describe('isUploadScopedToken', () => {
    it('accepts an explicit upload scope', () => {
      expect(isUploadScopedToken({ scope: SIGNED_URL_SCOPE_UPLOAD })).toBe(true)
    })

    it('accepts a legacy upload token (no scope, with upsert)', () => {
      expect(isUploadScopedToken({ upsert: false } as never)).toBe(true)
      expect(isUploadScopedToken({ upsert: true } as never)).toBe(true)
    })

    it('rejects a legacy download-shaped token (no scope, no upsert)', () => {
      expect(isUploadScopedToken({ url: 'b/o' } as never)).toBe(false)
    })

    it('rejects an explicit download scope', () => {
      expect(isUploadScopedToken({ scope: SIGNED_URL_SCOPE_DOWNLOAD })).toBe(false)
    })

    it('rejects an unknown scope even when upsert is present', () => {
      expect(isUploadScopedToken({ scope: 'something-else', upsert: true } as never)).toBe(false)
    })
  })

  describe('isDownloadScopedToken', () => {
    it('accepts an explicit download scope', () => {
      expect(isDownloadScopedToken({ scope: SIGNED_URL_SCOPE_DOWNLOAD })).toBe(true)
    })

    it('accepts a legacy download token (no scope, no upsert)', () => {
      expect(isDownloadScopedToken({ url: 'b/o' } as never)).toBe(true)
    })

    it('rejects a legacy upload-shaped token (no scope, with upsert)', () => {
      expect(isDownloadScopedToken({ upsert: false } as never)).toBe(false)
    })

    it('rejects an explicit upload scope', () => {
      expect(isDownloadScopedToken({ scope: SIGNED_URL_SCOPE_UPLOAD })).toBe(false)
    })

    it('rejects an unknown scope', () => {
      expect(isDownloadScopedToken({ scope: 'something-else' } as never)).toBe(false)
    })
  })
})
