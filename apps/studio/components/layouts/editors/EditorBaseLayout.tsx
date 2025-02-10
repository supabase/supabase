import { useParams } from 'common'
import { useFeaturePreviewContext } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { usePathname } from 'next/navigation'
import { ComponentProps, ReactNode } from 'react'
import { cn } from 'ui'
import { ProjectLayoutWithAuth } from '../ProjectLayout/ProjectLayout'
import { CollapseButton } from '../Tabs/CollapseButton'
import { Tabs } from '../Tabs'
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

  // tabs preview flag logic
  const editor = useEditorType()
  const { flags } = useFeaturePreviewContext()
  const tableEditorTabsEnabled =
    editor === 'table' && flags[LOCAL_STORAGE_KEYS.UI_TABLE_EDITOR_TABS]
  const sqlEditorTabsEnabled = editor === 'sql' && flags[LOCAL_STORAGE_KEYS.UI_SQL_EDITOR_TABS]
  const hideTabs = pathname === `/project/${ref}/editor` || pathname === `/project/${ref}/sql`
  // end of tabs preview flag logic

  return (
    <ProjectLayoutWithAuth resizableSidebar={true} title={title} product={product} {...props}>
      <div className="flex flex-col h-full">
        {tableEditorTabsEnabled || sqlEditorTabsEnabled ? (
          <div
            className={cn(
              'h-10 flex items-center',
              !hideTabs ? 'bg-surface-200 dark:bg-alternative' : 'bg-surface-100'
            )}
          >
            {hideTabs && <CollapseButton hideTabs={hideTabs} />}
            {!hideTabs && <Tabs />}
          </div>
        ) : null}
        <div className="h-full">{children}</div>
      </div>
    </ProjectLayoutWithAuth>
  )
}
