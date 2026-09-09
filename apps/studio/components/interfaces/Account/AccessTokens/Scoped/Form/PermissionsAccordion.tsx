import { useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, cn } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'

import {
  countConfiguredInCategory,
  PERMISSION_CATALOG_BY_CATEGORY,
  type PermissionMode,
  type PermissionSelection,
} from '../../AccessToken.permissions'
import { getActivePreset, type PermissionPreset } from '../../AccessToken.presets'
import type { TokenAccessEvaluation } from '../../AccessToken.roles'
import { PermissionPresetSelect } from './PermissionPresetSelect'
import { PermissionRow } from './PermissionRow'

interface PermissionsAccordionProps {
  selection: PermissionSelection
  onChange: (key: string, mode: PermissionMode) => void
  onApplyPreset: (preset: PermissionPreset) => void
  access?: TokenAccessEvaluation
}

export const PermissionsAccordion = ({
  selection,
  onChange,
  onApplyPreset,
  access,
}: PermissionsAccordionProps) => {
  const [openCategories, setOpenCategories] = useState<string[]>([])
  const activePreset = getActivePreset(selection)
  // Derived, so editing any row back off the preset clears the warning with it.
  const riskyPreset = activePreset?.isRisky === true ? activePreset : undefined

  return (
    <section className="space-y-4 px-5 sm:px-6 py-6">
      <FormLayout
        layout="flex-row-reverse"
        label="Permissions"
        description={
          <p className="text-foreground-lighter text-sm">
            Grant the minimum access this token needs. Everything defaults to None. Permissions
            follow your role in the organizations and projects you're a member of.
          </p>
        }
      >
        <PermissionPresetSelect selection={selection} onApplyPreset={onApplyPreset} />
      </FormLayout>

      {riskyPreset !== undefined && (
        <Admonition
          type="warning"
          // Groups the warning with the header above it, rather than the list it sits on top of.
          className="mb-4"
          title={riskyPreset.label}
          description={riskyPreset.description}
        />
      )}

      <Accordion type="multiple" value={openCategories} onValueChange={setOpenCategories}>
        {PERMISSION_CATALOG_BY_CATEGORY.map((category, index) => {
          const configuredCount = countConfiguredInCategory(selection, category.key)
          return (
            <AccordionItem
              key={category.key}
              value={category.key}
              className={cn('border', {
                'border-b-0': index < PERMISSION_CATALOG_BY_CATEGORY.length - 1,
                'rounded-t-md': index === 0,
                'rounded-b-md': index === PERMISSION_CATALOG_BY_CATEGORY.length - 1,
              })}
            >
              <AccordionTrigger className="bg-surface-300 first:rounded-t last:rounded-b px-4 py-3 hover:no-underline transition">
                <div className="flex flex-1 items-center justify-between gap-2 pr-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-xs text-foreground-lighter">{category.description}</span>
                  </div>
                  {configuredCount > 0 && (
                    <span className="text-xs text-primary font-medium">
                      {configuredCount} configured
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="*:pb-0">
                <div className="divide-y first:border-t">
                  {category.entries.map((entry) => (
                    <div className="px-4" key={entry.key}>
                      <PermissionRow
                        entry={entry}
                        mode={selection[entry.key] ?? 'none'}
                        onChange={(mode) => onChange(entry.key, mode)}
                        entryAccess={access?.entries[entry.key]}
                      />
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </section>
  )
}
