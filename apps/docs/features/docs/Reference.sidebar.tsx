'use client'

import { Feedback } from '~/components/Feedback'
import { useTocAnchors } from '~/features/docs/GuidesMdx.state'
import { MdxAnchor } from '~/features/docs/MdxAnchor'
import { isFeatureEnabled } from 'common'
import { usePathname } from 'next/navigation'
import { cn } from 'ui'
import { TocSection } from 'ui-patterns/Toc'

export type ReferenceLink = { title: string; href: string }

export function ReferenceLinks({
  links,
  className,
}: {
  links: ReferenceLink[]
  className?: string
}) {
  return (
    <div className={className}>
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
  )
}

interface ReferenceSidebarProps {
  className?: string
  links?: ReferenceLink[]
}

/**
 * Right-hand sidebar for reference pages that render prose (e.g. the
 * Management API introduction). Mirrors `GuidesSidebar` minus the AI tools,
 * which need a per-page markdown file that reference pages don't have yet,
 * plus a list of additional links.
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
        {/* `static`: the default sticky offset pins the list while the links below scroll over it */}
        {toc.length !== 0 && <TocSection items={toc} className="static" />}
        {links.length !== 0 && <ReferenceLinks links={links} className="pl-5" />}
      </div>
    </div>
  )
}
