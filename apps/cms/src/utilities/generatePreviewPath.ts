import { PayloadRequest, CollectionSlug } from 'payload'
import { WWW_SITE_ORIGIN } from './constants'

const collectionPrefixMap: Partial<Record<CollectionSlug, string>> = {
  posts: '/blog',
}

type Props = {
  collection: keyof typeof collectionPrefixMap
  slug: string
  req: PayloadRequest
}

export const generatePreviewPath = ({ collection, slug }: Props) => {
  if (collection === 'posts') {
    const baseUrl = WWW_SITE_ORIGIN || 'http://localhost:3000'
    // Use our preview API route for post previews
    return `${baseUrl}/api-v2/cms/preview?slug=${slug}`
  }

  const encodedParams = new URLSearchParams({
    slug,
    collection,
    path: `${collectionPrefixMap[collection]}/${slug}`,
    previewSecret: process.env.PREVIEW_SECRET || '',
  })

  const url = `/next/preview?${encodedParams.toString()}`

  return url
}
