import { usePathname } from 'next/navigation'
import { ComponentProps, ReactNode } from 'react'

import { useParams } from 'common'
import {
  useIsSQLEditorTabsEnabled,
  useIsTableEditorTabsEnabled,
} from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useTabsStateSnapshot } from 'state/tabs'
import { cn } from 'ui'
import { ProjectLayoutWithAuth } from '../ProjectLayout/ProjectLayout'
import { CollapseButton } from '../Tabs/CollapseButton'
import { EditorTabs } from '../Tabs/Tabs'
import { useEditorType } from './EditorsLayout.hooks'

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

  const isTableEditorTabsEnabled = useIsTableEditorTabsEnabled()
  const isSQLEditorTabsEnabled = useIsSQLEditorTabsEnabled()

  const tableEditorTabsEnabled = editor === 'table' && isTableEditorTabsEnabled
  const sqlEditorTabsEnabled = editor === 'sql' && isSQLEditorTabsEnabled

  const hasNoOpenTabs =
    editor === 'table' ? tabs.openTabs.filter((x) => !x.startsWith('sql')).length === 0 : false
  const hideTabs =
    pathname === `/project/${ref}/editor` || pathname === `/project/${ref}/sql` || hasNoOpenTabs

  return (
    <ProjectLayoutWithAuth resizableSidebar title={title} product={product} {...props}>
      <div className="flex flex-col h-full">
        {tableEditorTabsEnabled || sqlEditorTabsEnabled ? (
          <div
            className={cn(
              'h-10 flex items-center',
              !hideTabs ? 'bg-surface-200 dark:bg-alternative' : 'bg-surface-100'
            )}
          >
            {hideTabs ? <CollapseButton hideTabs={hideTabs} /> : <EditorTabs />}
          </div>
        ) : null}
        <div className="h-full">{children}</div>
      </div>
    </ProjectLayoutWithAuth>
  )
}
