'use client'

import { useSendTelemetryEvent } from '~/lib/telemetry'
import { usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { AiIconAnimation, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { useDocsAiSidebarOptional } from './DocsAiSidebarContext'
import { findSectionHeadingIdForElement } from './pageSectionQuestions'

interface CodeBlockAiButtonProps {
  content: string
  language?: string
  className?: string
}

function CodeBlockAiButton({ content, language = 'text', className }: CodeBlockAiButtonProps) {
  const sidebar = useDocsAiSidebarOptional()
  const pathname = usePathname()
  const sendTelemetryEvent = useSendTelemetryEvent()

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const trimmed = content.trim()
      const lineCount = trimmed ? trimmed.split('\n').length : 0
      const pagePath = pathname ?? ''
      const pageUrl = `https://supabase.com/docs${pagePath}`
      const sectionHeadingId = findSectionHeadingIdForElement(event.currentTarget)

      if (sidebar) {
        sidebar.openWithContext({
          language,
          content: trimmed,
          lineCount,
          pageUrl,
          pagePath,
          sectionHeadingId,
        })
        return
      }

      sendTelemetryEvent({
        action: 'code_block_ai_clicked',
        properties: {
          language,
          page_path: pagePath,
          line_count: lineCount,
        },
      })
    },
    [content, language, pathname, sendTelemetryEvent, sidebar]
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleClick}
          aria-label="Explain using AI"
          className={cn(
            'border rounded-md p-1',
            'hover:bg-selection transition',
            className
          )}
        >
          <AiIconAnimation size={14} allowHoverEffect />
        </button>
      </TooltipTrigger>
      <TooltipContent>Explain using AI</TooltipContent>
    </Tooltip>
  )
}

export { CodeBlockAiButton }
