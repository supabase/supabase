import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts'

console.log('main function started')

const JWT_SECRET = Deno.env.get('JWT_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const VERIFY_JWT = Deno.env.get('VERIFY_JWT') === 'true'

// Create JWKS for ES256/RS256 tokens (newer tokens)
let SUPABASE_JWT_KEYS: ReturnType<typeof jose.createRemoteJWKSet> | null = null
if (SUPABASE_URL) {
  try {
    SUPABASE_JWT_KEYS = jose.createRemoteJWKSet(
      new URL(SUPABASE_URL + '/auth/v1/.well-known/jwks.json')
    )
  } catch (err) {
    console.error('Failed to create JWKS from SUPABASE_URL:', err)
  }
}

const SUPABASE_JWT_ISSUER = SUPABASE_URL
  ? SUPABASE_URL + '/auth/v1'
  : null

/**
 * Extract JWT token from Authorization header
 * 
 * Parses the Authorization header to extract the Bearer token.
 * Expects format: "Bearer <token>"
 * 
 * @param req - The HTTP request object
 * @returns The JWT token string
 * @throws Error if Authorization header is missing or malformed
 */
function getAuthToken(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    throw new Error('Missing authorization header')
  }
  const [bearer, token] = authHeader.split(' ')
  if (bearer !== 'Bearer') {
    throw new Error(`Auth header is not 'Bearer {token}'`)
  }
  return token
}

/**
 * Decode JWT header to detect algorithm
 * 
 * This function is used to determine whether a token uses HS256 (symmetric, legacy)
 * or ES256/RS256 (asymmetric, newer) algorithms. This is important because:
 * - HS256 tokens are verified using JWT_SECRET (Uint8Array)
 * - ES256/RS256 tokens are verified using public keys from JWKS endpoint (CryptoKey)
 * 
 * @param jwt - The JWT token string to decode
 * @returns The algorithm string (e.g., 'HS256', 'ES256', 'RS256') or null if decoding fails
 * 
 * Fix for issue #42072: Functions createClient issue when using legacy tokens in local docker
 */
function getJWTAlgorithm(jwt: string): string | null {
  try {
    const header = jose.decodeProtectedHeader(jwt)
    return header.alg ?? null
  } catch {
    return null
  }
}

/**
 * Verify JWT token, handling both legacy (HS256) and newer (ES256/RS256) algorithms
 * 
 * This function automatically detects the algorithm used in the token and applies
 * the appropriate verification method:
 * - HS256: Uses JWT_SECRET (symmetric key)
 * - ES256/RS256/EdDSA: Uses JWKS endpoint (asymmetric public keys)
 * 
 * This fix ensures compatibility with both legacy tokens and newer asymmetric tokens,
 * resolving the "Key for the ES256 algorithm must be of type CryptoKey" error.
 * 
 * @param jwt - The JWT token string to verify
 * @returns Promise resolving to true if verification succeeds, false otherwise
 */
async function verifyJWT(jwt: string): Promise<boolean> {
  try {
    const algorithm = getJWTAlgorithm(jwt)
    
    // For ES256/RS256 (asymmetric algorithms), use JWKS
    // These algorithms require CryptoKey from JWKS, not Uint8Array from JWT_SECRET
    if (algorithm === 'ES256' || algorithm === 'RS256' || algorithm === 'EdDSA') {
      if (!SUPABASE_JWT_KEYS || !SUPABASE_JWT_ISSUER) {
        console.error('JWKS not available for ES256/RS256 token verification')
        return false
      }
      try {
        await jose.jwtVerify(jwt, SUPABASE_JWT_KEYS, {
          issuer: SUPABASE_JWT_ISSUER,
        })
        return true
      } catch (err) {
        console.error('JWKS verification failed:', err)
        return false
      }
    }
    
    // For HS256 (symmetric algorithm), use JWT_SECRET
    if (algorithm === 'HS256' || !algorithm) {
      if (!JWT_SECRET) {
        console.error('JWT_SECRET not available for HS256 token verification')
        return false
      }
      const encoder = new TextEncoder()
      const secretKey = encoder.encode(JWT_SECRET)
      try {
        await jose.jwtVerify(jwt, secretKey)
        return true
      } catch (err) {
        console.error('HS256 verification failed:', err)
        return false
      }
    }
    
    // Unknown algorithm
    console.error(`Unsupported JWT algorithm: ${algorithm}`)
    return false
  } catch (err) {
    console.error('JWT verification error:', err)
    return false
  }
}

serve(async (req: Request) => {
  if (req.method !== 'OPTIONS' && VERIFY_JWT) {
    try {
      const token = getAuthToken(req)
      const isValidJWT = await verifyJWT(token)

      if (!isValidJWT) {
        return new Response(JSON.stringify({ msg: 'Invalid JWT' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    } catch (e) {
      console.error(e)
      return new Response(JSON.stringify({ msg: e.toString() }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
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
