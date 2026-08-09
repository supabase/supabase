import { useParams } from 'common'
import { AnimatePresence, motion } from 'framer-motion'
import { Home, MessageCirclePlus, NotebookText, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ComponentProps, ReactNode, useState } from 'react'
import { cn, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'ui'

import { ProjectLayoutWithAuth } from '../ProjectLayout'
import { EditorTabs } from '../Tabs/Tabs'
import { type ExplorerResourceType } from './ExplorerLayout.constants'
import { ExplorerNavChats } from './ExplorerNavChats'
import { ExplorerNavHome } from './ExplorerNavHome'
import { ExplorerNavNotebooks } from './ExplorerNavNotebooks'
import { useCreateNotebook } from '@/components/interfaces/Explorer/hooks'

export interface ExplorerLayoutProps extends ComponentProps<typeof ProjectLayoutWithAuth> {
  children: ReactNode
  title?: string
}

export const ExplorerLayout = ({ browserTitle, children, title }: ExplorerLayoutProps) => {
  const [section, setSection] = useState<ExplorerResourceType>()

  // [Joshen] Temporary, to hook up with tabs store
  const activeTabLabel = 'Active Tab Label'

  const mergedBrowserTitle = {
    ...browserTitle,
    section: title ?? browserTitle?.section,
    entity: browserTitle?.entity ?? activeTabLabel,
  }

  return (
    <ProjectLayoutWithAuth
      product="Explorer"
      browserTitle={mergedBrowserTitle}
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

const TabClassName =
  'flex items-center justify-center min-w-(--header-height) min-h-(--header-height) hover:bg-surface-100 shrink-0 border-b'

const HomeTabButton = () => {
  const router = useRouter()
  const { ref } = useParams()
  const isActive = router.pathname.endsWith('/explorer')

  return (
    <Link href={`/project/${ref}/explorer`} className={cn(TabClassName, 'border-r')}>
      <Home
        size={14}
        strokeWidth={1.5}
        className={cn(
          isActive ? 'text-foreground' : 'text-foreground-lighter hover:text-foreground-light'
        )}
      />
      <span className="sr-only">Open Explorer home</span>
    </Link>
  )
}

const NewTabButton = () => {
  const { createNotebook } = useCreateNotebook()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          className={TabClassName}
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
        <DropdownMenuItem className="gap-x-2" onClick={() => createNotebook()}>
          <NotebookText size={14} />
          <span>New notebook</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="gap-x-2">
          <MessageCirclePlus size={14} />
          <span>New chat</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
