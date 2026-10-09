import { createClient } from '@supabase/supabase-js'

/**
 * Looks up each slug's `github_url` from `troubleshooting_entries` (build
 * time only — kb is fully static, no SSR). Returns an empty map on any
 * failure instead of throwing: this is an optional enhancement (the "Go to
 * the GitHub discussion" link), not worth failing the whole build over.
 */
export async function getGithubUrlsBySlug(slugs: string[]): Promise<Map<string, string>> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    )
    const { data: rows, error } = await supabase
      .from('troubleshooting_entries')
      .select('slug, github_url')
      .in('slug', slugs)
    if (error) throw error
    return new Map((rows ?? []).map((row) => [row.slug, row.github_url]))
  } catch (error) {
    console.warn('[troubleshooting] Failed to look up github_url from the database:', error)
    return new Map()
  }
}
