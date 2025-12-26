import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Config } from '@/payload-types'

// Do not import next/cache at module scope to keep migrate step Node-compatible

type Collection = keyof Config['collections']

async function getDocument(collection: Collection, slug: string, depth = 0) {
  const payload = await getPayload({ config: configPromise })

  const page = await payload.find({
    collection,
    depth,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return page.docs[0]
}

/**
 * Returns a unstable_cache function mapped with the cache tag for the slug
 */
export const getCachedDocument = (collection: Collection, slug: string) => {
  return async () => {
    try {
      const { unstable_cache } = await import('next/cache')
      const cached = unstable_cache(async () => getDocument(collection, slug), [collection, slug], {
        tags: [`${collection}_${slug}`],
      })
      return cached()
    } catch {
      return getDocument(collection, slug)
    }
  }
}
