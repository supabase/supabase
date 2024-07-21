'use client'

/**
 * The MDXProvider is necessary so that MDX partials will have access
 * to components.
 */

import { MDXProvider } from '@mdx-js/react'
import { type PropsWithChildren } from 'react'
import { components } from '~/features/docs/MdxBase.shared'

export function MDXProviderReference({ children }: PropsWithChildren) {
  return <MDXProvider components={components}>{children}</MDXProvider>
}
