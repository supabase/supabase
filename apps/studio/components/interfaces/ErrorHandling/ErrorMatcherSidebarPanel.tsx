'use client'

import { Wrench } from 'lucide-react'
import { useState } from 'react'
import { Button, Dialog, DialogContent, DialogTitle, cn } from 'ui'
import { WarningIcon } from 'ui-patterns/admonition'
import type { SupportFormParams } from 'ui-patterns/ErrorDisplay'

import { ErrorMatcher } from './ErrorMatcher'

interface ErrorMatcherSidebarPanelProps {
  title: string
  error: string | { message: string }
  supportFormParams?: SupportFormParams
  className?: string
}

export function ErrorMatcherSidebarPanel({
  title,
  error,
  supportFormParams,
  className,
}: ErrorMatcherSidebarPanelProps) {
  const [open, setOpen] = useState(false)
  const message = typeof error === 'string' ? error : error.message

  return (
    <>
      <div
        className={cn(
          'rounded-lg border p-4 space-y-3',
          'bg-warning-200 border-warning-500',
          className
        )}
      >
        <div className="flex items-start gap-2.5">
          <div className="bg-warning p-0.5 text-background rounded flex-shrink-0 mt-0.5">
            <WarningIcon className="w-2.5 h-2.5" />
          </div>
          <h3 className="font-medium text-sm text-foreground leading-snug">{title}</h3>
        </div>

        <pre className="text-xs font-mono text-warning-600 whitespace-pre-wrap break-words line-clamp-3 overflow-hidden">
          {message}
        </pre>

        <Button
          type="warning"
          size="tiny"
          icon={<Wrench size={12} />}
          onClick={() => setOpen(true)}
        >
          Troubleshoot
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="medium">
          {/* Visually hidden — ErrorMatcher renders the visible title inside its card */}
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <ErrorMatcher title={title} error={error} supportFormParams={supportFormParams} />
        </DialogContent>
      </Dialog>
    </>
  )
}
