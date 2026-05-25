'use client'

import { Check, Copy, Terminal } from 'lucide-react'
import { useState } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'
import { Button_Shadcn_, cn, Popover, PopoverContent, PopoverTrigger } from 'ui'

interface TemplateCliPopoverProps {
  command: string
  description: string
  className?: string
  matchSearchInput?: boolean
  variant?: 'default' | 'search' | 'split'
}

export function TemplateCliPopover({
  command,
  description,
  className,
  matchSearchInput = false,
  variant = 'default',
}: TemplateCliPopoverProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

  const resolvedVariant = variant === 'default' && matchSearchInput ? 'search' : variant

  const trigger =
    resolvedVariant === 'search' ? (
      <Button_Shadcn_
        type="button"
        variant="outline"
        size="sm"
        aria-label="Show CLI command"
        className={cn('size-8 shrink-0 p-0', className)}
        onClick={(event) => event.stopPropagation()}
      >
        <Terminal className="h-3.5 w-3.5" />
      </Button_Shadcn_>
    ) : resolvedVariant === 'split' ? (
      <button
        type="button"
        aria-label="Show CLI command"
        className={cn(
          'flex h-8 min-h-8 w-full flex-1 items-center justify-center text-foreground-light hover:bg-surface-200',
          className
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <Terminal className="h-3.5 w-3.5" />
      </button>
    ) : (
      <button
        type="button"
        aria-label="Show CLI command"
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-control text-foreground-light hover:bg-surface-200',
          className
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <Terminal className="h-3.5 w-3.5" />
      </button>
    )

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-96 overflow-hidden p-0"
        side="bottom"
        align="start"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="px-3 pt-3 pb-3 text-xs leading-relaxed text-foreground-light">
          {description}
        </p>
        <div className="flex items-center gap-2 rounded-none border-t bg-background/25 py-2">
          <code className="min-w-0 flex-1 truncate pl-3 font-mono text-xs text-foreground">
            {command}
          </code>
          <CopyToClipboard text={command}>
            <button
              type="button"
              aria-label="Copy command"
              className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded text-foreground-light hover:bg-surface-200"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-brand" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </CopyToClipboard>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export const templateSearchCliDescription =
  'Agents can use this command to search available templates and find the right building blocks before composing a project.'

export const templateAddCliDescription =
  'Agents can use this command to add or remix this template into a Supabase project from the CLI.'

export function getTemplateSearchCommand(search: string): string {
  const query = search.trim()
  return query ? `supabase templates search ${query}` : 'supabase templates search'
}

export function getTemplateAddCommand(templateId: string): string {
  return `supabase templates add ${templateId}`
}
