import { GuidesSidebar } from '~/components/GuidesSidebar'
import { GuideTocMenu, TocAnchorsProvider } from '~/features/docs/GuidesMdx.client'
import { PageTitleObserver } from '~/layouts/MobileHeaderSlots'
import type { PropsWithChildren, ReactNode } from 'react'
import { cn } from 'ui'

interface ReferenceBetaPageTemplateProps extends PropsWithChildren {
  /** Plain-text page title, shown in the mobile header once scrolled past. */
  title: string
  header: ReactNode
}

/**
 * The guide page shell: content column, "on this page" table of contents and
 * the right rail. Headings (`h2`, `h3`) inside the article feed the table of
 * contents.
 */
export function ReferenceBetaPageTemplate({
  title,
  header,
  children,
}: ReferenceBetaPageTemplateProps) {
  return (
    <TocAnchorsProvider>
      <div className="grid grid-cols-12 relative gap-4">
        <div
          className={cn(
            'relative',
            'transition-all ease-out',
            'duration-100',
            'col-span-12 md:col-span-8',
            'layout-v2:md:col-span-12 layout-v2:w-full layout-v2:max-w-docs-content layout-v2:mx-auto'
          )}
        >
          <article
            // Used to get headings for the table of contents
            id="sb-docs-guide-main-article"
            className="prose max-w-none"
          >
            <PageTitleObserver title={title} />
            {header}
            <GuideTocMenu />
            {children}
          </article>
        </div>
        <GuidesSidebar
          className={cn(
            'hidden md:flex',
            'md:col-span-3 md:col-start-10',
            'self-start',
            'sticky',
            'top-[calc(var(--header-height)+3rem)]',
            'max-h-[calc(100vh-var(--header-height)-4rem)]'
          )}
        />
      </div>
    </TocAnchorsProvider>
  )
}
