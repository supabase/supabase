'use client'

import { CheckboxGroupStackedItem } from 'ui'

import { getDependencyTooltip } from '../lib/composition/dependency-tooltips'
import type { Template } from '../lib/template-catalog'

interface CoreTemplateCheckboxProps {
  template: Template
  templates: Template[]
  selectedIds: Set<string>
  isSelected: boolean
  isAutoIncluded: boolean
  isRemovalBlocked: boolean
  onAdd: () => void
  onRemove: () => void
  onHoverChange: (isHovered: boolean) => void
}

export function CoreTemplateCheckbox({
  template,
  templates,
  selectedIds,
  isSelected,
  isAutoIncluded,
  isRemovalBlocked,
  onAdd,
  onRemove,
  onHoverChange,
}: CoreTemplateCheckboxProps) {
  const checkboxId = `core-template-${template.id}`
  const isAdded = isSelected || isAutoIncluded
  const isDisabled = isAutoIncluded || (isSelected && isRemovalBlocked)
  const dependencyTooltip = isDisabled
    ? getDependencyTooltip(template.id, selectedIds, templates)
    : undefined

  return (
    <CheckboxGroupStackedItem
      id={checkboxId}
      checked={isAdded}
      disabled={isDisabled}
      tooltip={dependencyTooltip}
      onCheckedChange={(checked) => {
        if (checked) onAdd()
        else onRemove()
      }}
      label={template.name}
      description={template.description}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    />
  )
}
