import { MISC_URL } from '~/lib/constants'

export function generateOpenGraphImageMeta({
  type,
  title,
  description,
}: {
  type: string
  title: string
  description?: string
}) {
  return {
    url: `${MISC_URL}/functions/v1/og-images?site=docs&type=${encodeURIComponent(type)}&title=${encodeURIComponent(title)}&description=${encodeURIComponent(description ?? 'undefined')}`,
    width: 800,
    height: 600,
    alt: title,
  }
}
