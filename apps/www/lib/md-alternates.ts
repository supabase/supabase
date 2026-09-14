import type { Metadata } from 'next'

import { SITE_ORIGIN } from './constants'

export function mdAlternates(slug: string): Metadata['alternates'] {
  return {
    types: {
      'text/markdown': `${SITE_ORIGIN}/${slug}.md`,
    },
  }
}
