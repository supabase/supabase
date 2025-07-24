import { usePathname } from 'next/navigation'
import { ComponentProps, ReactNode } from 'react'

import { useParams } from 'common'
import { useTabsStateSnapshot } from 'state/tabs'
import { cn } from 'ui'
import { ProjectLayoutWithAuth } from '../ProjectLayout/ProjectLayout'
import { CollapseButton } from '../Tabs/CollapseButton'
import { EditorTabs } from '../Tabs/Tabs'
import { useEditorType } from './EditorsLayout.hooks'
import { TransactionBanner } from '../TransactionBanner'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'

export interface ExplorerLayoutProps extends ComponentProps<typeof ProjectLayoutWithAuth> {
  children: ReactNode
  hideTabs?: boolean
  title?: string
  product?: string
}

export const EditorBaseLayout = ({ children, title, product, ...props }: ExplorerLayoutProps) => {
  const { ref } = useParams()
  const pathname = usePathname()
  const editor = useEditorType()
  const tabs = useTabsStateSnapshot()
  const { hasTransaction } = useRoleImpersonationStateSnapshot()

  const hasNoOpenTabs =
    editor === 'table' ? tabs.openTabs.filter((x) => !x.startsWith('sql')).length === 0 : false
  const hideTabs =
    pathname === `/project/${ref}/editor` || pathname === `/project/${ref}/sql` || hasNoOpenTabs

  return (
    <ProjectLayoutWithAuth resizableSidebar title={title} product={product} {...props}>
      <div
        className={cn(
          'flex flex-col h-full',
          hasTransaction && 'border-2 border-t-0 border-warning'
        )}
      >
        <TransactionBanner />
        <div
          className={cn(
            'h-10 flex items-center',
            !hideTabs ? 'bg-surface-200 dark:bg-alternative' : 'bg-surface-100'
          )}
        >
          {hideTabs ? <CollapseButton hideTabs={hideTabs} /> : <EditorTabs />}
        </div>
        <div className="h-full">{children}</div>
      </div>
    </ProjectLayoutWithAuth>
  )
}
