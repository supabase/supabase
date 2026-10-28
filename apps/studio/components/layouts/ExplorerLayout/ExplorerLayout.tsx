import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import {
  HomeIcon,
  MessageCirclePlusIcon,
  NotebookTextIcon,
  PlusIcon,
  SquareCodeIcon,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { ComponentProps, ReactNode, useEffect, useEffectEvent } from 'react'
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TabsTrigger,
} from 'ui'

import { ProjectLayoutWithAuth } from '../ProjectLayout'
import { EditorTabs } from '../Tabs/Tabs'
import { explorerNavLevelSchema } from './ExplorerLayout.constants'
import { ExplorerNavChats } from './ExplorerNavChats'
import { ExplorerNavHeader } from './ExplorerNavHeader'
import { ExplorerNavHome } from './ExplorerNavHome'
import { ExplorerNavNotebooks } from './ExplorerNavNotebooks'
import { ExplorerNavTables } from './ExplorerNavTables'
import { ExplorerPreferencesDropdown } from './ExplorerPreferencesDropdown'
import { ExplorerProvider } from './ExplorerProvider'
import { useExplorerPreferences } from '@/components/interfaces/Account/Preferences/useExplorerPreferences'
import { ExplorerGeneratedPageTabCoordinator } from '@/components/interfaces/Explorer/ExplorerGeneratedPageTabCoordinator'
import { ExplorerNotebookTabCoordinator } from '@/components/interfaces/Explorer/ExplorerNotebookTabCoordinator'
import { ExplorerQueryTabCoordinator } from '@/components/interfaces/Explorer/ExplorerQueryTabCoordinator'
import {
  useCreateChat,
  useCreateNotebook,
  useCreateQuery,
} from '@/components/interfaces/Explorer/hooks'
import { useDashboardHistory } from '@/hooks/misc/useDashboardHistory'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
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
  const tabs = useTabsStateSnapshot()
  const { setLastVisitedExplorerTab } = useDashboardHistory()
  const { home, hasCompletedOnboarding, isReady } = useExplorerPreferences()
  const shouldShowHomeTab = isReady && (!hasCompletedOnboarding || home === 'home')

  // Remembered per project, so someone who lives in the table list reopens Explorer on it
  // rather than drilling in again from the root.
  const { ref } = useParams()
  const [storedLevel, setStoredLevel, { isSuccess, isError }] = useLocalStorageQuery<unknown>(
    LOCAL_STORAGE_KEYS.EXPLORER_NAV_LEVEL(ref ?? ''),
    null
  )
  // An unreadable stored value falls back to the root rather than leaving the sidebar empty.
  const isNavLevelReady = isSuccess || isError
  const levelResult = explorerNavLevelSchema.safeParse(storedLevel)
  const level = levelResult.success ? levelResult.data : undefined

  const activeTab = tabs.activeTab ? tabs.tabsMap[tabs.activeTab] : undefined
  const isActiveExplorerTab =
    activeTab !== undefined && editorEntityTypes.explorer.includes(activeTab.type)
  const activeTabLabel = isActiveExplorerTab ? activeTab.label || 'Untitled' : 'Explorer'

  const mergedBrowserTitle = {
    ...browserTitle,
    section: title ?? browserTitle?.section,
    entity: browserTitle?.entity ?? activeTabLabel,
  }

  const handleTabChange = (id: string) => {
    if (id === EXPLORER_HOME_TAB_ID) setLastVisitedExplorerTab(undefined)
  }

  return (
    <ExplorerProvider>
      <ProjectLayoutWithAuth
        product="Explorer"
        browserTitle={mergedBrowserTitle}
        productMenuHeader={
          <ExplorerNavHeader
            level={level}
            onBack={() => setStoredLevel(null)}
            rootAction={<ExplorerPreferencesDropdown />}
          />
        }
        productMenu={
          <div className="relative h-full overflow-hidden">
            {/* Waits for the stored level so a remembered panel doesn't slide in over the root. */}
            {isNavLevelReady && (
              <AnimatePresence initial={false} mode="wait">
                {level === undefined && (
                  <ExplorerNavHome key="home" onSelectLevel={setStoredLevel} />
                )}
                {level === 'tables' && <ExplorerNavTables key="tables" />}
                {level === 'notebook' && <ExplorerNavNotebooks key="notebooks" />}
                {level === 'chat' && <ExplorerNavChats key="chats" />}
              </AnimatePresence>
            )}
          </div>
        }
      >
        <ExplorerQueryTabCoordinator />

        <ExplorerNotebookTabCoordinator />

        <ExplorerGeneratedPageTabCoordinator />

        <div className="flex flex-col h-full">
          <div className={cn('h-10 md:min-h-(--header-height) flex items-center bg-surface-100')}>
            <EditorTabs
              isCollapseButtonHidden
              customTabs={shouldShowHomeTab ? <HomeTabButton /> : undefined}
              newTabButton={<NewTabButton />}
              onTabChange={handleTabChange}
            />
          </div>
          <div className="flex-grow min-h-0">{children}</div>
        </div>
      </ProjectLayoutWithAuth>
    </ExplorerProvider>
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
      <HomeIcon
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
          <PlusIcon
            size={16}
            strokeWidth={1.5}
            className="text-foreground-lighter hover:text-foreground-light"
          />
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" align="end">
        <DropdownMenuItem className="gap-x-2" onClick={() => createQuery()}>
          <SquareCodeIcon size={14} />
          <span>Run SQL</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-x-2" onClick={() => createNotebook()}>
          <NotebookTextIcon size={14} />
          <span>New notebook</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-x-2" onClick={() => createChat()}>
          <MessageCirclePlusIcon size={14} />
          <span>New chat</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
