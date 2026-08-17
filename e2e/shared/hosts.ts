// Never send a Vercel bypass secret anywhere that can't be a Supabase deployment.
export function isSupabaseHost(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return (
      hostname === 'supabase.com' ||
      hostname.endsWith('.supabase.com') ||
      hostname.endsWith('.vercel.app')
    )
  } catch {
    return false
  }
}
