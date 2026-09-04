import { cors } from 'hono/cors'

/**
 * Local Studio (8082), supabase.com / supabase.green, and Vercel previews on
 * the supabase team (`*-supabase.vercel.app`, e.g. studio-staging-git-…-supabase.vercel.app).
 */
export const ALLOWED_ORIGIN =
  /^https?:\/\/(localhost:8082|127\.0\.0\.1:8082|(?:.*\.)?supabase\.(?:com|green)|[a-z0-9-]+-supabase\.vercel\.app)$/

export function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGIN.test(origin)
}

export const assistantCors = cors({
  origin: (origin) => (isAllowedOrigin(origin) ? origin : undefined),
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: [
    'authorization',
    'content-type',
    'apikey',
    'x-client-info',
    'x-supabase-api-version',
  ],
  credentials: true,
  maxAge: 86400,
})
