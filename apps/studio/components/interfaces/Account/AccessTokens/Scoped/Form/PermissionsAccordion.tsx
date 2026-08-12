import { useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, cn } from 'ui'

import {
  countConfiguredInCategory,
  PERMISSION_CATALOG_BY_CATEGORY,
  type PermissionMode,
  type PermissionSelection,
} from '../../AccessToken.permissions'
import type { TokenAccessEvaluation } from '../../AccessToken.roles'
import { PermissionRow } from './PermissionRow'
import { InlineLink } from '@/components/ui/InlineLink'
import { PermissionScopeMap } from '@/data/scoped-access-tokens/permission-scope-map-query'
import { DOCS_URL } from '@/lib/constants'

interface PermissionsAccordionProps {
  selection: PermissionSelection
  onChange: (key: string, mode: PermissionMode) => void
  permissionScopeMap: PermissionScopeMap | undefined
  access?: TokenAccessEvaluation
}

export const PermissionsAccordion = ({
  selection,
  onChange,
  permissionScopeMap,
  access,
}: PermissionsAccordionProps) => {
  const [openCategories, setOpenCategories] = useState<string[]>([])

  return (
    <div className="space-y-3 px-5 sm:px-6 py-6">
      <div>
        <h3 className="text-sm text-foreground">Permissions</h3>
        <p className="text-foreground-lighter text-sm">
          Grant the minimum access this token needs. Everything defaults to None. Permissions follow
          your role in the organizations and projects you're a member of — see{' '}
          <InlineLink href={`${DOCS_URL}/guides/platform/access-control`}>
            access control
          </InlineLink>{' '}
          for how roles work.
        </p>
      </div>

      <Accordion
        type="multiple"
        value={openCategories}
        onValueChange={setOpenCategories}
        className="mt-2 flex flex-col -space-y-px"
      >
        {PERMISSION_CATALOG_BY_CATEGORY.map((category, index) => {
          const configuredCount = countConfiguredInCategory(selection, category.key)
          return (
            <AccordionItem
              key={category.key}
              value={category.key}
              className={cn(
                'relative border hover:border-control-hover hover:z-1',
                'data-[state=open]:z-1 data-[state=open]:border-control-hover',
                {
                  'rounded-t-md': index === 0,
                  'rounded-b-md': index === PERMISSION_CATALOG_BY_CATEGORY.length - 1,
                }
              )}
            >
              <AccordionTrigger className="bg-control-raised first:rounded-t last:rounded-b px-4 py-3 hover:no-underline transition">
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
                        permissionScopeMap={permissionScopeMap}
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
