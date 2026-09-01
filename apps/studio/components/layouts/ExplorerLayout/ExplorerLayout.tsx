import { useParams } from 'common'
import { AnimatePresence, motion } from 'framer-motion'
import { Home, MessageCirclePlus, NotebookText, Plus, SquareCode } from 'lucide-react'
import Link from 'next/link'
import { ComponentProps, ReactNode, useEffect, useEffectEvent, useState } from 'react'
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TabsTrigger,
} from 'ui'

import { EditorNavigationButton } from '../EditorNavigationButton'
import { ProjectLayoutWithAuth } from '../ProjectLayout'
import { EditorTabs } from '../Tabs/Tabs'
import { type ExplorerResourceType } from './ExplorerLayout.constants'
import { ExplorerNavChats } from './ExplorerNavChats'
import { ExplorerNavHome } from './ExplorerNavHome'
import { ExplorerNavNotebooks } from './ExplorerNavNotebooks'
import { ExplorerNotebookTabCoordinator } from '@/components/interfaces/Explorer/ExplorerNotebookTabCoordinator'
import { ExplorerQueryTabCoordinator } from '@/components/interfaces/Explorer/ExplorerQueryTabCoordinator'
import {
  useCreateChat,
  useCreateNotebook,
  useCreateQuery,
} from '@/components/interfaces/Explorer/hooks'
import { useIsTemporarySqlEditorVisit } from '@/hooks/misc/useIsTemporarySqlEditorVisit'
import {
  editorEntityTypes,
  EXPLORER_HOME_TAB,
  EXPLORER_HOME_TAB_ID,
  useTabsStateSnapshot,
  type Tab,
} from '@/state/tabs'

export interface ExplorerLayoutProps extends ComponentProps<typeof ProjectLayoutWithAuth> {
  children: ReactNode
  title?: string
}

export const ExplorerLayout = ({ browserTitle, children, title }: ExplorerLayoutProps) => {
  const { ref } = useParams()
  const tabs = useTabsStateSnapshot()

  const [section, setSection] = useState<ExplorerResourceType>()

  const { setIsTemporary: setIsTemporarySqlEditorVisit } = useIsTemporarySqlEditorVisit(ref)

  useEffect(() => {
    if (ref) setIsTemporarySqlEditorVisit(false)
  }, [ref, setIsTemporarySqlEditorVisit])

  const activeTab = tabs.activeTab ? tabs.tabsMap[tabs.activeTab] : undefined
  const isActiveExplorerTab =
    activeTab !== undefined && editorEntityTypes.explorer.includes(activeTab.type)
  const activeTabLabel = isActiveExplorerTab ? activeTab.label || 'Untitled' : 'Explorer'

  const mergedBrowserTitle = {
    ...browserTitle,
    section: title ?? browserTitle?.section,
    entity: browserTitle?.entity ?? activeTabLabel,
  }

  return (
    <ProjectLayoutWithAuth
      product="Explorer"
      browserTitle={mergedBrowserTitle}
      productMenuBadge={<BackToSqlEditorButton />}
      productMenu={
        <div className="relative h-full overflow-hidden">
          <AnimatePresence mode="wait">
            {section === undefined && <ExplorerNavHome key="home" onSelectSection={setSection} />}
            {section === 'notebook' && (
              <ExplorerNavNotebooks key="notebooks" onBack={() => setSection(undefined)} />
            )}
            {section === 'chat' && (
              <ExplorerNavChats key="chats" onBack={() => setSection(undefined)} />
            )}
          </AnimatePresence>
        </div>
      }
    >
      <ExplorerQueryTabCoordinator />

      <ExplorerNotebookTabCoordinator />

      <div className="flex flex-col h-full">
        <div className={cn('h-10 md:min-h-(--header-height) flex items-center bg-surface-100')}>
          <EditorTabs
            isCollapseButtonHidden
            customTabs={<HomeTabButton />}
            newTabButton={<NewTabButton />}
          />
        </div>
        <div className="flex-grow min-h-0">{children}</div>
      </div>
    </ProjectLayoutWithAuth>
  )
}

const BackToSqlEditorButton = () => {
  const { ref } = useParams()
  const { setIsTemporary } = useIsTemporarySqlEditorVisit(ref)

  if (!ref) return null

  return (
    <EditorNavigationButton
      asChild
      tooltip="Temporarily switch to SQL Editor to access your snippets"
    >
      <Link
        href={`/project/${ref}/sql`}
        aria-label="Switch to SQL Editor"
        onClick={() => setIsTemporary(true)}
      />
    </EditorNavigationButton>
  )
}

const TabClassName =
  'flex items-center justify-center min-w-(--header-height) min-h-(--header-height) hover:bg-surface-100 shrink-0'

const HomeTabButton = () => {
  const tabs = useTabsStateSnapshot()

  const openTabs = tabs.openTabs
    .map((id) => tabs.tabsMap[id])
    .filter((tab) => tab !== undefined) as Tab[]
  const explorerTabs = openTabs.filter((tab) => editorEntityTypes['explorer']?.includes(tab.type))

  const ensureHomeTab = useEffectEvent(() => {
    tabs.ensurePinnedTab(EXPLORER_HOME_TAB)
  })

  useEffect(() => ensureHomeTab(), [])

  return (
    <TabsTrigger
      value={EXPLORER_HOME_TAB_ID}
      className={cn(
        TabClassName,
        'relative group border-b border-default shadow-none!',
        explorerTabs.length === 0 && 'border-r border-r-default!',
        'bg-dash-sidebar/50 dark:bg-surface-100/50',
        'data-[state=active]:bg-dash-sidebar dark:data-[state=active]:bg-surface-100',
        'data-[state=active]:border-b-background-dash-sidebar dark:data-[state=active]:border-b-background-surface-100'
      )}
    >
      <Home
        size={14}
        strokeWidth={1.5}
        className="text-foreground-lighter transition-colors group-hover:text-foreground-light group-data-[state=active]:text-foreground"
      />
      <span className="sr-only">Open Explorer home</span>
      <div className="absolute w-full top-0 left-0 right-0 h-px bg-foreground opacity-0 group-data-[state=active]:opacity-100" />
    </TabsTrigger>
  )
}

const NewTabButton = () => {
  const { createNotebook } = useCreateNotebook()
  const { createQuery } = useCreateQuery()
  const { createChat } = useCreateChat()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          className={cn(TabClassName, 'border-b')}
          onClick={() => {}}
          initial={{ opacity: 0, scale: 0.8, x: -10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Plus
            size={16}
            strokeWidth={1.5}
            className="text-foreground-lighter hover:text-foreground-light"
          />
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" align="end">
        <DropdownMenuItem className="gap-x-2" onClick={() => createQuery()}>
          <SquareCode size={14} />
          <span>New query</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-x-2" onClick={() => createNotebook()}>
          <NotebookText size={14} />
          <span>New notebook</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-x-2" onClick={() => createChat()}>
          <MessageCirclePlus size={14} />
          <span>New chat</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
