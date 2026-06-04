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
        type="default"
        className="rounded-r-none border-r-0"
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
            type="default"
            className="rounded-l-none px-1"
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
