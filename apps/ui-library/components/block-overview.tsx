import path from 'node:path'
import type { ReactNode } from 'react'

import { BlockItemCode } from './block-item-code'
import { BlockOverviewTabs } from './block-overview-tabs'
import { starterArchitectureDefinitions } from '@/config/starter-architecture'
import { generateBlockArchitecture, summarizeBlockArchitecture } from '@/lib/block-architecture'
import { generateRegistryTree } from '@/lib/process-registry'
import { registry } from '@/registry'

export function BlockOverview({
  name,
  children,
  showFiles = false,
}: {
  name: string
  children?: ReactNode
  showFiles?: boolean
}) {
  const definition = [...registry.items, ...starterArchitectureDefinitions].find(
    (item) => item.name === name
  )

  if (!definition) throw new Error(`Missing architecture definition for block: ${name}`)

  return (
    <BlockOverviewTabs
      architecture={summarizeBlockArchitecture(generateBlockArchitecture(definition))}
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
