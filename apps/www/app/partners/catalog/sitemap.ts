import { listCatalogPartnerSlugs } from '~/lib/marketplaceDb'
import type { MetadataRoute } from 'next'

// Detail pages render per request, so they're absent from the build's prerender manifest.
export const revalidate = 1800

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await listCatalogPartnerSlugs()
  return [...slugs]
    .sort((a, b) => a.localeCompare(b))
    .map((slug) => ({
      url: `https://supabase.com/partners/catalog/${encodeURIComponent(slug)}`,
      changeFrequency: 'weekly',
      priority: 0.5,
    }))
}
