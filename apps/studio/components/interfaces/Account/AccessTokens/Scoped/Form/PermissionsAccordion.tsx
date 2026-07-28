import { HelpCircle } from 'lucide-react'
import { useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import {
  countConfiguredInCategory,
  PERMISSION_CATALOG_BY_CATEGORY,
  type PermissionMode,
  type PermissionSelection,
} from '../../AccessToken.permissions'
import { PermissionRow } from './PermissionRow'

interface PermissionsAccordionProps {
  selection: PermissionSelection
  onChange: (key: string, mode: PermissionMode) => void
}

export const PermissionsAccordion = ({ selection, onChange }: PermissionsAccordionProps) => {
  const [openCategories, setOpenCategories] = useState<string[]>([
    PERMISSION_CATALOG_BY_CATEGORY[0]?.key,
  ])

  return (
    <div className="space-y-3 px-5 sm:px-6 py-6">
      <div>
        <h3 className="text-sm text-foreground">Permissions</h3>
        <p className="text-xs text-foreground-light">
          Grant the minimum access this token needs. Everything defaults to None.
        </p>
      </div>

      <Accordion
        type="multiple"
        value={openCategories}
        onValueChange={setOpenCategories}
        className="space-y-2"
      >
        {PERMISSION_CATALOG_BY_CATEGORY.map((category) => {
          const configuredCount = countConfiguredInCategory(selection, category.key)
          return (
            <AccordionItem
              key={category.key}
              value={category.key}
              className="rounded-md border bg-surface-100 overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex flex-1 items-center justify-between gap-2 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-foreground">{category.name}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={0} className="text-foreground-lighter">
                          <HelpCircle size={13} />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="w-64">
                        {category.description}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {configuredCount > 0 && (
                    <Badge variant="success">{configuredCount} configured</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-background px-4">
                <div className="divide-y">
                  {category.entries.map((entry) => (
                    <PermissionRow
                      key={entry.key}
                      entry={entry}
                      mode={selection[entry.key] ?? 'none'}
                      onChange={(mode) => onChange(entry.key, mode)}
                    />
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
