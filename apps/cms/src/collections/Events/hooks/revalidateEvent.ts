import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

// Avoid importing next/cache at module scope so migrations can run in a plain Node env

import type { Event } from '../../../payload-types'

export const revalidateEvent: CollectionAfterChangeHook<Event> = async ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = `/events/${doc.slug}`

      payload.logger.info(`Revalidating event at path: ${path}`)
      try {
        const { revalidatePath, revalidateTag } = await import('next/cache')
        revalidatePath(path)
        revalidateTag('events-sitemap')
      } catch {}
    }

    // If the event was previously published, we need to revalidate the old path
    if (previousDoc._status === 'published' && doc._status !== 'published') {
      const oldPath = `/events/${previousDoc.slug}`

      payload.logger.info(`Revalidating old event at path: ${oldPath}`)

      try {
        const { revalidatePath, revalidateTag } = await import('next/cache')
        revalidatePath(oldPath)
        revalidateTag('events-sitemap')
      } catch {}
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Event> = async ({
  doc,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    const path = `/events/${doc?.slug}`
    try {
      const { revalidatePath, revalidateTag } = await import('next/cache')
      revalidatePath(path)
      revalidateTag('events-sitemap')
    } catch {}
  }

  return doc
}
