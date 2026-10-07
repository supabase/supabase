import path from 'node:path'
import type { ReactNode } from 'react'

import { BlockItemCode } from './block-item-code'
import { BlockOverviewTabs } from './block-overview-tabs'
import { generateRegistryTree } from '@/lib/process-registry'

export function BlockOverview({
  name,
  children,
  showFiles = false,
}: {
  name: string
  children?: ReactNode
  showFiles?: boolean
}) {
  return (
    <BlockOverviewTabs
      files={
        showFiles ? (
          <BlockItemCode
            files={generateRegistryTree(path.join(process.cwd(), 'public', 'r', `${name}.json`))}
            embedded
          />
        ) : undefined
      }
    >
      {children}
    </BlockOverviewTabs>
  )
}
