'use client'

import { usePathname } from 'next/navigation'
import { cn } from 'ui'
import { ExpandableVideo } from 'ui-patterns/ExpandableVideo'
import { Toc, TOCItems, TOCScrollArea } from 'ui-patterns/Toc'
import { Feedback } from '~/components/Feedback'
import { useTocAnchors } from '../features/docs/GuidesMdx.state'

interface TOCHeader {
  id?: string
  text: string
  link: string
  level: number
}

const GuidesTableOfContents = ({ className, video }: { className?: string; video?: string }) => {
  const pathname = usePathname()
  const { toc } = useTocAnchors()

  const tocVideoPreview = `https://img.youtube.com/vi/${video}/0.jpg`

  return (
    <div className={cn('thin-scrollbar overflow-y-auto h-fit', 'px-px', className)}>
      <div className="w-full relative border-l flex flex-col gap-6 lg:gap-8 px-2 h-fit">
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
export type { TOCHeader }
