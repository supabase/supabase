'use client'

import { Search } from 'lucide-react'
import { Card, CardContent, cn, Input } from 'ui'

import { canRemoveTemplate, type DependencyResolution } from '../lib/composer'
import { groupTemplatesByCategory, sortCategories, type Template } from '../lib/templates'
import {
  getTemplateSearchCommand,
  TemplateCliPopover,
  templateSearchCliDescription,
} from './TemplateCliPopover'
import { TemplateItemHeader } from './TemplateItemHeader'

interface TemplateBrowserProps {
  templates: Template[]
  selectedIds: Set<string>
  resolution: DependencyResolution
  search: string
  activeDetailTemplateId: string | null
  onSearchChange: (search: string) => void
  onOpenTemplate: (id: string) => void
  onAddTemplate: (id: string) => void
  onRemoveTemplate: (id: string) => void
  onHoverTemplate: (id: string | null) => void
}

export function TemplateBrowser({
  templates,
  selectedIds,
  resolution,
  search,
  activeDetailTemplateId,
  onSearchChange,
  onOpenTemplate,
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
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
            <Input
              size="small"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search templates..."
              className="h-8 pl-8 text-xs"
            />
          </div>
          <TemplateCliPopover
            matchSearchInput
            command={getTemplateSearchCommand(search)}
            description={templateSearchCliDescription}
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
                    const isRemovalBlocked =
                      isSelected && !canRemoveTemplate(template.id, selectedIds, templates)

                    return (
                      <TemplateItem
                        key={template.id}
                        template={template}
                        isSelected={isSelected}
                        isActiveDetail={activeDetailTemplateId === template.id}
                        isAutoIncluded={isAutoIncluded}
                        isRemovalBlocked={isRemovalBlocked}
                        resolvedIds={resolvedIds}
                        onOpen={() => onOpenTemplate(template.id)}
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
  resolvedIds,
  isSelected,
  isActiveDetail,
  isAutoIncluded,
  isRemovalBlocked,
  onOpen,
  onAdd,
  onRemove,
  onHoverChange,
}: {
  template: Template
  templates: Template[]
  selectedIds: Set<string>
  resolvedIds: Set<string>
  isSelected: boolean
  isActiveDetail: boolean
  isAutoIncluded: boolean
  isRemovalBlocked: boolean
  onOpen: () => void
  onAdd: () => void
  onRemove: () => void
  onHoverChange: (isHovered: boolean) => void
}) {
  const isAdded = isSelected || isAutoIncluded

  return (
    <CardContent
      className={cn(
        'border-b px-3 py-3 last:border-b-0',
        isAdded ? 'bg-muted' : 'bg-muted/50',
        isActiveDetail && 'ring-1 ring-inset ring-brand'
      )}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      onFocus={() => onHoverChange(true)}
      onBlur={() => onHoverChange(false)}
    >
      <TemplateItemHeader
        template={template}
        templates={templates}
        selectedIds={selectedIds}
        resolvedIds={resolvedIds}
        isRemovalBlocked={isRemovalBlocked}
        onOpen={onOpen}
        onAdd={onAdd}
        onRemove={onRemove}
      />
    </CardContent>
  )
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
