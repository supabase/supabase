'use client'

import { usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { CodeBlock, type CodeBlockProps } from 'ui-patterns/CodeBlock'

import { useDocsAiSidebarOptional } from '~/features/ai-sidebar'

function DocsCodeBlock(props: CodeBlockProps) {
  const sidebar = useDocsAiSidebarOptional()
  const pathname = usePathname()

  const onExplainWithAi = useCallback(
    ({ content, language }: { content: string; language: string }) => {
      if (!sidebar) return

      const trimmed = content.trim()
      const lineCount = trimmed ? trimmed.split('\n').length : 0
      const pagePath = pathname ?? ''

      sidebar.openWithContext({
        language,
        content: trimmed,
        lineCount,
        pageUrl: `https://supabase.com/docs${pagePath}`,
        pagePath,
      })
    },
    [pathname, sidebar]
  )

  return (
    <CodeBlock
      {...props}
      onExplainWithAi={sidebar ? onExplainWithAi : undefined}
    />
  )
}

export { DocsCodeBlock }
