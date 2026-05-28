'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { cn } from 'ui'

import GuidesTableOfContents from '~/components/GuidesSidebar'
import { TocAnchorsProvider } from '~/features/docs/GuidesMdx.client'
import {
  guideArticleColumnClassName,
  guideSecondarySidebarClassName,
  useHideGuideSecondarySidebar,
} from '~/features/ai-sidebar/GuideLayout'
import { type GuideFrontmatter } from '~/lib/docs'

interface GuideContextValue {
  meta?: GuideFrontmatter
}

const GuideContext = createContext<GuideContextValue | undefined>(undefined)

export const useGuide = () => {
  const context = useContext(GuideContext)
  if (!context) {
    throw new Error('useGuide must be used within a GuideProvider')
  }
  return context
}

interface GuideProps {
  meta?: GuideFrontmatter
  children?: ReactNode
  className?: string
}

export function Guide({ meta, children, className }: GuideProps) {
  const hideToc = meta?.hideToc || meta?.hide_table_of_contents
  const isAiSidebarOpen = useHideGuideSecondarySidebar()

  return (
    <GuideContext.Provider value={{ meta }}>
      <TocAnchorsProvider>
        <div className={cn('grid grid-cols-12 relative gap-4', className)}>
          <div
            className={guideArticleColumnClassName(
              isAiSidebarOpen,
              cn(hideToc && 'col-span-12 md:col-span-12')
            )}
          >
            {children}
          </div>
          {!hideToc && (
            <GuidesTableOfContents
              video={meta?.tocVideo}
              className={guideSecondarySidebarClassName(isAiSidebarOpen)}
            />
          )}
        </div>
      </TocAnchorsProvider>
    </GuideContext.Provider>
  )
}
