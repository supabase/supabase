'use client'

import { AiTools } from '~/components/AiTools'
import { Feedback } from '~/components/Feedback'
import { isFeatureEnabled } from 'common'
import { usePathname } from 'next/navigation'
import { cn, ScrollBar, ScrollRoot, ScrollViewport } from 'ui'
import { ExpandableVideo } from 'ui-patterns/ExpandableVideo'
import { TocSection } from 'ui-patterns/Toc'

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
    <div className={cn('h-fit flex-col', 'px-px', className)}>
      <div className="w-full relative border-l flex flex-col gap-6 lg:gap-8 px-2 h-fit min-h-0">
        {video && (
          <div className="relative pl-5">
            <ExpandableVideo imgUrl={tocVideoPreview} videoId={video} videoTitle={videoTitle} />
          </div>
        )}
        <ScrollRoot className="-mt-6 flex min-h-0 flex-col overflow-hidden pe-2">
          <ScrollViewport className="min-h-0 scroll-fade-top">
            <div className="flex flex-col gap-6 pt-6 lg:gap-8">
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
            </div>
          </ScrollViewport>
          <ScrollBar />
        </ScrollRoot>
      </div>
    </div>
  )
}

export default GuidesSidebar
export { GuidesSidebar }
export type { TOCHeader }
