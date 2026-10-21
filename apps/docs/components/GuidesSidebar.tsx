'use client'

import { AiTools } from '~/components/AiTools'
import { Feedback } from '~/components/Feedback'
import { isFeatureEnabled } from 'common'
import { ExternalLink } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from 'ui'
import { ExpandableVideo } from 'ui-patterns/ExpandableVideo'
import { TocSection } from 'ui-patterns/Toc'

import { useTocAnchors } from '../features/docs/GuidesMdx.state'

interface TOCHeader {
  id?: string
  text: string
  link: string
  level: number
}

type SidebarLink = { title: string; href: string }

const AdditionalLinks = ({ links, className }: { links: SidebarLink[]; className?: string }) => (
  <div className={className}>
    <h3 className="font-mono text-xs uppercase text-foreground">Additional links</h3>
    <ul className="mt-2 flex flex-col gap-1.5 text-sm">
      {links.map((link) => (
        <li key={link.href}>
          <a
            href={link.href}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-foreground-lighter hover:text-foreground transition-colors"
          >
            {link.title}
            <ExternalLink size={12} strokeWidth={1.5} />
          </a>
        </li>
      ))}
    </ul>
  </div>
)

const GuidesSidebar = ({
  className,
  video,
  videoTitle,
  hideToc,
  links,
}: {
  className?: string
  video?: string
  videoTitle?: string
  hideToc?: boolean
  links?: SidebarLink[]
}) => {
  const pathname = usePathname()
  const { toc } = useTocAnchors()
  const showFeedback = isFeatureEnabled('feedback:docs')
  const tocVideoPreview = `https://img.youtube.com/vi/${video}/0.jpg`

  return (
    <div className={cn('thin-scrollbar overflow-y-auto h-fit', 'px-px', className)}>
      <div className="w-full relative border-l flex flex-col gap-6 lg:gap-8 px-2 h-fit">
        {video && (
          <div className="relative pl-5">
            <ExpandableVideo imgUrl={tocVideoPreview} videoId={video} videoTitle={videoTitle} />
          </div>
        )}
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
        {!hideToc && toc.length !== 0 && <TocSection items={toc} />}
        {links && links.length !== 0 && (
          <div className="pl-5">
            <AdditionalLinks links={links} />
          </div>
        )}
      </div>
    </div>
  )
}

export default GuidesSidebar
export { GuidesSidebar }
export type { TOCHeader }
