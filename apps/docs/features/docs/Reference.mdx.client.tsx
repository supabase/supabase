'use client'

/**
 * The MDXProvider is necessary so that MDX partials will have access
 * to components.
 *
 * Since the reference pages are so heavy, keep the weight down by only
 * including the bare minimum.
 */

import { MDXProvider } from '@mdx-js/react'
import { type PropsWithChildren } from 'react'

import { Admonition } from 'ui'

const components = { Admonition }

export function MDXProviderReference({ children }: PropsWithChildren) {
  return <MDXProvider components={components}>{children}</MDXProvider>
}
