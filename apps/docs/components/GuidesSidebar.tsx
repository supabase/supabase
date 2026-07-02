'use client'

import { Feedback } from '~/components/Feedback'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import { isFeatureEnabled } from 'common'
import { Chatgpt, Claude } from 'icons'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
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

function AiTools({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false)
  const path = usePathname()
  const sendTelemetryEvent = useSendTelemetryEvent()

  async function copyMarkdown() {
    const mdUrl = `/docs/${path}.md`

    try {
      const res = await fetch(mdUrl)
      let text: string

      if (res.ok) {
        text = await res.text()
      } else {
        // Default to HTML content within the article when no .md file is available.
        text = document.getElementById('sb-docs-guide-main-article')?.innerHTML ?? ''
      }

      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy markdown', error)
    }

    sendTelemetryEvent({
      action: 'copy_as_markdown_clicked',
    })
  }

  return (
    <section className={cn(className)} aria-labelledby="ask-ai-title">
      <h3
        id="ask-ai-title"
        className="block font-mono uppercase text-xs text-foreground-light mb-3"
      >
        AI Tools
      </h3>
      <div className="flex flex-col gap-2">
        <button
          onClick={copyMarkdown}
          className="flex items-center gap-1.5 text-xs text-foreground-lighter hover:text-foreground text-left transition-colors"
        >
          {copied ? (
            <Check size={14} strokeWidth={1.5} className="text-brand" />
          ) : (
            <Copy size={14} strokeWidth={1.5} />
          )}
          {copied ? 'Copied!' : 'Copy as Markdown'}
        </button>
        <a
          href={`https://chatgpt.com/?hint=search&q=Read from https://supabase.com/docs${path} so I can ask questions about its contents`}
          target="_blank"
          onClick={() =>
            sendTelemetryEvent({ action: 'ask_ai_clicked', properties: { agent: 'chatgpt' } })
          }
          rel="noreferrer noopener"
          className="flex items-center gap-1.5 text-xs text-foreground-lighter hover:text-foreground transition-colors"
        >
          <Chatgpt size={14} />
          Ask ChatGPT
        </a>
        <a
          href={`https://claude.ai/new?q=Read from https://supabase.com/docs${path} so I can ask questions about its contents`}
          target="_blank"
          onClick={() =>
            sendTelemetryEvent({ action: 'ask_ai_clicked', properties: { agent: 'claude' } })
          }
          rel="noreferrer noopener"
          className="flex items-center gap-1.5 text-xs text-foreground-lighter hover:text-foreground transition-colors"
        >
          <Claude size={14} />
          Ask Claude
        </a>
      </div>
    </section>
  )
}

const GuidesSidebar = ({
  className,
  video,
  hideToc,
}: {
  className?: string
  video?: string
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
            <ExpandableVideo imgUrl={tocVideoPreview} videoId={video} />
          </div>
        )}
        {showFeedback && (
          <div className="pl-5">
            <Feedback key={pathname} />
          </div>
        )}
        <div className="pl-5">
          <AiTools key={pathname} />
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
      </div>
    </div>
  )
}

export default GuidesSidebar
export { GuidesSidebar }
export type { TOCHeader }
