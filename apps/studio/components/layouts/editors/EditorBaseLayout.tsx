import { usePathname } from 'next/navigation'
import { ComponentProps, ReactNode } from 'react'

import { useParams } from 'common'
import {
  useIsSQLEditorTabsEnabled,
  useIsTableEditorTabsEnabled,
} from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { cn } from 'ui'
import { ProjectLayoutWithAuth } from '../ProjectLayout/ProjectLayout'
import { Tabs } from '../Tabs'
import { CollapseButton } from '../Tabs/CollapseButton'
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

  const isTableEditorTabsEnabled = useIsTableEditorTabsEnabled()
  const isSQLEditorTabsEnabled = useIsSQLEditorTabsEnabled()

  const tableEditorTabsEnabled = editor === 'table' && isTableEditorTabsEnabled
  const sqlEditorTabsEnabled = editor === 'sql' && isSQLEditorTabsEnabled
  const hideTabs = pathname === `/project/${ref}/editor` || pathname === `/project/${ref}/sql`

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
