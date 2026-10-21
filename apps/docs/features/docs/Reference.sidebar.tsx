'use client'

import { AiTools } from '~/components/AiTools'
import { Feedback } from '~/components/Feedback'
import { useTocAnchors } from '~/features/docs/GuidesMdx.state'
import { MdxAnchor } from '~/features/docs/MdxAnchor'
import { isFeatureEnabled } from 'common'
import { usePathname } from 'next/navigation'
import { cn } from 'ui'
import { TocSection } from 'ui-patterns/Toc'

interface ReferenceSidebarProps {
  className?: string
  links?: Array<{ title: string; href: string }>
}

/**
 * Right-hand sidebar for reference pages that render prose (e.g. the
 * Management API introduction). Mirrors `GuidesSidebar`, plus a list of
 * additional links.
 */
export function ReferenceSidebar({ className, links = [] }: ReferenceSidebarProps) {
  const pathname = usePathname()
  const { toc } = useTocAnchors()
  const showFeedback = isFeatureEnabled('feedback:docs')

  return (
    <div className={cn('thin-scrollbar overflow-y-auto h-fit', 'px-px', className)}>
      <div className="w-full relative border-l flex flex-col gap-6 lg:gap-8 px-2 h-fit">
        {showFeedback && (
          <div className="pl-5">
            <Feedback key={pathname} />
          </div>
        )}
        <div className="pl-5">
          <AiTools
            key={pathname}
            pageType="guide"
            articleId="sb-docs-guide-main-article"
            showAgentSetup
            showPreferredSource
          />
        </div>
        {toc.length !== 0 && <TocSection items={toc} />}
        {links.length !== 0 && (
          <div className="pl-5">
            <h3 className="font-mono text-xs uppercase text-foreground">Additional links</h3>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm">
              {links.map((link) => (
                <li key={link.href}>
                  <MdxAnchor href={link.href} className="text-foreground-lighter">
                    {link.title}
                  </MdxAnchor>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
