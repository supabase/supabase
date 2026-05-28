'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn, Toggle } from 'ui'

import { CodeLanguageIcon } from './CodeLanguageIcon'
import { getLanguageLabel } from './languageIcon'
import { useDocsAiSidebar } from './DocsAiSidebarContext'

function CodeContextToggle({ className }: { className?: string }) {
  const { codeContext, isCodeContextEnabled, setCodeContextEnabled } = useDocsAiSidebar()

  if (!codeContext) return null

  const label = getLanguageLabel(codeContext.language, codeContext.lineCount)

  return (
    <Toggle
      pressed={isCodeContextEnabled}
      onPressedChange={setCodeContextEnabled}
      variant="outline"
      size="sm"
      aria-label={
        isCodeContextEnabled
          ? `Disable code context: ${label}`
          : `Enable code context: ${label}`
      }
      aria-expanded={isCodeContextEnabled}
      className={cn(
        'h-auto gap-1.5 rounded-full px-2 py-1 text-xs font-normal normal-case tracking-normal',
        'border-default bg-surface-100 text-foreground-light',
        'data-[state=on]:bg-selection data-[state=on]:border-strong data-[state=on]:text-foreground',
        'data-[state=off]:opacity-70 hover:opacity-100',
        className
      )}
    >
      <CodeLanguageIcon language={codeContext.language} size={14} />
      <span>{label}</span>
      {isCodeContextEnabled ? (
        <ChevronUp size={14} className="shrink-0 text-foreground-muted" aria-hidden />
      ) : (
        <ChevronDown size={14} className="shrink-0 text-foreground-muted" aria-hidden />
      )}
    </Toggle>
  )
}

export { CodeContextToggle }
