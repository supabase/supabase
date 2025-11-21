'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { cn } from 'ui'

import GuidesTableOfContents from '~/components/GuidesTableOfContents'
import { TocAnchorsProvider } from '~/features/docs/GuidesMdx.client'
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

  return (
    <GuideContext.Provider value={{ meta }}>
      <TocAnchorsProvider>
        <div className={cn('grid grid-cols-12 relative gap-4', className)}>
          <div
            className={cn(
              'relative',
              'transition-all ease-out',
              'duration-100',
              hideToc ? 'col-span-12' : 'col-span-12 md:col-span-9'
            )}
          >
            {children}
          </div>
          {!hideToc && (
            <GuidesTableOfContents
              video={meta?.tocVideo}
              className={cn(
                'hidden md:flex',
                'col-span-3 self-start',
                'sticky',
                /**
                 * --header-height: height of nav
                 * 1px: height of nav border
                 * 2rem: content padding
                 */
                'top-[calc(var(--header-height)+1px+2rem)]',
                // 3rem accounts for 2rem of top padding + 1rem of extra breathing room
                'max-h-[calc(100vh-var(--header-height)-3rem)]'
              )}
            />
          )}
        </div>
      </TocAnchorsProvider>
    </GuideContext.Provider>
  )
}
