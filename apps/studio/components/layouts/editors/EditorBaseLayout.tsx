import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { SqlEditor } from 'icons'
import { usePathname, useRouter } from 'next/navigation'
import { ComponentProps, ReactNode } from 'react'
import { cn } from 'ui'

import { ProjectLayoutWithAuth } from '../ProjectLayout'
import { CollapseButton } from '../Tabs/CollapseButton'
import { EditorTabs } from '../Tabs/Tabs'
import { useEditorType } from './EditorsLayout.hooks'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
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
      productMenuBadge={editor === 'sql' ? <BackToExplorerButton /> : undefined}
      productMenuClassName={productMenuClassName}
      productMenu={productMenu}
    >
      <div className="flex flex-col h-full">
        <div
          className={cn(
            'h-10 md:min-h-(--header-height) flex items-center',
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

const BackToExplorerButton = () => {
  const { ref } = useParams()
  const router = useRouter()
  const [isTemporary, setIsTemporary] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_TEMPORARY_FROM_EXPLORER(ref ?? ''),
    false
  )

  if (!ref || !isTemporary) return null

  return (
    <ButtonTooltip
      size="tiny"
      variant="outline"
      className="size-7 shrink-0 px-0"
      icon={<SqlEditor size={14} strokeWidth={1.5} />}
      tooltip={{ content: { side: 'bottom', text: 'Back to Explorer' } }}
      onClick={() => {
        setIsTemporary(false)
        router.push(`/project/${ref}/explorer`)
      }}
    />
  )
}
