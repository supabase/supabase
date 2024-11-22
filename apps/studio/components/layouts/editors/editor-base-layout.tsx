import { useParams } from 'common'
import { OngoingQueriesPanel } from 'components/interfaces/SQLEditor/OngoingQueriesPanel'
import { usePathname } from 'next/navigation'
import { ComponentProps, ReactNode, useState } from 'react'
import { cn } from 'ui'
import { ProjectLayoutWithAuth } from '../ProjectLayout/ProjectLayout'
import { CollapseButton } from '../tabs/collapse-button'
import { ExplorerTabs } from '../tabs/explorer-tabs'

export interface ExplorerLayoutProps extends ComponentProps<typeof ProjectLayoutWithAuth> {
  children: ReactNode
  hideTabs?: boolean
}

export const EditorBaseLayout = ({ children, ...props }: ExplorerLayoutProps) => {
  const { ref } = useParams()
  const pathname = usePathname()
  const [showOngoingQueries, setShowOngoingQueries] = useState(false)

  const hideTabs =
    pathname === `/project/${ref}/explorer` ||
    pathname === `/project/${ref}/editor` ||
    pathname === `/project/${ref}/sql`

  return (
    <ProjectLayoutWithAuth {...props}>
      <div className="flex flex-col h-full">
        <div
          className={cn(
            'h-10 flex items-center',
            !hideTabs ? 'bg-surface-200 dark:bg-alternative' : 'bg-surface-100'
          )}
        >
          {hideTabs && <CollapseButton hideTabs={hideTabs} />}
          {!hideTabs && <ExplorerTabs storeKey="explorer" />}
        </div>
        <div className="h-full">{children}</div>
      </div>
      <OngoingQueriesPanel
        visible={showOngoingQueries}
        onClose={() => setShowOngoingQueries(false)}
      />
    </ProjectLayoutWithAuth>
  )
}
