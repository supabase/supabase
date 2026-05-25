'use client'

import { Check, Minus, Plus } from 'lucide-react'
import type { MouseEvent } from 'react'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

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
  const requiredDependencyNames = template.dependencies?.required?.map((id) => {
    return templates.find((candidate) => candidate.id === id)?.name ?? id
  })
  const isSelected = selectedIds.has(template.id)
  const isAutoIncluded = !isSelected && resolvedIds.has(template.id)
  const isAdded = isSelected || isAutoIncluded
  const dependencyTooltip = isAutoIncluded
    ? getDependencyTooltip(template.id, selectedIds, templates)
    : isRemovalBlocked
      ? getDependencyTooltip(template.id, selectedIds, templates)
      : undefined

  const title = (
    <span className="line-clamp-1 text-sm font-medium text-foreground">{template.name}</span>
  )

  const description = (
    <p
      className={cn(
        'line-clamp-3 text-xs leading-relaxed text-foreground-light',
        descriptionClassName
      )}
    >
      {template.description}
    </p>
  )

  return (
    <div className={cn('group flex flex-col gap-0.5', className)}>
      <div className="flex items-center justify-between gap-3">
        {onOpen ? (
          <button type="button" className="min-w-0 flex-1 text-left" onClick={onOpen}>
            {title}
          </button>
        ) : (
          <div className="min-w-0 flex-1">{title}</div>
        )}
        <div className="flex shrink-0 items-center gap-2">
          {requiredDependencyNames && requiredDependencyNames.length > 0 ? (
            <p className="max-w-32 truncate text-xs text-foreground-lighter">
              Requires {requiredDependencyNames.join(', ')}
            </p>
          ) : null}
          <div className="flex items-center gap-0.5">
            <TemplateCliPopover
              command={getTemplateAddCommand(template.id)}
              description={templateAddCliDescription}
            />
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
      </div>
      {onOpen ? (
        <button type="button" className="w-full text-left" onClick={onOpen}>
          {description}
        </button>
      ) : (
        description
      )}
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
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-control text-foreground-light"
        onClick={onAdd}
      >
        <Plus className="h-3.5 w-3.5" />
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
          <span className="flex h-7 w-7 shrink-0 cursor-default items-center justify-center">
            {check}
          </span>
        </TooltipTrigger>
        <TooltipContent side="left">{dependencyTooltip}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className="relative flex h-7 w-7 shrink-0 items-center justify-center">
      {check}
      {!isRemovalBlocked ? (
        <button
          type="button"
          aria-label="Remove template"
          className="absolute hidden h-7 w-7 items-center justify-center rounded-full border border-control text-foreground-light group-hover:flex hover:bg-surface-200"
          onClick={onRemove}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  )
}

function getDependencyTooltip(templateId: string, selectedIds: Set<string>, templates: Template[]) {
  const requiredBy = templates
    .filter(
      (template) =>
        selectedIds.has(template.id) && template.dependencies?.required?.includes(templateId)
    )
    .map((template) => template.name)

  if (requiredBy.length === 0) return 'Included as a dependency'
  if (requiredBy.length === 1) return `Required by ${requiredBy[0]}`
  return `Required by ${requiredBy.join(', ')}`
}
