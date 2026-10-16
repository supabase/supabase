'use client'

import { AiTools } from '~/components/AiTools'
import { Feedback } from '~/components/Feedback'
import { isFeatureEnabled } from 'common'
import { usePathname } from 'next/navigation'
import { cn } from 'ui'
import { ExpandableVideo } from 'ui-patterns/ExpandableVideo'
import { Toc, TOCItems, TOCScrollArea } from 'ui-patterns/Toc'

import { useTocAnchors } from '../features/docs/GuidesMdx.state'

interface TOCHeader {
  id?: string
  text: string
  link: string
  level: number
}

const GuidesSidebar = ({
  className,
  video,
  videoTitle,
  hideToc,
}: {
  className?: string
  video?: string
  videoTitle?: string
  hideToc?: boolean
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
          />
        </div>
        {!hideToc && toc.length !== 0 && (
          <Toc className="-ml-[calc(0.25rem+6px)]">
            <h3 className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-foreground pl-[calc(1.5rem+6px)]">
              On this page
            </h3>
            <TOCScrollArea>
              <TOCItems items={toc} />
            </TOCScrollArea>
          </Toc>
        )}
        <div className="pl-5">
          <a
            href="https://www.google.com/preferences/source?q=supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-fit"
          >
            <img
              src="/docs/img/icons/google-preferred-source-badge-light@2x.png"
              alt="Add as preferred source on Google"
              width={169}
              className="dark:hidden"
            />
            <img
              src="/docs/img/icons/google-preferred-source-badge-dark@2x.png"
              alt="Add as preferred source on Google"
              width={169}
              className="hidden dark:block"
            />
          </a>
        </div>
      </div>
    </div>
  )
}

export default GuidesSidebar
export { GuidesSidebar }
export type { TOCHeader }
