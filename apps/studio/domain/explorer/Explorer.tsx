import type { ReactNode } from 'react'

import { ExplorerSidebar } from './ExplorerSidebar'
import { ExplorerTabs } from './ExplorerTabs'
import { useSyncProjectRef } from '@/domain/project/project.hooks'

export const Explorer = ({ children }: { children?: ReactNode }) => {
  useSyncProjectRef()

  return (
    <div className="flex h-full">
      <ExplorerSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <ExplorerTabs />
        {children}
      </div>
    </div>
  )
}
