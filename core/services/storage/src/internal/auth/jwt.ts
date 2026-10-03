import { createHash } from 'node:crypto'
import {
  CACHE_LOOKUP_WITHOUT_METRICS,
  createLruCache,
  DEFAULT_CACHE_PURGE_STALE_INTERVAL_MS,
  JWT_CACHE_NAME,
  JWT_SIGNING_KEY_CACHE_NAME,
  JWT_VERIFICATION_KEY_CACHE_NAME,
} from '@internal/cache'
import { ERRORS } from '@internal/errors'
import {
  type CryptoKey,
  exportJWK,
  generateKeyPair,
  generateSecret,
  importJWK,
  JWTHeaderParameters,
  JWTPayload,
  JWTVerifyGetKey,
  jwtVerify,
  SignJWT,
} from 'jose'
import {
  getConfig,
  JwksConfig,
  JwksConfigKey,
  JwksConfigKeyEC,
  JwksConfigKeyOCT,
  UrlSigningJwksConfigKey,
} from '../../config'
import { normalizeUrlSigningKid } from './jwks/kid'

const { jwtAlgorithm } = getConfig()

const JWT_HMAC_ALGOS = ['HS256', 'HS384', 'HS512']
const JWT_RSA_ALGOS = ['RS256', 'RS384', 'RS512']
const JWT_ECC_ALGOS = ['ES256', 'ES384', 'ES512']
const JWT_ED_ALGOS = ['EdDSA']
const JWT_DEFAULT_ALGOS = [jwtAlgorithm]
const MAX_ABSOLUTE_JWT_EXPIRATION_SECONDS = Math.floor(Number.MAX_SAFE_INTEGER / 1000)

/**
 * Scope of a signed URL token. Tokens are bound to a single action so a
 * download token can never be replayed against the upload endpoint (and
 * vice-versa). Legacy tokens issued before this field existed have no scope.
 */
export const SIGNED_URL_SCOPE_DOWNLOAD = 'download'
export const SIGNED_URL_SCOPE_UPLOAD = 'upload'

export type SignedUrlScope = typeof SIGNED_URL_SCOPE_DOWNLOAD | typeof SIGNED_URL_SCOPE_UPLOAD

export type SignedToken = {
  scope?: SignedUrlScope
  url: string
  transformations?: string
  format?: string
  exp: number
  versionId?: string
}

export type SignedUploadToken = {
  scope?: SignedUrlScope
  owner: string | undefined
  upsert: boolean
  url: string
  exp: number
}

/**
 * Whether a verified signed-URL payload is authorized to **upload**.
 *
 * Accepts tokens explicitly scoped for upload, plus — for backward
 * compatibility — legacy upload tokens issued before scoping existed. Those are
 * identified by the presence of an `upsert` claim, which only the upload-signing
 * flow ever emits. Download-shaped tokens (no `upsert`) and any other scope are
 * rejected, which is what closes the read-token → write-replay hole.
 *
 * Keep this and {@link isDownloadScopedToken} as the single source of truth for
 * signed-URL scope checks — they are duplicated security logic otherwise.
 */
export function isUploadScopedToken(payload: { scope?: SignedUrlScope }): boolean {
  return (
    payload.scope === SIGNED_URL_SCOPE_UPLOAD ||
    (payload.scope === undefined && 'upsert' in payload)
  )
}

/**
 * Whether a verified signed-URL payload is authorized to **download** (read).
 *
 * Accepts tokens explicitly scoped for download, plus legacy download tokens
 * (no scope and no `upsert` claim). Upload tokens, legacy upload-shaped tokens
 * (carrying `upsert`), and any other scope are rejected.
 */
export function isDownloadScopedToken(payload: { scope?: SignedUrlScope }): boolean {
  return (
    payload.scope === SIGNED_URL_SCOPE_DOWNLOAD ||
    (payload.scope === undefined && !('upsert' in payload))
  )
}

const jwtJwksFingerprintCache = new WeakMap<object, string>()
const jwtAlgorithmsCache = new WeakMap<JwksConfig, string[]>()
const encoder = new TextEncoder()

// Prepared keys are immutable and can be shared across tokens.
// They are separate from the optional payload cache: even when JWT payload
// caching is disabled, repeated verification/signing should not re-import
// the same key material. Sign and verify keys are cached separately because
// their usages and OCT decode semantics differ.
export const JWT_VERIFICATION_KEY_CACHE_MAX_ITEMS = 16384
export const JWT_SIGNING_KEY_CACHE_MAX_ITEMS = 16384

