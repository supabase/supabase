'use client'

import { Feedback } from '~/components/Feedback'
import { GuideToc } from '~/components/GuidesSidebar'
import { useDocsLayoutV2 } from '~/features/DocsLayout/useDocsLayoutV2'
import { useTocAnchors } from '~/features/docs/GuidesMdx.state'
import { MdxAnchor } from '~/features/docs/MdxAnchor'
import { RightRailPortal } from '~/layouts/RightRail'
import { isFeatureEnabled } from 'common'
import { usePathname } from 'next/navigation'
import { cn } from 'ui'
import { TocPrimitive, TocSection } from 'ui-patterns/Toc'

export type ReferenceLink = { title: string; href: string }

interface ReferenceSidebarProps {
  className?: string
  links?: ReferenceLink[]
}

interface ReferenceRightRailProps {
  links: ReferenceLink[]
}

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

export const ReferenceSidebar = ({ className, links = [] }: ReferenceSidebarProps) =>
  useDocsLayoutV2() ? (
    <ReferenceRightRail links={links} />
  ) : (
    <LegacyReferenceSidebar className={className} links={links} />
  )

const ReferenceRightRail = ({ links }: ReferenceRightRailProps) => {
  const pathname = usePathname()
  const { toc } = useTocAnchors()
  const activeIndex = Math.max(TocPrimitive.useTopActiveIndex(toc), 0)
  const showFeedback = isFeatureEnabled('feedback:docs')

  return (
    <RightRailPortal>
      <div className="flex min-h-0 flex-1 flex-col gap-8 px-6 pt-6">
        {toc.length !== 0 ? <GuideToc toc={toc} activeUrl={toc[activeIndex]?.url} /> : null}
        {links.length !== 0 ? <ReferenceLinks links={links} className="pb-6" /> : null}
      </div>
      {showFeedback ? (
        <footer className="shrink-0 border-t py-2 pl-6 pr-4">
          <div className="-ml-2.5 flex h-8 items-center">
            <Feedback key={pathname} variant="rail" className="w-full" />
          </div>
        </footer>
      ) : null}
    </RightRailPortal>
  )
}

const LegacyReferenceSidebar = ({
  className,
  links,
}: ReferenceRightRailProps & { className?: string }) => {
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
