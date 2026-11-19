'use client'

import { Feedback } from '~/components/Feedback'
import { LegacyGuidesSidebar } from '~/components/GuidesSidebar.legacy'
import { useDocsLayoutV2 } from '~/features/DocsLayout/useDocsLayoutV2'
import { HeadingSlotCrumb } from '~/layouts/HeadingSlot'
import { RightRailPortal } from '~/layouts/RightRail'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import { isFeatureEnabled } from 'common'
import { PREFERRED_SOURCE_URL } from 'common/markdown-affordance'
import { Google } from 'icons'
import { usePathname } from 'next/navigation'
import { cn, IconGitHubSolid } from 'ui'
import { ExpandableVideo } from 'ui-patterns/ExpandableVideo'
import { TocPrimitive, TOCScrollArea } from 'ui-patterns/Toc'
import type { TOCItemType } from 'ui-patterns/Toc/server/get-toc'
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
  editHref?: string
}

interface GuidesSidebarProps extends GuidesRightRailProps {
  className?: string
}

interface GuideTocProps {
  toc: TOCItemType[]
  activeUrl: string | undefined
}

interface GuideTocLinkProps {
  item: TOCItemType
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

const GuidesRightRail = ({ video, videoTitle, hideToc, editHref }: GuidesRightRailProps) => {
  const pathname = usePathname()
  const sendTelemetryEvent = useSendTelemetryEvent()
  const { toc } = useTocAnchors()
  const activeIndex = Math.max(TocPrimitive.useTopActiveIndex(toc), 0)
  const showFeedback = isFeatureEnabled('feedback:docs')
  const tocVideoPreview = `https://img.youtube.com/vi/${video}/0.jpg`

  const handlePreferredSourceClick = () =>
    sendTelemetryEvent({ action: 'preferred_source_clicked', properties: { pageType: 'guide' } })

  return (
    <RightRailPortal>
      <div className="flex min-h-0 flex-1 flex-col gap-8 px-6 pt-6">
        {video ? (
          <ExpandableVideo imgUrl={tocVideoPreview} videoId={video} videoTitle={videoTitle} />
        ) : null}
        {hideToc || toc.length === 0 ? null : (
          <GuideToc toc={toc} activeUrl={toc[activeIndex]?.url} />
        )}
      </div>
      <footer className="shrink-0 border-t py-3 pl-6 pr-4">
        <ul className="flex flex-col">
          {showFeedback ? (
            <li className="-ml-2 flex h-8 items-center">
              <Feedback key={pathname} variant="rail" className="w-full" />
            </li>
          ) : null}
          <li>
            <a
              href={PREFERRED_SOURCE_URL}
              target="_blank"
              rel="noreferrer noopener"
              onClick={handlePreferredSourceClick}
              className="-ml-2 flex h-8 items-center gap-2 rounded-md py-2 pr-2 pl-1.5 text-sm text-foreground-light transition-colors hover:bg-surface-200 hover:text-foreground focus-ring focus-visible:bg-surface-200 focus-visible:text-foreground"
            >
              <Google aria-hidden className="size-4 text-foreground-lighter" />
              Prefer on Google
            </a>
          </li>
          {editHref ? (
            <li>
              <a
                href={editHref}
                target="_blank"
                rel="noreferrer noopener edit"
                className="-ml-2 flex h-8 items-center gap-2 rounded-md py-2 pr-2 pl-1.5 text-sm text-foreground-light transition-colors hover:bg-surface-200 hover:text-foreground focus-ring focus-visible:bg-surface-200 focus-visible:text-foreground"
              >
                <IconGitHubSolid aria-hidden className="size-4 text-foreground-lighter" />
                Edit this page
              </a>
            </li>
          ) : null}
        </ul>
      </footer>
      <HeadingSlotCrumb key={pathname} heading={toc[activeIndex]} index={activeIndex} />
    </RightRailPortal>
  )
}

const GuideToc = ({ toc, activeUrl }: GuideTocProps) => (
  <nav aria-label="On this page" className="flex min-h-0 flex-1 flex-col">
    <TOCScrollArea className="-me-4 pe-4">
      <ul className="flex flex-col gap-1 pb-6">
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

const GuideTocLink = ({ item, isActive, hasActiveBar = false, className }: GuideTocLinkProps) => (
  <TocPrimitive.TOCItem
    href={item.url}
    aria-current={isActive ? 'location' : undefined}
    className={cn('docs-rail-link', hasActiveBar && 'docs-active-bar', className)}
  >
    {item.title}
  </TocPrimitive.TOCItem>
)

export { GuidesSidebar }
export type { TOCHeader }