// Uint8Array/JWK inputs come from the tenant config/JWKS caches and are
// object-identity stable until refresh, so their prepared keys can live
// exactly as long as the source object with no hashing and no bound.
const preparedObjectVerificationKeys = new WeakMap<object, Map<string, Promise<CryptoKey>>>()
const preparedObjectSigningKeys = new WeakMap<object, Map<string, Promise<CryptoKey>>>()

// String secrets cannot key a WeakMap, so bound their retention explicitly.
const preparedSecretVerificationKeys = createLruCache<string, Promise<CryptoKey>>(
  JWT_VERIFICATION_KEY_CACHE_NAME,
  { max: JWT_VERIFICATION_KEY_CACHE_MAX_ITEMS }
)
const preparedSecretSigningKeys = createLruCache<string, Promise<CryptoKey>>(
  JWT_SIGNING_KEY_CACHE_NAME,
  { max: JWT_SIGNING_KEY_CACHE_MAX_ITEMS }
)

type PreparedKeyInput = string | Uint8Array | JwksConfigKey

const HMAC_SIGN_USAGES = ['sign'] as const
const HMAC_VERIFY_USAGES = ['verify'] as const

function getSecretKeyCacheKey(alg: string, secret: string) {
  return `${alg}\0${secret}`
}

function importHMACKey(
  key: Uint8Array,
  alg: string,
  usages: typeof HMAC_SIGN_USAGES | typeof HMAC_VERIFY_USAGES
): Promise<CryptoKey> {
  const keyData: BufferSource =
    key.buffer instanceof ArrayBuffer ? (key as Uint8Array<ArrayBuffer>) : Uint8Array.from(key)

  return globalThis.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: `SHA-${alg.slice(-3)}` },
    false,
    usages
  )
}

function importVerificationKey(key: PreparedKeyInput, alg: string): Promise<CryptoKey> {
  if (typeof key === 'string') {
    return importHMACKey(encoder.encode(key), alg, HMAC_VERIFY_USAGES)
  }
  if (key instanceof Uint8Array) {
    return importHMACKey(key, alg, HMAC_VERIFY_USAGES)
  }
  if (key.kty === 'oct' && key.k) {
    return importHMACKey(Buffer.from(key.k, 'base64'), alg, HMAC_VERIFY_USAGES)
  }
  return importJWK(toPublicJwk(key), key.alg ?? alg).then((imported) => {
    if (imported instanceof Uint8Array) {
      return importHMACKey(imported, alg, HMAC_VERIFY_USAGES)
    }
    return imported
  })
}

function importSigningKey(key: PreparedKeyInput, alg: string): Promise<CryptoKey> {
  if (typeof key === 'string') {
    return importHMACKey(encoder.encode(key), alg, HMAC_SIGN_USAGES)
  }
  if (key instanceof Uint8Array) {
    return importHMACKey(key, alg, HMAC_SIGN_USAGES)
  }
  return importJWK(key).then((imported) => {
    if (imported instanceof Uint8Array) {
      return importHMACKey(imported, alg, HMAC_SIGN_USAGES)
    }
    return imported
  })
}

function getPreparedJWTKey(
  key: PreparedKeyInput,
  alg: string,
  secretCache: typeof preparedSecretVerificationKeys,
  objectCache: WeakMap<object, Map<string, Promise<CryptoKey>>>,
  importKey: (key: PreparedKeyInput, alg: string) => Promise<CryptoKey>
): Promise<CryptoKey> {
  if (typeof key === 'string') {
    const cacheKey = getSecretKeyCacheKey(alg, key)
    const cachedKey = secretCache.get(cacheKey)
    if (cachedKey) {
      return cachedKey
    }

    const importedKey = importKey(key, alg)
    secretCache.set(cacheKey, importedKey)
    importedKey.catch(() => {
      if (secretCache.get(cacheKey, CACHE_LOOKUP_WITHOUT_METRICS) === importedKey) {
        secretCache.delete(cacheKey)
      }
    })
    return importedKey
  }

  // Keyed per effective alg: a JWK without its own alg imports under the
  // header alg, so the same object can yield algorithm-distinct CryptoKeys.
  let byAlg = objectCache.get(key)
  if (!byAlg) {
    byAlg = new Map()
    objectCache.set(key, byAlg)
  }
  const cachedKey = byAlg.get(alg)
  if (cachedKey) {
    return cachedKey
  }

  const importedKey = importKey(key, alg)
  byAlg.set(alg, importedKey)
  importedKey.catch(() => {
    if (byAlg.get(alg) === importedKey) {
      byAlg.delete(alg)
    }
  })
  return importedKey
}

