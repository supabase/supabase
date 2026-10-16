'use client'

import { AiTools } from '~/components/AiTools'
import { Feedback } from '~/components/Feedback'
import { isFeatureEnabled } from 'common'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { cn } from 'ui'
import { ExpandableVideo } from 'ui-patterns/ExpandableVideo'
import { Toc, TOCItems, TOCScrollArea } from 'ui-patterns/Toc'

import { useTocAnchors } from '../features/docs/GuidesMdx.state'

interface PreferredSourceQueue {
  push: (callback: (preferredSource: { init: () => void }) => void) => void
}

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
  const preferredSourceRef = useRef<HTMLDivElement>(null)

  // Google's script only renders buttons that exist when it loads, and this sidebar can be
  // re-created after load, which wipes the rendered button. Create the buttons on mount and
  // call init for them. React doesn't manage the children of this container, so they persist.
  useEffect(() => {
    const container = preferredSourceRef.current
    if (!container) return

    const light = document.createElement('div')
    light.setAttribute('google-add-preferred-source-btn', '')
    light.dataset.theme = 'light'
    light.className = 'dark:hidden'

    const dark = document.createElement('div')
    dark.setAttribute('google-add-preferred-source-btn', '')
    dark.dataset.theme = 'dark'
    dark.className = 'hidden dark:block'

    container.replaceChildren(light, dark)

    const win = window as Window & { PREFERRED_SOURCE?: PreferredSourceQueue | unknown[] }
    const queue = (win.PREFERRED_SOURCE = win.PREFERRED_SOURCE || []) as PreferredSourceQueue
    queue.push((preferredSource) => preferredSource.init())
  }, [])

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
        <div ref={preferredSourceRef} className="pl-5" />
      </div>
    </div>
  )
}

export default GuidesSidebar
export { GuidesSidebar }
export type { TOCHeader }
