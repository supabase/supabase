// The Edge Functions gateway supplies the public origin in forwarded headers.
// SUPABASE_URL is an internal Docker address when serving locally.
export function getPublicProjectUrl(request: Request): string {
  const publicUrl = Deno.env.get('SUPABASE_PUBLIC_URL')?.trim()
  if (publicUrl) return new URL(publicUrl).origin

  const url = new URL(request.url)
  const protocol = request.headers.get('x-forwarded-proto') ?? url.protocol.slice(0, -1)
  const host = request.headers.get('x-forwarded-host') ?? url.host
  const publicOrigin = new URL(`${protocol}://${host}`)
  const port = request.headers.get('x-forwarded-port')
  if (port && !publicOrigin.port && !host.includes(':')) publicOrigin.port = port
  return publicOrigin.origin
}
