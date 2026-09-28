'use client'

import { Feedback } from '~/components/Feedback'
import { HeadingSlotCrumb } from '~/layouts/HeadingSlot'
import { RightRailPortal } from '~/layouts/RightRail'
import { isFeatureEnabled } from 'common'
import { usePathname } from 'next/navigation'
import { cn } from 'ui'
import { ExpandableVideo } from 'ui-patterns/ExpandableVideo'
import { TocPrimitive, TOCScrollArea } from 'ui-patterns/Toc'

import { useTocAnchors } from '../features/docs/GuidesMdx.state'

interface TOCHeader {
  id?: string
  text: string
  link: string
  level: number
}

interface GuidesSidebarProps {
  className?: string
  video?: string
  videoTitle?: string
  hideToc?: boolean
}

type TocItem = ReturnType<typeof useTocAnchors>['toc'][number]

interface TocGroup {
  item: TocItem
  children: TocItem[]
}

interface GuideTocProps {
  toc: TocItem[]
}

interface GuideTocLinkProps {
  item: TocItem
  isActive: boolean
  hasActiveBar?: boolean
  className?: string
}

const groupToc = (toc: TocItem[]) =>
  toc.reduce<TocGroup[]>((groups, item) => {
    const lastGroup = groups.at(-1)
    if (item.depth > 2 && lastGroup) {
      lastGroup.children.push(item)
      return groups
    }
    groups.push({ item, children: [] })
    return groups
  }, [])

const useTopActiveHeading = (toc: TocItem[]) => {
  const anchors = new Set(TocPrimitive.useActiveAnchors())
  const index = Math.max(
    toc.findIndex((item) => anchors.has(item.url.slice(1))),
    0
  )
  return { index, item: toc[index] }
}

const GuidesSidebar = ({ className, video, videoTitle, hideToc }: GuidesSidebarProps) => {
  const pathname = usePathname()
  const { toc } = useTocAnchors()
  const showFeedback = isFeatureEnabled('feedback:docs')
  const tocVideoPreview = `https://img.youtube.com/vi/${video}/0.jpg`

  return (
    <RightRailPortal>
      <div className={cn('flex flex-col gap-8', className)}>
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
  const activeUrl = useTopActiveHeading(toc).item?.url

  return (
    <nav aria-label="On this page">
      <TOCScrollArea>
        <ul className="flex flex-col gap-1">
          {groupToc(toc).map(({ item, children }) => (
            <li key={item.url} className={cn(children.length > 0 && 'pt-2 first:pt-0')}>
              <GuideTocLink
                item={item}
                isActive={item.url === activeUrl}
                className={children.length > 0 ? 'font-medium text-foreground-light' : undefined}
              />
              {children.length > 0 ? (
                <ul className="mt-1 ml-px border-l pl-3">
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
    data-current={isActive}
    aria-current={isActive ? 'location' : undefined}
    className={cn(
      'relative block py-1 text-sm text-foreground-lighter wrap-anywhere',
      'transition-colors duration-150 hover:text-foreground-light',
      'data-[current=true]:text-foreground',
      hasActiveBar &&
        'data-[current=true]:before:absolute data-[current=true]:before:-left-[13px] data-[current=true]:before:top-1/2 data-[current=true]:before:h-[1em] data-[current=true]:before:w-px data-[current=true]:before:-translate-y-1/2 data-[current=true]:before:bg-brand',
      className
    )}
  >
    {item.title}
  </TocPrimitive.TOCItem>
)

const ActiveHeadingCrumb = ({ toc }: GuideTocProps) => {
  const { index, item } = useTopActiveHeading(toc)
  return <HeadingSlotCrumb heading={item} index={index} />
}

export default GuidesSidebar
export { GuidesSidebar }
export type { TOCHeader }
