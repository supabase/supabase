'use client'

import { AiTools } from '~/components/AiTools'
import { Feedback } from '~/components/Feedback/Feedback'
import { FeedbackControl } from '~/components/Feedback/FeedbackControl'
import { useFeedbackDockVariant } from '~/components/Feedback/useFeedbackDockVariant'
import { isFeatureEnabled } from 'common'
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
  const feedbackVariant = useFeedbackDockVariant()
  const tocVideoPreview = `https://img.youtube.com/vi/${video}/0.jpg`

  return (
    <div
      data-feedback-region="rail"
      className={cn('thin-scrollbar overflow-y-auto h-fit flex flex-col', 'px-px', className)}
    >
      <div className="w-full relative border-l flex flex-col gap-6 lg:gap-8 px-2 h-fit min-h-0">
        {video && (
          <div className="relative pl-5">
            <ExpandableVideo imgUrl={tocVideoPreview} videoId={video} videoTitle={videoTitle} />
          </div>
        )}
        {showFeedback && feedbackVariant === 'control' ? (
          <div className="pl-5">
            <Feedback key={pathname} />
          </div>
        ) : null}
        <div className="pl-5">
          <AiTools
            key={pathname}
            pageType="guide"
            articleId="sb-docs-guide-main-article"
            showAgentSetup
            showPreferredSource
          />
        </div>
        {!hideToc && toc.length !== 0 && (
          <TocSection items={toc} className="flex flex-col h-32 basis-[content]" />
        )}
        {feedbackVariant === 'dock' ? <FeedbackControl className="pl-5 shrink-0" /> : null}
      </div>
    </div>
  )
}

export default GuidesSidebar
export { GuidesSidebar }
export type { TOCHeader }
