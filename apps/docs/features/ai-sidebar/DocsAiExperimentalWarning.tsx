'use client'

import { Microscope, X } from 'lucide-react'
import { useCallback } from 'react'
import { Alert, AlertDescription, AlertTitle, cn } from 'ui'

import { dismissAiSidebarWarning } from './docsAiSidebarCookies'

function DocsAiExperimentalWarning({
  className,
  onDismiss,
}: {
  className?: string
  onDismiss: () => void
}) {
  const handleDismiss = useCallback(() => {
    dismissAiSidebarWarning()
    onDismiss()
  }, [onDismiss])

  return (
    <Alert className={cn('relative mt-3 pr-11', className)} variant="warning">
      <Microscope strokeWidth={1.5} size={16} className="text-foreground-muted" />
      <AlertTitle className="text-xs">
        Supabase AI is experimental and may produce incorrect answers.
      </AlertTitle>
      <AlertDescription>
        <p className="text-xs">Always verify the output before executing.</p>
      </AlertDescription>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss experimental AI warning"
        className="absolute right-3 top-3 flex size-[23px] shrink-0 items-center justify-center text-warning-300 transition-colors hover:text-warning-200"
      >
        <X size={14} strokeWidth={1.5} />
      </button>
    </Alert>
  )
}

export { DocsAiExperimentalWarning }
