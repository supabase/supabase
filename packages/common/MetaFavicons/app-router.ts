import type { Metadata } from 'next'

import { genFaviconLinks } from './icons'

export const genFaviconData = (basePath: string, route = '/favicon'): Metadata['icons'] => {
  const [icon, apple] = genFaviconLinks(basePath, route)
  return {
    icon: { url: icon.href, type: icon.type, sizes: icon.sizes },
    apple: { url: apple.href, sizes: apple.sizes },
  }
}
