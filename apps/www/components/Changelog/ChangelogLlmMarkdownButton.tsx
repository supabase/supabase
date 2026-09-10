'use client'

import { useSendTelemetryEvent } from '~/lib/telemetry'
import { askAiUrls, useCopyMarkdownFromUrl } from 'common'
import { Chatgpt, Claude } from 'icons'
import { Check, ChevronDown, Copy } from 'lucide-react'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import { SITE_ORIGIN } from '@/lib/constants'

type Props = {
  className?: string
  markdownPath?: string
}

export function ChangelogLlmMarkdownButton({ className, markdownPath = '/changelog.md' }: Props) {
  const { copied, copyMarkdown } = useCopyMarkdownFromUrl()
  const sendTelemetryEvent = useSendTelemetryEvent()
  const pagePath = markdownPath.replace(/\.md$/, '')
  const urls = askAiUrls(`${SITE_ORIGIN}${pagePath}`)

  async function handleCopy() {
    const ok = await copyMarkdown(markdownPath)
    if (ok) {
      sendTelemetryEvent({
        action: 'copy_as_markdown_clicked',
        properties: { pageType: 'changelog' },
      })
    }
  }

  return (
    <div className={cn('flex items-center', className)}>
      <Button
        variant="default"
        className="rounded-r-none hover:z-10 focus-visible:z-10 focus-visible:rounded-r-sm"
        icon={
          copied ? (
            <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
          ) : (
            <Copy className="h-4 w-4" strokeWidth={2} aria-hidden />
          )
        }
        onClick={handleCopy}
      >
        {copied ? 'Copied!' : 'Copy as Markdown'}
      </Button>
      <span className="sr-only" role="status">
        {copied ? 'Copied to clipboard' : ''}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            className="shrink-0 rounded-l-none px-[4px] py-[5px] -ml-px focus-visible:z-10 focus-visible:rounded-l-sm"
            icon={<ChevronDown className="h-4 w-4" strokeWidth={2} aria-hidden />}
            aria-label="Open LLM options for this changelog page"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem asChild className="gap-2">
            <a
              href={urls.chatgpt}
              target="_blank"
              rel="noreferrer noopener"
              onClick={() =>
                sendTelemetryEvent({
                  action: 'ask_ai_clicked',
                  properties: { agent: 'chatgpt', pageType: 'changelog' },
                })
              }
            >
              <Chatgpt className="h-4 w-4 shrink-0" aria-hidden />
              Ask ChatGPT
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="gap-2">
            <a
              href={urls.claude}
              target="_blank"
              rel="noreferrer noopener"
              onClick={() =>
                sendTelemetryEvent({
                  action: 'ask_ai_clicked',
                  properties: { agent: 'claude', pageType: 'changelog' },
                })
              }
            >
              <Claude className="h-4 w-4 shrink-0" aria-hidden />
              Ask Claude
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
