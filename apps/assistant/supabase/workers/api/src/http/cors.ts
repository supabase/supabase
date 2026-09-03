/** Local Studio (8082), supabase.com, supabase.green (staging), and their subdomains. */
export const ALLOWED_ORIGIN =
  /^https?:\/\/(localhost:8082|127\.0\.0\.1:8082|(?:.*\.)?supabase\.(?:com|green))$/

export function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGIN.test(origin)
}

export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin')
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'authorization, content-type, apikey, x-client-info, x-supabase-api-version',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }

  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }

  return headers
}

export function corsForRequest(request: Request): { headers: Record<string, string> } {
  return { headers: corsHeaders(request) }
}
