'use client'

import { ArrowLeft, Search } from 'lucide-react'
import { Button_Shadcn_, cn, Input } from 'ui'

import { canRemoveTemplate, type DependencyResolution } from '../../lib/composition/composition'
import { filterTemplates } from '../../lib/composition/template-filter'
import { groupTemplatesByCategory, sortCategories, type Template } from '../../lib/template-catalog'
import {
  getTemplateSearchCommand,
  TemplateCliPopover,
  templateSearchCliDescription,
} from './TemplateCliPopover'
import { TemplateItemHeader } from './TemplateItemHeader'

interface TemplateBrowserProps {
  templates: Template[]
  allTemplates?: Template[]
  selectedIds: Set<string>
  resolution: DependencyResolution
  search: string
  activeDetailTemplateId: string | null
  onSearchChange: (search: string) => void
  onOpenTemplate: (id: string) => void
  onAddTemplate: (id: string) => void
  onRemoveTemplate: (id: string) => void
  onHoverTemplate: (id: string | null) => void
  onBack: () => void
}

export function TemplateBrowser({
  templates,
  allTemplates,
  selectedIds,
  resolution,
  search,
  activeDetailTemplateId,
  onSearchChange,
  onOpenTemplate,
  onAddTemplate,
  onRemoveTemplate,
  onHoverTemplate,
  onBack,
}: TemplateBrowserProps) {
  const dependencyTemplates = allTemplates ?? templates
  const templatesByCategory = groupTemplatesByCategory(filterTemplates(templates, search))
  const categories = sortCategories(Object.keys(templatesByCategory))
  const resolvedIds = new Set(resolution.resolved.map((template) => template.id))

  return (
    <section className="flex h-full flex-col overflow-hidden">
      <div className="relative z-10 shrink-0 bg-background">
        <div className="px-4 pt-4 pb-0">
          <div className="flex items-center gap-2">
            <Button_Shadcn_
              type="button"
              variant="outline"
              size="sm"
              aria-label="Back to configuration"
              className="size-8 shrink-0 p-0"
              onClick={onBack}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button_Shadcn_>
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-light" />
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
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-full z-10 h-10 bg-linear-to-b from-background to-transparent"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-4 pb-4 pt-4">
          {categories.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-foreground-light">
              No templates match your search.
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map((category) => (
                <div key={category}>
                  <p className="text-xs font-mono uppercase tracking-wide text-foreground-light mb-2">
                    {category}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {templatesByCategory[category].map((template) => {
                      const isSelected = selectedIds.has(template.id)
                      const isAutoIncluded = !isSelected && resolvedIds.has(template.id)
                      const isRemovalBlocked =
                        isSelected &&
                        !canRemoveTemplate(template.id, selectedIds, dependencyTemplates)

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
                          templates={dependencyTemplates}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export function TemplateItem({
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
    <div
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-lg border',
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
    </div>
  )
}
