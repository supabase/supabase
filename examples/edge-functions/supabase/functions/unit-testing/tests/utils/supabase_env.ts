// supabase/functions/tests/utils/supabase_env.ts
import { exportJWK, generateKeyPair, GenerateKeyPairResult, SignJWT } from 'jsr:@panva/jose@6'

const jwk: GenerateKeyPairResult = await generateKeyPair('RS256')
const publicJwk = await exportJWK(jwk.publicKey)
publicJwk.alg = 'RS256'
publicJwk.use = 'sig'

export const env = {
  url: 'http://mocksupabase',
  publishableKeys: { default: 'sb_publishable_xy' },
  secretKeys: { default: 'sb_secret_xy' },
  jwks: {
    keys: [publicJwk],
  },
}

export function exportEnv() {
  Deno.env.set('SUPABASE_URL', env.url)
  Deno.env.set('SUPABASE_PUBLISHABLE_KEYS', JSON.stringify(env.publishableKeys))
  Deno.env.set('SUPABASE_SECRET_KEYS', JSON.stringify(env.secretKeys))
  Deno.env.set('SUPABASE_JWKS', JSON.stringify(env.jwks))
}

export async function generateUserToken() {
  const token = await new SignJWT({
    sub: 'user-123',
    role: 'authenticated',
    email: 'test@example.com',
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(jwk.privateKey)

  return token
}
