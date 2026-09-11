import path from 'node:path'
import type { ReactNode } from 'react'

import { BlockItemCode } from './block-item-code'
import { BlockOverviewTabs } from './block-overview-tabs'
import { getBlockArchitecture } from '@/lib/block-architecture'
import { generateRegistryTree } from '@/lib/process-registry'
import { resolveRegistryItem } from '@/lib/registry-resolution'
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
  const resolved = registry.items.some((item) => item.name === name)
    ? resolveRegistryItem(registry, name)
    : undefined
  const architecture = getBlockArchitecture(name)

  return (
    <BlockOverviewTabs
      architecture={architecture}
      files={
        showFiles ? (
          <div className="flex h-full flex-col">
            {resolved && (
              <p className="border-b px-4 py-3 text-xs text-foreground-light">
                Supabase files
                {resolved.firstPartyDependencies.length > 0
                  ? ', including registry dependencies'
                  : ''}
                .
                {resolved.externalRegistryDependencies.length > 0 && (
                  <>
                    {' '}
                    External UI dependencies: {resolved.externalRegistryDependencies.join(', ')}.
                  </>
                )}
              </p>
            )}
            <div className="min-h-0 flex-1">
              <BlockItemCode
                files={generateRegistryTree(
                  path.join(process.cwd(), 'public', 'r', `${name}.json`)
                )}
                embedded
              />
            </div>
          </div>
        ) : undefined
      }
    >
      {children}
    </BlockOverviewTabs>
  )
}
