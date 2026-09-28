'use client'

import GuidesTableOfContents from '~/components/GuidesSidebar'
import { TocAnchorsProvider } from '~/features/docs/GuidesMdx.client'
import { type GuideFrontmatter } from '~/lib/docs'
import { mdToPlainText } from '~/lib/md-to-plain-text'
import { createContext, useContext, type ReactNode } from 'react'
import { cn } from 'ui'

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

  return (
    <GuideContext.Provider value={{ meta }}>
      <TocAnchorsProvider>
        <div className={cn('grid grid-cols-12 relative gap-4', className)}>
          <div
            className={cn(
              'relative',
              'transition-all ease-out',
              'duration-100',
              'col-span-12 w-full max-w-[731px] mx-auto'
            )}
          >
            {children}
          </div>
          {!hideToc && (
            <GuidesTableOfContents
              video={meta?.tocVideo}
              videoTitle={meta?.title ? mdToPlainText(meta.title) : undefined}
            />
          )}
        </div>
      </TocAnchorsProvider>
    </GuideContext.Provider>
  )
}
