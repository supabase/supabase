import { useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, cn } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

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
import { InlineLink } from '@/components/ui/InlineLink'
import { DOCS_URL } from '@/lib/constants'

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
    <div className="space-y-3 px-5 sm:px-6 py-6">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm text-foreground">Permissions</h3>
            <p className="text-foreground-lighter text-sm">
              Grant the minimum access this token needs. Everything defaults to None. Permissions
              follow your role in the organizations and projects you're a member of — see{' '}
              <InlineLink href={`${DOCS_URL}/guides/platform/access-control`}>
                access control
              </InlineLink>{' '}
              for how roles work.
            </p>
          </div>
          <div className="shrink-0">
            <PermissionPresetSelect selection={selection} onApplyPreset={onApplyPreset} />
          </div>
        </div>
        {riskyPreset !== undefined && (
          <Admonition
            type="warning"
            className="mb-0"
            title={riskyPreset.label}
            description={riskyPreset.description}
          />
        )}
      </div>

      <Accordion
        type="multiple"
        value={openCategories}
        onValueChange={setOpenCategories}
        className="mt-2"
      >
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
    </div>
  )
}
