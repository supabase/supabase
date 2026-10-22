import { createClient } from '@supabase/supabase-js'

export interface TroubleshootingEntryMetadata {
  githubUrl?: string
  dateUpdated?: Date
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
      (rows ?? []).map((row) => {
        const dateUpdated = row.date_updated ? new Date(row.date_updated) : undefined
        return [
          row.slug,
          {
            githubUrl: row.github_url ?? undefined,
            dateUpdated:
              dateUpdated && !Number.isNaN(dateUpdated.getTime()) ? dateUpdated : undefined,
          },
        ]
      })
    )
  } catch (error) {
    console.warn('[troubleshooting] Failed to look up entry metadata from the database:', error)
    return new Map()
  }
}
