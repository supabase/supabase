'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { cn } from 'ui'
import { ExpandableVideo } from 'ui-patterns/ExpandableVideo'
import { proxy, useSnapshot } from 'valtio'
import { highlightSelectedTocItem } from 'ui/src/components/CustomHTMLElements/CustomHTMLElements.utils'
import { Feedback } from '~/components/Feedback'
import useHash from '~/hooks/useHash'
import { Toc, TOCItems, TOCScrollArea } from 'components/Toc/toc.component'
import InsetTOCItems from '~/components/Toc/toc-inset'
import { Text } from 'lucide-react'
import { useTocAnchors } from '../features/docs/GuidesMdx.client'
import { TocThumb } from './Toc/toc-thumb'

const formatSlug = (slug: string) => {
  // [Joshen] We will still provide support for headers declared like this:
  //    ## REST API {#rest-api-overview}
  // At least for now, this was a docusaurus thing.
  if (slug.includes('#')) return slug.split('#')[1]
  return slug
}

function formatTOCHeader(content: string) {
  let insideInlineCode = false
  const res: Array<{ type: 'text'; value: string } | { type: 'code'; value: string }> = []

  for (const x of content) {
    if (x === '`') {
      if (!insideInlineCode) {
        insideInlineCode = true
        res.push({ type: 'code', value: '' })
      } else {
        insideInlineCode = false
      }
    } else {
      if (insideInlineCode) {
        res[res.length - 1].value += x
      } else {
        if (res.length === 0 || res[res.length - 1].type === 'code') {
          res.push({ type: 'text', value: x })
        } else {
          res[res.length - 1].value += x
        }
      }
    }
  }

  return res
}

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
  const [hash] = useHash()
  const { toc } = useTocAnchors()

  console.log('toc', toc)

  useEffect(() => {
    if (hash && toc?.length > 0) {
      highlightSelectedTocItem(hash)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash, JSON.stringify(toc)])

  const tocVideoPreview = `https://img.youtube.com/vi/${video}/0.jpg`

  return (
    <div
      className={cn(
        'border-l flex flex-col gap-6 lg:gap-8',
        'thin-scrollbar overflow-y-auto',
        'px-2',
        className
      )}
    >
      {video && (
        <div className="relative pl-5">
          <ExpandableVideo imgUrl={tocVideoPreview} videoId={video} />
        </div>
      )}
      <div className="pl-5">
        <Feedback key={pathname} />
      </div>
      <Toc>
        <h3 className="inline-flex items-center gap-1.5 text-sm text-foreground-lighter">
          <Text className="size-4" />
          On this page
        </h3>
        <TOCScrollArea>
          {false ? <InsetTOCItems items={toc} /> : <TOCItems items={toc} />}
        </TOCScrollArea>
      </Toc>
    </div>
  )
}

export default GuidesTableOfContents
export { useTocRerenderTrigger }
export type { TOCHeader }
