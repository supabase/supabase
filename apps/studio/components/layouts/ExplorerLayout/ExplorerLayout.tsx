import { AnimatePresence } from 'framer-motion'
import { ComponentProps, ReactNode, useState } from 'react'

import { ProjectLayoutWithAuth } from '../ProjectLayout'
import { type ExplorerResourceType } from './ExplorerLayout.constants'
import { ExplorerNavChats } from './ExplorerNavChats'
import { ExplorerNavHome } from './ExplorerNavHome'
import { ExplorerNavNotebooks } from './ExplorerNavNotebooks'

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
      {children}
    </ProjectLayoutWithAuth>
  )
}
