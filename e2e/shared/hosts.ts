// Never send a Vercel bypass secret anywhere that can't be a Supabase deployment.
export function isSupabaseHost(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url)
    if (protocol !== 'https:') return false
    return (
      hostname === 'supabase.com' ||
      hostname.endsWith('.supabase.com') ||
      hostname.endsWith('-supabase.vercel.app')
    )
  } catch {
    return false
  }
}
