'use client'

import { Check, Minus, Plus } from 'lucide-react'
import type { MouseEvent } from 'react'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { getDependencyTooltip } from '../lib/dependency-tooltips'
import type { Template } from '../lib/templates'
import {
  getTemplateAddCommand,
  templateAddCliDescription,
  TemplateCliPopover,
} from './TemplateCliPopover'

interface TemplateItemHeaderProps {
  template: Template
  templates: Template[]
  selectedIds: Set<string>
  resolvedIds: Set<string>
  onAdd: () => void
  onRemove: () => void
  isRemovalBlocked: boolean
  onOpen?: () => void
  className?: string
  descriptionClassName?: string
}

export function TemplateItemHeader({
  template,
  templates,
  selectedIds,
  resolvedIds,
  onAdd,
  onRemove,
  isRemovalBlocked,
  onOpen,
  className,
  descriptionClassName,
}: TemplateItemHeaderProps) {
  const isSelected = selectedIds.has(template.id)
  const isAutoIncluded = !isSelected && resolvedIds.has(template.id)
  const isAdded = isSelected || isAutoIncluded
  const dependencyTooltip = isAutoIncluded
    ? getDependencyTooltip(template.id, selectedIds, templates)
    : isRemovalBlocked
      ? getDependencyTooltip(template.id, selectedIds, templates)
      : undefined

  const content = (
    <>
      <span className="line-clamp-2 text-sm font-medium text-foreground">{template.name}</span>
      <p
        className={cn(
          'line-clamp-3 text-xs leading-relaxed text-foreground-light',
          descriptionClassName
        )}
      >
        {template.description}
      </p>
    </>
  )

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      {onOpen ? (
        <button
          type="button"
          className="flex flex-1 w-full flex-col items-center gap-1 px-3 py-3 text-center"
          onClick={onOpen}
        >
          {content}
        </button>
      ) : (
        <div className="flex flex-1 flex-col items-center gap-1 px-3 py-3 text-center">
          {content}
        </div>
      )}

      <div className="mt-auto flex shrink-0 border-t">
        <div className="flex min-w-0 flex-1">
          <TemplateCliPopover
            variant="split"
            className="w-full"
            command={getTemplateAddCommand(template.id)}
            description={templateAddCliDescription}
          />
        </div>
        <div aria-hidden className="w-px shrink-0 self-stretch bg-border" />
        <TemplateItemAction
          isAdded={isAdded}
          isAutoIncluded={isAutoIncluded}
          isRemovalBlocked={isRemovalBlocked}
          dependencyTooltip={dependencyTooltip}
          onAdd={(event) => {
            event.stopPropagation()
            onAdd()
          }}
          onRemove={(event) => {
            event.stopPropagation()
            onRemove()
          }}
        />
      </div>
    </div>
  )
}

function TemplateItemAction({
  isAdded,
  isAutoIncluded,
  isRemovalBlocked,
  dependencyTooltip,
  onAdd,
  onRemove,
}: {
  isAdded: boolean
  isAutoIncluded: boolean
  isRemovalBlocked: boolean
  dependencyTooltip?: string
  onAdd: (event: MouseEvent) => void
  onRemove: (event: MouseEvent) => void
}) {
  if (!isAdded) {
    return (
      <button
        type="button"
        aria-label="Add template"
        className="flex h-8 min-h-8 w-full flex-1 items-center justify-center gap-1.5 text-xs text-foreground-light hover:bg-surface-200"
        onClick={onAdd}
      >
        <Plus className="h-3.5 w-3.5" />
        Add
      </button>
    )
  }

  const check = (
    <Check
      aria-hidden
      className={cn(
        'h-3.5 w-3.5',
        isAutoIncluded ? 'text-warning' : 'text-brand group-hover:invisible'
      )}
      strokeWidth={2}
    />
  )

  if ((isAutoIncluded || isRemovalBlocked) && dependencyTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            aria-label="Template added"
            className="flex h-8 min-h-8 w-full flex-1 cursor-default items-center justify-center text-foreground-light"
          >
            {check}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">{dependencyTooltip}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <button
      type="button"
      aria-label="Remove template"
      className="group relative flex h-8 min-h-8 w-full flex-1 items-center justify-center text-foreground-light hover:bg-surface-200"
      onClick={onRemove}
    >
      {check}
      <Minus className="absolute hidden h-3.5 w-3.5 group-hover:block" />
    </button>
  )
}
