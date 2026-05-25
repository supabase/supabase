'use client'

import { Check, Minus, Plus, Search } from 'lucide-react'
import { Card, CardContent, cn, Input, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import type { DependencyResolution } from '../lib/composer'
import { groupTemplatesByCategory, sortCategories, type Template } from '../lib/templates'

interface TemplateBrowserProps {
  templates: Template[]
  selectedIds: Set<string>
  resolution: DependencyResolution
  search: string
  onSearchChange: (search: string) => void
  onAddTemplate: (id: string) => void
  onRemoveTemplate: (id: string) => void
  onHoverTemplate: (id: string | null) => void
}

export function TemplateBrowser({
  templates,
  selectedIds,
  resolution,
  search,
  onSearchChange,
  onAddTemplate,
  onRemoveTemplate,
  onHoverTemplate,
}: TemplateBrowserProps) {
  const templatesByCategory = groupTemplatesByCategory(filterTemplates(templates, search))
  const categories = sortCategories(Object.keys(templatesByCategory))
  const resolvedIds = new Set(resolution.resolved.map((template) => template.id))

  return (
    <section className="flex h-full flex-col overflow-hidden border-r bg-muted/10">
      <div className="shrink-0 px-5 pb-0 pt-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search the market..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4">
        {categories.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-foreground-light">
            No templates match your search.
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="heading-meta mb-2">{category}</h3>
                <Card className="overflow-hidden rounded-lg border bg-transparent shadow-none">
                  {templatesByCategory[category].map((template) => {
                    const isSelected = selectedIds.has(template.id)
                    const isAutoIncluded = !isSelected && resolvedIds.has(template.id)

                    return (
                      <TemplateItem
                        key={template.id}
                        template={template}
                        isSelected={isSelected}
                        isAutoIncluded={isAutoIncluded}
                        onAdd={() => onAddTemplate(template.id)}
                        onRemove={() => onRemoveTemplate(template.id)}
                        onHoverChange={(isHovered) =>
                          onHoverTemplate(isHovered ? template.id : null)
                        }
                        selectedIds={selectedIds}
                        templates={templates}
                      />
                    )
                  })}
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function TemplateItem({
  template,
  templates,
  selectedIds,
  isSelected,
  isAutoIncluded,
  onAdd,
  onRemove,
  onHoverChange,
}: {
  template: Template
  templates: Template[]
  selectedIds: Set<string>
  isSelected: boolean
  isAutoIncluded: boolean
  onAdd: () => void
  onRemove: () => void
  onHoverChange: (isHovered: boolean) => void
}) {
  const requiredDependencyNames = template.dependencies?.required?.map((id) => {
    return templates.find((candidate) => candidate.id === id)?.name ?? id
  })
  const isAdded = isSelected || isAutoIncluded
  const dependencyTooltip = isAutoIncluded
    ? getDependencyTooltip(template.id, selectedIds, templates)
    : undefined

  function handleContentClick() {
    if (!isAdded) onAdd()
  }

  return (
    <CardContent
      className={cn(
        'group border-b px-3 py-3 last:border-b-0',
        isAdded ? 'bg-muted' : 'bg-muted/50'
      )}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            onFocus={() => onHoverChange(true)}
            onBlur={() => onHoverChange(false)}
            onClick={handleContentClick}
          >
            <span className="line-clamp-1 text-sm font-medium text-foreground">
              {template.name}
            </span>
          </button>
          <div className="flex shrink-0 items-center gap-2">
            {requiredDependencyNames && requiredDependencyNames.length > 0 ? (
              <p className="max-w-32 truncate text-xs text-foreground-lighter">
                Requires {requiredDependencyNames.join(', ')}
              </p>
            ) : null}
            <TemplateItemAction
              isAdded={isAdded}
              isAutoIncluded={isAutoIncluded}
              dependencyTooltip={dependencyTooltip}
              onAdd={onAdd}
              onRemove={onRemove}
            />
          </div>
        </div>
        <button
          type="button"
          className="w-full text-left"
          onFocus={() => onHoverChange(true)}
          onBlur={() => onHoverChange(false)}
          onClick={handleContentClick}
        >
          <p className="line-clamp-3 text-xs leading-relaxed text-foreground-light">
            {template.description}
          </p>
        </button>
      </div>
    </CardContent>
  )
}

function TemplateItemAction({
  isAdded,
  isAutoIncluded,
  dependencyTooltip,
  onAdd,
  onRemove,
}: {
  isAdded: boolean
  isAutoIncluded: boolean
  dependencyTooltip?: string
  onAdd: () => void
  onRemove: () => void
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

  if (isAutoIncluded && dependencyTooltip) {
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
      <button
        type="button"
        aria-label="Remove template"
        className="absolute hidden h-7 w-7 items-center justify-center rounded-full border border-control text-foreground-light group-hover:flex hover:bg-surface-200"
        onClick={onRemove}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
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

function filterTemplates(templates: Template[], search: string): Template[] {
  const normalizedSearch = search.trim().toLowerCase()

  if (!normalizedSearch) return templates

  return templates.filter((template) => {
    return (
      template.name.toLowerCase().includes(normalizedSearch) ||
      template.description.toLowerCase().includes(normalizedSearch) ||
      template.id.toLowerCase().includes(normalizedSearch) ||
      template.tags?.some((tag) => tag.toLowerCase().includes(normalizedSearch))
    )
  })
}
