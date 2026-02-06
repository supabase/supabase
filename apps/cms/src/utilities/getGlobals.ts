import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Config } from '@/payload-types'

// Do not import next/cache at module scope to keep migrate step Node-compatible

type Global = keyof Config['globals']

async function getGlobal(slug: Global, depth = 0) {
  const payload = await getPayload({ config: configPromise })

  const global = await payload.findGlobal({
    slug,
    depth,
  })

  return global
}

/**
 * Returns a unstable_cache function mapped with the cache tag for the slug
 */
export const getCachedGlobal = (slug: Global, depth = 0) => {
  return async () => {
    try {
      const { unstable_cache } = await import('next/cache')
      const cached = unstable_cache(async () => getGlobal(slug, depth), [slug], {
        tags: [`global_${slug}`],
      })
      return cached()
    } catch {
      return getGlobal(slug, depth)
    }
  }
}
