import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

// Avoid importing next/cache at module scope so migrations can run in a plain Node env

import type { Customer } from '../../../payload-types'

export const revalidateCustomer: CollectionAfterChangeHook<Customer> = async ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = `/customers/${doc.slug}`

      payload.logger.info(`Revalidating event at path: ${path}`)
      try {
        const { revalidatePath, revalidateTag } = await import('next/cache')
        revalidatePath(path)
        revalidateTag('customers-sitemap')
      } catch {
        // no-op when not running inside Next runtime (e.g., during payload migrate)
      }
    }

    // If the event was previously published, we need to revalidate the old path
    if (previousDoc._status === 'published' && doc._status !== 'published') {
      const oldPath = `/customers/${previousDoc.slug}`

      payload.logger.info(`Revalidating old event at path: ${oldPath}`)

      try {
        const { revalidatePath, revalidateTag } = await import('next/cache')
        revalidatePath(oldPath)
        revalidateTag('customers-sitemap')
      } catch {}
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Customer> = async ({
  doc,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    const path = `/customers/${doc?.slug}`
    try {
      const { revalidatePath, revalidateTag } = await import('next/cache')
      revalidatePath(path)
      revalidateTag('customers-sitemap')
    } catch {}
  }

  return doc
}