function getPreparedJWTVerificationKey(key: PreparedKeyInput, alg: string): Promise<CryptoKey> {
  return getPreparedJWTKey(
    key,
    alg,
    preparedSecretVerificationKeys,
    preparedObjectVerificationKeys,
    importVerificationKey
  )
}

function getPreparedJWTSigningKey(
  key: string | UrlSigningJwksConfigKey,
  alg: string
): Promise<CryptoKey> {
  return getPreparedJWTKey(
    key,
    alg,
    preparedSecretSigningKeys,
    preparedObjectSigningKeys,
    importSigningKey
  )
}

// RFC 7517 §6 - the JWK parameters that fully describe the PUBLIC half of each asymmetric
// key type. Deliberately an allowlist rather than a denylist of private fields: any parameter not named here is dropped
// "oct" (symmetric) keys have no public form at all and are intentionally absent from this map.
const PUBLIC_JWK_FIELDS: Partial<Record<JwksConfigKey['kty'], readonly string[]>> = {
  RSA: ['kid', 'alg', 'n', 'e'],
  EC: ['kid', 'alg', 'crv', 'x', 'y'],
  OKP: ['kid', 'alg', 'crv', 'x'],
}

export function jwkSupportsPublic(jwk: JwksConfigKey): boolean {
  return Boolean(PUBLIC_JWK_FIELDS[jwk.kty])
}

/**
 * Derives the public-only representation of an asymmetric jwk.
 * @throws for keys that have no public fields (e.g. "oct" symmetric keys)
 */
export function toPublicJwk(jwk: JwksConfigKey): JwksConfigKey {
  const publicFields = PUBLIC_JWK_FIELDS[jwk.kty]
  if (!publicFields) {
    throw new Error(`Cannot derive a public jwk for kty "${jwk.kty}"`)
  }

  const publicJwk: Record<string, unknown> = { kty: jwk.kty }
  for (const field of publicFields) {
    const value = (jwk as unknown as Record<string, unknown>)[field]
    if (value !== undefined) {
      publicJwk[field] = value
    }
  }
  return publicJwk as unknown as JwksConfigKey
}

// Jwk's kid was simplified to use just the tenants_jwks row's bare uuid
// Historically we embedded the kind resulting in a kid in the format "<kind>_<id>"
// So a header's kid must be normalized to its id suffix before comparing against a jwk's (bare) kid
// this is to support existing JWTs that were already signed using the legacy format
function kidsMatch(keyKid: string | undefined, headerKid: string | undefined): boolean {
  if (keyKid === undefined || headerKid === undefined) {
    return false
  }

  // Bare-to-bare is the common case (and the only one post-rollout), so check it directly first.
  return (
    keyKid === headerKid || normalizeUrlSigningKid(keyKid) === normalizeUrlSigningKid(headerKid)
  )
}

async function findJWKFromHeader(
  header: JWTHeaderParameters,
  secret: string,
  jwks: JwksConfig | null
) {
  if (!jwks || !jwks.keys) {
    return JWT_HMAC_ALGOS.includes(header.alg)
      ? getPreparedJWTVerificationKey(secret, header.alg)
      : encoder.encode(secret)
  }

  if (JWT_HMAC_ALGOS.indexOf(header.alg) > -1) {
    // JWT is using HS, find the proper key

    if (!header.kid && header.alg === jwtAlgorithm) {
      // jwt is probably signed with the static secret
      return getPreparedJWTVerificationKey(secret, header.alg)
    }

    // find the first compatible "oct" key without a kid or with the matching kid
    let mismatchedJwk: JwksConfigKey | undefined
    const jwk = jwks.keys.find((key) => {
      if ((!key.kid || kidsMatch(key.kid, header.kid)) && key.kty === 'oct' && key.k) {
        if (key.alg !== undefined && key.alg !== header.alg) {
          mismatchedJwk ??= key
          return false
        }
        return true
      }
      return false
    })

    if (!jwk && mismatchedJwk) {
      throw ERRORS.AccessDenied(
        `JWT algorithm "${header.alg}" does not match JWK algorithm "${mismatchedJwk.alg}"`
      )
    }

    if (!jwk) {
      // jwt is probably signed with the static secret
      return getPreparedJWTVerificationKey(secret, header.alg)
    }

    return getPreparedJWTVerificationKey(jwk, header.alg)
  }

  // jwt is using an asymmetric algorithm
  let kty = 'RSA'

  if (JWT_ECC_ALGOS.indexOf(header.alg) > -1) {
    kty = 'EC'
  } else if (JWT_ED_ALGOS.indexOf(header.alg) > -1) {
    kty = 'OKP'
  }

  // find the first key with a matching kid (or no kid if none is specified in the JWT header),
  // the correct key type, and a compatible alg
  const jwk = jwks.keys.find((key) => {
    return (
      ((!key.kid && !header.kid) || kidsMatch(key.kid, header.kid)) &&
      key.kty === kty &&
      (key.alg === undefined || key.alg === header.alg)
    )
  })

  if (!jwk) {
    // couldn't find a matching JWK, try to use the secret
    return encoder.encode(secret)
  }
  return getPreparedJWTVerificationKey(jwk, header.alg)
}

