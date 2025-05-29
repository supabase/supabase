import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Customer } from '../../../payload-types'

export const revalidateCustomer: CollectionAfterChangeHook<Customer> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = `/customers/${doc.slug}`

      payload.logger.info(`Revalidating event at path: ${path}`)

      revalidatePath(path)
      revalidateTag('customers-sitemap')
    }

    // If the event was previously published, we need to revalidate the old path
    if (previousDoc._status === 'published' && doc._status !== 'published') {
      const oldPath = `/customers/${previousDoc.slug}`

      payload.logger.info(`Revalidating old event at path: ${oldPath}`)

      revalidatePath(oldPath)
      revalidateTag('customers-sitemap')
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Customer> = ({
  doc,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    const path = `/customers/${doc?.slug}`

    revalidatePath(path)
    revalidateTag('customers-sitemap')
  }

  return doc
}
