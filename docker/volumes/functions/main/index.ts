import * as jose from 'jsr:@panva/jose@6'

console.log('main function started')

const JWT_SECRET = Deno.env.get('JWT_SECRET')
const SUPABASE_JWKS = parseJwks(Deno.env.get('SUPABASE_JWKS'))
const LOCAL_JWKS = SUPABASE_JWKS ? jose.createLocalJWKSet(SUPABASE_JWKS) : null
const VERIFY_JWT = Deno.env.get('VERIFY_JWT') === 'true'

type AuthFailure = {
  code: string
  message: string
}

const authFailure = (code: string, message: string): AuthFailure => ({ code, message })

const AUTH_FAILURE = {
  MissingAuthHeader: authFailure('UNAUTHORIZED_NO_AUTH_HEADER', 'Missing authorization header'),
  InvalidJwtFormat: authFailure('UNAUTHORIZED_INVALID_JWT_FORMAT', 'Invalid JWT format'),
  LegacyJwt: authFailure('UNAUTHORIZED_LEGACY_JWT', 'Invalid JWT'),
  AsymmetricJwt: authFailure('UNAUTHORIZED_ASYMMETRIC_JWT', 'Invalid JWT'),
  UnsupportedTokenAlgorithm: (algorithm: string | undefined) =>
    authFailure(
      'UNAUTHORIZED_UNSUPPORTED_TOKEN_ALGORITHM',
      `Unsupported JWT algorithm ${algorithm}`
    ),
}

// NOTE:(kallebysantos) We don't check for valid keys but just the bare array parsing,
// let this for 'jose' lib verification
export function parseJwks(raw: string | undefined): jose.JSONWebKeySet | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed?.keys && Array.isArray(parsed.keys)) {
      return parsed as jose.JSONWebKeySet
    }
    return null
  } catch {
    return null
  }
}

/**
 * Extract JWT token from Authorization header
 *
 * Parses the Authorization header to extract the Bearer token.
 * Expects format: "Bearer <token>"
 *
 * @param req - The HTTP request object
 * @returns The JWT token string or an authentication failure
 */
function getAuthToken(req: Request): string | AuthFailure {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return AUTH_FAILURE.MissingAuthHeader
  }
  const tokenParts = authHeader.split(' ')
  const [bearer, token] = tokenParts
  if (bearer !== 'Bearer' || tokenParts.length !== 2 || !token) {
    return AUTH_FAILURE.InvalidJwtFormat
  }
  return token
}

function getAuthErrorResponse({ code, message }: AuthFailure) {
  return new Response(JSON.stringify({ code, message, msg: message }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      'sb-error-code': code,
    },
  })
}

async function isValidLegacyJWT(jwt: string): Promise<AuthFailure | null> {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET not available for HS256 token verification')
    return AUTH_FAILURE.LegacyJwt
  }

  const encoder = new TextEncoder();
  const secretKey = encoder.encode(JWT_SECRET);

  try {
    await jose.jwtVerify(jwt, secretKey);
  } catch (e) {
    console.error('Symmetric Legacy JWT verification error', e);
    return AUTH_FAILURE.LegacyJwt
  }
  return null
}

async function isValidJWT(jwt: string): Promise<AuthFailure | null> {
  if (!LOCAL_JWKS) {
    console.error('JWKS not available for ES256/RS256 token verification')
    return AUTH_FAILURE.AsymmetricJwt
  }

  try {
    await jose.jwtVerify(jwt, LOCAL_JWKS);
  } catch (e) {
    console.error('Asymmetric JWT verification error', e);
    return AUTH_FAILURE.AsymmetricJwt
  }

  return null
}

/**
 * Verify JWT token, handling both legacy (HS256) and newer (ES256/RS256) algorithms
 * 
 * This function automatically detects the algorithm used in the token and applies
 * the appropriate verification method:
 * - HS256: Uses JWT_SECRET (symmetric key)
 * - ES256/RS256: Uses JWKS endpoint (asymmetric public keys)
 * 
 * This fix ensures compatibility with both legacy tokens and newer asymmetric tokens,
 * resolving the "Key for the ES256 algorithm must be of type CryptoKey" error.
 * 
 * @param jwt - The JWT token string to verify
 * @returns Authentication failure details, or null when verification succeeds
 */
async function isValidHybridJWT(jwt: string): Promise<AuthFailure | null> {
  let jwtAlgorithm: string | undefined
  try {
    jwtAlgorithm = jose.decodeProtectedHeader(jwt).alg
  } catch (e) {
    console.error('JWT format error', e)
    return AUTH_FAILURE.InvalidJwtFormat
  }

  if (jwtAlgorithm === 'HS256') {
    console.log(`Legacy token type detected, attempting ${jwtAlgorithm} verification.`)

    return await isValidLegacyJWT(jwt)
  }

  if (jwtAlgorithm === 'ES256' || jwtAlgorithm === 'RS256') {
    return await isValidJWT(jwt)
  }

  return AUTH_FAILURE.UnsupportedTokenAlgorithm(jwtAlgorithm)
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'OPTIONS' && VERIFY_JWT) {
    try {
      const token = getAuthToken(req)
      if (typeof token !== 'string') {
        return getAuthErrorResponse(token)
      }
      const authFailure = await isValidHybridJWT(token)
      if (authFailure) {
        return getAuthErrorResponse(authFailure)
      }
    } catch (e) {
      console.error(e)
      return getAuthErrorResponse(AUTH_FAILURE.InvalidJwtFormat)
    }
  }

  const url = new URL(req.url)
  const { pathname } = url
  const path_parts = pathname.split('/')
  const service_name = path_parts[1]

  if (!service_name || service_name === '') {
    const error = { msg: 'missing function name in request' }
    return new Response(JSON.stringify(error), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const servicePath = `/home/deno/functions/${service_name}`
  console.error(`serving the request with ${servicePath}`)

  const memoryLimitMb = 150
  const workerTimeoutMs = 1 * 60 * 1000
  const noModuleCache = false
  const importMapPath = null
  const envVarsObj = Deno.env.toObject()
  const envVars = Object.keys(envVarsObj).map((k) => [k, envVarsObj[k]])

  try {
    const worker = await EdgeRuntime.userWorkers.create({
      servicePath,
      memoryLimitMb,
      workerTimeoutMs,
      noModuleCache,
      importMapPath,
      envVars,
    })
    return await worker.fetch(req)
  } catch (e) {
    const error = { msg: e.toString() }
    return new Response(JSON.stringify(error), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
