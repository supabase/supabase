'use client'

import { useCopyMarkdownFromUrl } from 'common'
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
  const mdAbs = `${SITE_ORIGIN}${markdownPath}`
  const aiPrompt = `Read from ${mdAbs} so I can ask questions about its contents`

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
        onClick={() => void copyMarkdown(markdownPath)}
      >
        {copied ? 'Copied as Markdown' : 'Copy as Markdown'}
      </Button>

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
              href={`https://chatgpt.com/?hint=search&q=${encodeURIComponent(aiPrompt)}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              <Chatgpt className="h-4 w-4 shrink-0" />
              Ask ChatGPT
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="gap-2">
            <a
              href={`https://claude.ai/new?q=${encodeURIComponent(aiPrompt)}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              <Claude className="h-4 w-4 shrink-0" />
              Ask Claude
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
