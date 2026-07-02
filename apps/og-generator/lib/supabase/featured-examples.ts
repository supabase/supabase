import { FEATURED_EXAMPLES, type FeaturedExample } from '@/lib/ai/examples'
import { getSupabase } from '@/lib/supabase/server'

/**
 * Featured examples, DB-backed when Supabase is configured (brief §6.8).
 *
 * Reads the `featured_examples` table (public-read RLS) so Design can curate the
 * corpus without a redeploy. Falls back to the bundled seed corpus whenever the
 * project is unconfigured, the query errors, or the table is empty — so the
 * suggester always has precedent to reason over.
 */

interface Row {
  id: string
  subject: string
  icon_name: string
  template_id: string
  eyebrow: string | null
  pattern: FeaturedExample['pattern'] | null
  why_it_works: string
}

export async function getFeaturedExamples(): Promise<FeaturedExample[]> {
  const supabase = getSupabase()
  if (!supabase) return FEATURED_EXAMPLES

  try {
    const { data, error } = await supabase
      .from('featured_examples')
      .select('id,subject,icon_name,template_id,eyebrow,pattern,why_it_works')
      .order('created_at', { ascending: true })

    if (error || !data || data.length === 0) return FEATURED_EXAMPLES

    return (data as Row[]).map((r) => ({
      id: r.id,
      subject: r.subject,
      iconName: r.icon_name,
      templateId: r.template_id,
      eyebrow: r.eyebrow ?? undefined,
      pattern: r.pattern ?? undefined,
      whyItWorks: r.why_it_works,
    }))
  } catch {
    return FEATURED_EXAMPLES
  }
}
