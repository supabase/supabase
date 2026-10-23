import type { PropsWithChildren } from 'react'

import { ProjectLayoutWithAuth } from '../ProjectLayout'
import { useGenerateIssuesMenu } from './IssuesMenu.utils'
import { IssuesSidebar } from './IssuesSidebar'
import { IssuesSidebarHeader } from './IssuesSidebarHeader'
import { ProductMenuShortcuts } from '@/components/ui/ProductMenu/ProductMenuShortcuts'
import { useSyncIssuesMockViewer } from '@/data/issues/mock/useSyncIssuesMockViewer'

const SIDEBAR_WIDTH = 320

export const IssuesLayout = ({ children }: PropsWithChildren) => {
  const menu = useGenerateIssuesMenu()
  useSyncIssuesMockViewer()

  return (
    <ProjectLayoutWithAuth
      isLoading={false}
      product="Issues"
      resizableSidebar
      productMenuDefaultSize={SIDEBAR_WIDTH}
      productMenuHeader={<IssuesSidebarHeader />}
      productMenu={<IssuesSidebar />}
      productMenuClassName="overflow-hidden"
    >
      <ProductMenuShortcuts menu={menu} />
      {children}
    </ProjectLayoutWithAuth>
  )
}