function getJWTVerificationKey(secret: string, jwks: JwksConfig | null): JWTVerifyGetKey {
  return (header: JWTHeaderParameters) => findJWKFromHeader(header, secret, jwks)
}

function getJWTAlgorithms(jwks: JwksConfig | null) {
  if (!jwks?.keys?.length) {
    return JWT_DEFAULT_ALGOS
  }

  const cachedAlgorithms = jwtAlgorithmsCache.get(jwks)
  if (cachedAlgorithms) {
    return cachedAlgorithms
  }

  const hasRSA = jwks.keys.find((key) => key.kty === 'RSA')
  const hasECC = jwks.keys.find((key) => key.kty === 'EC')
  const hasED = jwks.keys.find(
    (key) => key.kty === 'OKP' && (key.crv === 'Ed25519' || key.crv === 'Ed448')
  )
  const hasHS = jwks.keys.find((key) => key.kty === 'oct' && key.k)

  const algorithms = [
    jwtAlgorithm,
    ...(hasRSA ? JWT_RSA_ALGOS : []),
    ...(hasECC ? JWT_ECC_ALGOS : []),
    ...(hasED ? JWT_ED_ALGOS : []),
    ...(hasHS ? JWT_HMAC_ALGOS : []),
  ]

  jwtAlgorithmsCache.set(jwks, algorithms)
  return algorithms
}

function getJWTJwksFingerprint(jwks?: JwksConfig | null): string {
  if (!jwks) {
    return 'null'
  }

  const cachedFingerprint = jwtJwksFingerprintCache.get(jwks)
  if (cachedFingerprint) {
    return cachedFingerprint
  }

  const fingerprint = createHash('sha256')
    .update(JSON.stringify(jwks.keys ?? null))
    .digest('base64url')
  jwtJwksFingerprintCache.set(jwks, fingerprint)
  return fingerprint
}

function getJWTCacheKey(token: string, secret: string, jwks?: JwksConfig | null) {
  const hash = createHash('sha256')
    .update(token)
    .update('\0')
    .update(secret)
    .update('\0')
    .update(getJWTJwksFingerprint(jwks))

  return hash.digest('base64url')
}

// JWT payloads are comparatively small and high-churn, so keep a higher
// cardinality guardrail than the longer-lived config-style caches.
// Max 65,536 items. At ~2KB per JWT, this uses roughly ~130MB of heap memory worst-case.
export const JWT_CACHE_MAX_ITEMS = 65536
export const JWT_CACHE_TTL_RESOLUTION_MS = 5000 // 5 seconds

const jwtCache = createLruCache<string, JWTPayload>(JWT_CACHE_NAME, {
  max: JWT_CACHE_MAX_ITEMS,
  ttlResolution: JWT_CACHE_TTL_RESOLUTION_MS,
  purgeStaleIntervalMs: DEFAULT_CACHE_PURGE_STALE_INTERVAL_MS,
})

/**
 * Verifies if a JWT is valid and caches the payload
 * for the duration of the token's expiration time
 * @param token
 * @param secret
 * @param jwks
 */
