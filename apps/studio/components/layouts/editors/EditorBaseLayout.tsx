import { usePathname } from 'next/navigation'
import { ComponentProps, ReactNode } from 'react'

import { useParams } from 'common'
import { useTabsStateSnapshot } from 'state/tabs'
import { cn } from 'ui'
import { ProjectLayoutWithAuth } from '../ProjectLayout'
import { CollapseButton } from '../Tabs/CollapseButton'
import { EditorTabs } from '../Tabs/Tabs'
import { useEditorType } from './EditorsLayout.hooks'
import { useAppStateSnapshot } from 'state/app-state'

export interface ExplorerLayoutProps extends ComponentProps<typeof ProjectLayoutWithAuth> {
  children: ReactNode
  title?: string
  product?: string
  productMenuClassName?: string
}

export const EditorBaseLayout = ({
  children,
  title,
  product,
  productMenuClassName,
  productMenu,
}: ExplorerLayoutProps) => {
  const { ref } = useParams()
  const pathname = usePathname()
  const editor = useEditorType()
  const tabs = useTabsStateSnapshot()
  const { showTabs } = useAppStateSnapshot()

  const hasNoOpenTabs =
    editor === 'table' ? tabs.openTabs.filter((x) => !x.startsWith('sql')).length === 0 : false
  const hideTabs =
    pathname === `/project/${ref}/editor` || pathname === `/project/${ref}/sql` || hasNoOpenTabs

  return (
    <ProjectLayoutWithAuth
      resizableSidebar
      title={title}
      product={product}
      productMenuClassName={productMenuClassName}
      productMenu={productMenu}
    >
      <div className="flex flex-col h-full">
        <div
          className={cn(
            'flex items-center transition-all duration-300 ease-in-out',
            !hideTabs ? 'bg-surface-200 dark:bg-alternative' : 'bg-surface-100',
            showTabs ? 'h-10' : 'h-0'
          )}
        >
          {hideTabs ? <CollapseButton hideTabs={hideTabs} /> : <EditorTabs />}
        </div>
        <div className="h-full">{children}</div>
      </div>
    </ProjectLayoutWithAuth>
  )
}
