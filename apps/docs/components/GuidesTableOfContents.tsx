'use client'

import { usePathname } from 'next/navigation'
import { cn } from 'ui'
import { ExpandableVideo } from 'ui-patterns/ExpandableVideo'
import { proxy, useSnapshot } from 'valtio'
import { Feedback } from '~/components/Feedback'
import { Toc, TOCItems, TOCScrollArea } from 'ui-patterns'
import { useTocAnchors } from '../features/docs/GuidesMdx.client'

const tocRenderSwitch = proxy({
  renderFlag: 0,
  toggleRenderFlag: () => void (tocRenderSwitch.renderFlag = (tocRenderSwitch.renderFlag + 1) % 2),
})

const useSubscribeTocRerender = () => {
  const { renderFlag } = useSnapshot(tocRenderSwitch)
  return void renderFlag // Prevent it from being detected as unused code
}

const useTocRerenderTrigger = () => {
  const { toggleRenderFlag } = useSnapshot(tocRenderSwitch)
  return toggleRenderFlag
}

interface TOCHeader {
  id?: string
  text: string
  link: string
  level: number
}

const GuidesTableOfContents = ({ className, video }: { className?: string; video?: string }) => {
  useSubscribeTocRerender()
  const pathname = usePathname()
  const { toc } = useTocAnchors()

  const tocVideoPreview = `https://img.youtube.com/vi/${video}/0.jpg`

  return (
    <div className={cn('thin-scrollbar overflow-y-auto h-fit', 'px-px', className)}>
      <div className={cn('relative border-l flex flex-col gap-6 lg:gap-8 px-2', 'h-fit')}>
        {video && (
          <div className="relative pl-5">
            <ExpandableVideo imgUrl={tocVideoPreview} videoId={video} />
          </div>
        )}
        <div className="pl-5">
          <Feedback key={pathname} />
        </div>
        {toc.length !== 0 && (
          <Toc className="-ml-[calc(0.25rem+6px)]">
            <h3 className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-foreground pl-[calc(1.5rem+6px)]">
              On this page
            </h3>
            <TOCScrollArea>
              <TOCItems items={toc} />
            </TOCScrollArea>
          </Toc>
        )}
      </div>
    </div>
  )
}

export default GuidesTableOfContents
export { useTocRerenderTrigger }
export type { TOCHeader }
