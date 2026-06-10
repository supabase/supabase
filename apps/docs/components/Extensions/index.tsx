'use client'

import { lazy, Suspense } from 'react'
import { extensions } from 'shared-data'

const ExtensionsInternal = lazy(() => import('./Extensions'))

export function Extensions() {
  return (
    <Suspense>
      <ExtensionsInternal />
    </Suspense>
  )
}

Extensions.__markdown__ = `
  ${extensions.map((extension) => ` - [${extension.name}](${extension.link})`).join('\n')}
`
