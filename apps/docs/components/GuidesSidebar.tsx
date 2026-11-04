'use client'

import { Feedback } from '~/components/Feedback'
import { LegacyGuidesSidebar } from '~/components/GuidesSidebar.legacy'
import { useDocsLayoutV2 } from '~/features/DocsLayout/useDocsLayoutV2'
import { HeadingSlotCrumb } from '~/layouts/HeadingSlot'
import { RightRailPortal } from '~/layouts/RightRail'
import { isFeatureEnabled } from 'common'
import { usePathname } from 'next/navigation'
import { cn } from 'ui'
import { ExpandableVideo } from 'ui-patterns/ExpandableVideo'
import { TocPrimitive, TOCScrollArea } from 'ui-patterns/Toc'
import { toTocTree } from 'ui-patterns/Toc/toc'

import { useTocAnchors } from '../features/docs/GuidesMdx.state'

interface TOCHeader {
  id?: string
  text: string
  link: string
  level: number
}

interface GuidesRightRailProps {
  video?: string
  videoTitle?: string
  hideToc?: boolean
}

interface GuidesSidebarProps extends GuidesRightRailProps {
  className?: string
}

type TocItem = ReturnType<typeof useTocAnchors>['toc'][number]

interface GuideTocProps {
  toc: TocItem[]
}

interface GuideTocLinkProps {
  item: TocItem
  isActive: boolean
  hasActiveBar?: boolean
  className?: string
}

const GuidesSidebar = ({ className, ...props }: GuidesSidebarProps) =>
  useDocsLayoutV2() ? (
    <GuidesRightRail {...props} />
  ) : (
    <LegacyGuidesSidebar className={className} {...props} />
  )

const GuidesRightRail = ({ video, videoTitle, hideToc }: GuidesRightRailProps) => {
  const pathname = usePathname()
  const { toc } = useTocAnchors()
  const showFeedback = isFeatureEnabled('feedback:docs')
  const tocVideoPreview = `https://img.youtube.com/vi/${video}/0.jpg`

  return (
    <RightRailPortal>
      <div className="flex flex-col gap-8">
        {video && (
          <ExpandableVideo imgUrl={tocVideoPreview} videoId={video} videoTitle={videoTitle} />
        )}
        {showFeedback && <Feedback key={pathname} />}
        {!hideToc && toc.length !== 0 && <GuideToc toc={toc} />}
      </div>
      <ActiveHeadingCrumb key={pathname} toc={toc} />
    </RightRailPortal>
  )
}

const GuideToc = ({ toc }: GuideTocProps) => {
  const activeUrl = toc[Math.max(TocPrimitive.useTopActiveIndex(toc), 0)]?.url

  return (
    <nav aria-label="On this page">
      <TOCScrollArea>
        <ul className="flex flex-col gap-1">
          {toTocTree(toc).map(({ item, children }) => (
            <li key={item.url} className={cn(children.length > 0 && 'pt-2 first:pt-0')}>
              <GuideTocLink
                item={item}
                isActive={item.url === activeUrl}
                className={children.length > 0 ? 'font-medium text-foreground-light' : undefined}
              />
              {children.length > 0 ? (
                <ul className="docs-rail-sublist">
                  {children.map((child) => (
                    <li key={child.url}>
                      <GuideTocLink item={child} isActive={child.url === activeUrl} hasActiveBar />
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </TOCScrollArea>
    </nav>
  )
}

const GuideTocLink = ({ item, isActive, hasActiveBar = false, className }: GuideTocLinkProps) => (
  <TocPrimitive.TOCItem
    href={item.url}
    aria-current={isActive ? 'location' : undefined}
    className={cn('docs-rail-link', hasActiveBar && 'docs-active-bar', className)}
  >
    {item.title}
  </TocPrimitive.TOCItem>
)

const ActiveHeadingCrumb = ({ toc }: GuideTocProps) => {
  const index = Math.max(TocPrimitive.useTopActiveIndex(toc), 0)
  return <HeadingSlotCrumb heading={toc[index]} index={index} />
}

export default GuidesSidebar
export { GuidesSidebar }
export type { TOCHeader }