export async function verifyJWTWithCache(
  token: string,
  secret: string,
  jwks?: JwksConfig | null
): Promise<JWTPayload> {
  const cacheKey = getJWTCacheKey(token, secret, jwks)
  const cachedPayload = jwtCache.get(cacheKey)
  if (cachedPayload && cachedPayload.exp && cachedPayload.exp * 1000 > Date.now()) {
    return Promise.resolve(cachedPayload)
  }

  const payload = await verifyJWT(token, secret, jwks)
  if (!payload.exp) {
    return payload
  }

  const ttl = payload.exp * 1000 - Date.now()
  if (ttl > 0) {
    jwtCache.set(cacheKey, payload, { ttl })
  }
  return payload
}

/**
 * Verifies if a JWT is valid
 * @param token
 * @param secret
 * @param jwks
 */
export async function verifyJWT<T>(
  token: string,
  secret: string,
  jwks?: JwksConfig | null
): Promise<JWTPayload & T> {
  try {
    const { payload } = await jwtVerify<T>(token, getJWTVerificationKey(secret, jwks || null), {
      algorithms: getJWTAlgorithms(jwks || null),
    })
    return payload
  } catch (e) {
    const err = e as Error
    throw ERRORS.AccessDenied(err.message, err)
  }
}

/**
 * Sign a JWT
 * @param payload
 * @param secret
 * @param expiresIn
 */
export async function signJWT(
  payload: JWTPayload,
  secret: string | UrlSigningJwksConfigKey,
  expiresIn: string | number | undefined
): Promise<string> {
  const signer = new SignJWT(payload).setIssuedAt()
  if (expiresIn !== undefined) {
    const expiresInStr = getJWTExpirationTime(expiresIn)
    try {
      signer.setExpirationTime(expiresInStr)
    } catch (e) {
      throw ERRORS.InvalidParameter('expiresIn', { error: e as Error })
    }
  }

  if (typeof secret === 'string') {
    const signingSecret = JWT_HMAC_ALGOS.includes(jwtAlgorithm)
      ? await getPreparedJWTSigningKey(secret, jwtAlgorithm)
      : encoder.encode(secret)
    return signer.setProtectedHeader({ alg: jwtAlgorithm }).sign(signingSecret)
  }

  const alg = secret.alg || jwtAlgorithm
  const signingSecret = await getPreparedJWTSigningKey(secret, alg)
  return signer.setProtectedHeader({ kid: secret.kid, alg }).sign(signingSecret)
}

function getJWTExpirationTime(expiresIn: string | number) {
  if (typeof expiresIn === 'string') {
    return expiresIn
  }

  assertValidNumericJWTExpiration(expiresIn)
  return `${Math.floor(expiresIn)}s`
}

export function getMaxNumericJWTExpiration(nowMs = Date.now()) {
  const nowSeconds = Math.floor(nowMs / 1000)
  return Math.max(0, MAX_ABSOLUTE_JWT_EXPIRATION_SECONDS - nowSeconds)
}

export function assertValidNumericJWTExpiration(expiresIn: number, nowMs = Date.now()) {
  if (!Number.isFinite(expiresIn)) {
    throw ERRORS.InvalidParameter('expiresIn')
  }

  const expiresInSeconds = Math.floor(expiresIn)
  const maxRelativeExpirationSeconds = getMaxNumericJWTExpiration(nowMs)

  if (
    !Number.isSafeInteger(expiresInSeconds) ||
    expiresInSeconds < 1 ||
    expiresInSeconds > maxRelativeExpirationSeconds
  ) {
    throw ERRORS.InvalidParameter('expiresIn')
  }
}

/**
 * Generate a new random HS512 JWK that can be used for signing JWTs
 */
export async function generateHS512JWK(): Promise<JwksConfigKeyOCT> {
  const secret = await generateSecret('HS512', { extractable: true })
  const jwk = (await exportJWK(secret)) as JwksConfigKeyOCT
  jwk.alg = 'HS512'
  return jwk
}

/**
 * Generate a new ES256 JWK pair (ECDSA using the NIST P-256 curve and SHA-256)
 * that can be used for signing (private key) and verifying (public key) JWTs
 */
export async function generateES256JWK(): Promise<JwksConfigKeyEC> {
  const { privateKey } = await generateKeyPair('ES256', { extractable: true })
  const jwk = (await exportJWK(privateKey)) as JwksConfigKeyEC
  jwk.alg = 'ES256'
  return jwk
}

const JWT_SHAPE =
  /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)?$/

export function isJwtToken(token: string) {
  return token.replace('Bearer ', '').match(JWT_SHAPE)
}
