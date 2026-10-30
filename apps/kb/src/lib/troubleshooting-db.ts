import { createClient } from '@supabase/supabase-js'

export interface TroubleshootingEntryMetadata {
  githubUrl?: string
  dateUpdated?: Date
}

// Undefined when the row has no date or the value doesn't parse.
function parseDateUpdated(value: string | null): Date | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

/**
 * Looks up each slug's `github_url` and `date_updated` from
 * `troubleshooting_entries` (build time only — kb is fully static, no SSR).
 * Returns an empty map on any failure instead of throwing: both fields are
 * optional enhancements, not worth failing the whole build over.
 */
export async function getEntryMetadataBySlug(
  slugs: string[]
): Promise<Map<string, TroubleshootingEntryMetadata>> {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string
    )
    const { data: rows, error } = await supabase
      .from('troubleshooting_entries')
      .select('slug, github_url, date_updated')
      .in('slug', slugs)
    if (error) throw error
    return new Map(
      (rows ?? []).map((row) => [
        row.slug,
        {
          githubUrl: row.github_url ?? undefined,
          dateUpdated: parseDateUpdated(row.date_updated),
        },
      ])
    )
  } catch (error) {
    console.warn('[troubleshooting] Failed to look up entry metadata from the database:', error)
    return new Map()
  }
}
