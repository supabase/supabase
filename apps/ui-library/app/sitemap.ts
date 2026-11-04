import type { MetadataRoute } from 'next'

import { allDocs } from '@/.velite'
import { CANONICAL_ORIGIN, LIBRARY_PATH } from '@/lib/canonical'

// The library is served under /library on the main site, so every URL needs the
// base path, which crawlers don't add.
const SITE_URL = CANONICAL_ORIGIN
const BASE_PATH = LIBRARY_PATH

export default function sitemap(): MetadataRoute.Sitemap {
  const docUrls = allDocs
    .filter((doc) => doc.published)
    .map((doc) => ({
      url: `${SITE_URL}${BASE_PATH}/docs/${doc.slugAsParams}`,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }))

  return [
    {
      url: `${SITE_URL}${BASE_PATH}`,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...docUrls,
  ]
}
