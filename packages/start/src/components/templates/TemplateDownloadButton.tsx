'use client'

import { Download } from 'lucide-react'
import type { MouseEvent } from 'react'
import { Button_Shadcn_, cn } from 'ui'

import { downloadTemplateZip } from '../../lib/composition/composition'
import type { Template } from '../../lib/template-catalog'

interface TemplateDownloadButtonProps {
  template: Template
  className?: string
  matchSearchInput?: boolean
}

export function TemplateDownloadButton({
  template,
  className,
  matchSearchInput = false,
}: TemplateDownloadButtonProps) {
  const hasFiles = template.files.length > 0

  async function handleDownload(event: MouseEvent) {
    event.stopPropagation()
    await downloadTemplateZip(template)
  }

  if (matchSearchInput) {
    return (
      <Button_Shadcn_
        type="button"
        variant="outline"
        size="sm"
        aria-label="Download template ZIP"
        className={cn('size-8 shrink-0 p-0', className)}
        disabled={!hasFiles}
        onClick={handleDownload}
      >
        <Download className="h-3.5 w-3.5" />
      </Button_Shadcn_>
    )
  }

  return (
    <button
      type="button"
      aria-label="Download template ZIP"
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-control text-foreground-light hover:bg-surface-200 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      disabled={!hasFiles}
      onClick={handleDownload}
    >
      <Download className="h-3.5 w-3.5" />
    </button>
  )
}
