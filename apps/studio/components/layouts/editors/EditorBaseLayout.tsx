import { useParams } from 'common'
import { usePathname } from 'next/navigation'
import { ComponentProps, ReactNode } from 'react'
import { cn } from 'ui'

import { ProjectLayoutWithAuth } from '../ProjectLayout'
import { CollapseButton } from '../Tabs/CollapseButton'
import { EditorTabs } from '../Tabs/Tabs'
import { useEditorType } from './EditorsLayout.hooks'
import { useTabsStateSnapshot } from '@/state/tabs'

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
  browserTitle,
}: ExplorerLayoutProps) => {
  const { ref } = useParams()
  const pathname = usePathname()
  const editor = useEditorType()
  const tabs = useTabsStateSnapshot()

  const hasNoOpenTabs =
    editor === 'table' ? tabs.openTabs.filter((x) => !x.startsWith('sql')).length === 0 : false
  const hideTabs =
    pathname === `/project/${ref}/editor` || pathname === `/project/${ref}/sql` || hasNoOpenTabs

  const activeEditorTab = tabs.activeTab ? tabs.tabsMap[tabs.activeTab] : undefined
  // Prefer the live tab label so browser titles update immediately after a rename,
  // even when persisted tab metadata is still catching up.
  const activeEditorTabLabel = activeEditorTab?.label ?? activeEditorTab?.metadata?.name
  const activeEditorTabEntity =
    activeEditorTab === undefined
      ? undefined
      : editor === 'sql'
        ? activeEditorTab.type === 'sql'
          ? activeEditorTabLabel
          : undefined
        : editor === 'table'
          ? activeEditorTab.type !== 'sql'
            ? activeEditorTabLabel
            : undefined
          : undefined

  const mergedBrowserTitle = {
    ...browserTitle,
    section: title ?? browserTitle?.section,
    entity: browserTitle?.entity ?? activeEditorTabEntity,
  }

  return (
    <ProjectLayoutWithAuth
      resizableSidebar
      product={product}
      browserTitle={mergedBrowserTitle}
      productMenuClassName={productMenuClassName}
      productMenu={productMenu}
    >
      <div className="flex flex-col h-full">
        <div
          className={cn(
            'h-10 md:min-h-[var(--header-height)] flex items-center',
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
