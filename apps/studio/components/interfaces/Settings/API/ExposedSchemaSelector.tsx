import { Check, ChevronsUpDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Button,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { useSchemasQuery } from '@/data/database/schemas-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { INTERNAL_SCHEMAS } from '@/hooks/useProtectedSchemas'
import { pluralize } from '@/lib/helpers'

interface ExposedSchemaSelectorProps {
  disabled?: boolean
  selectedSchemas: string[]
  onToggleSchema: (schema: string) => void
}

export const ExposedSchemaSelector = ({
  disabled = false,
  selectedSchemas,
  onToggleSchema,
}: ExposedSchemaSelectorProps) => {
  const [open, setOpen] = useState(false)

  const { data: project } = useSelectedProjectQuery()

  const {
    data: allSchemas,
    isPending,
    isError,
    isSuccess,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const schemas = useMemo(
    () =>
      (allSchemas ?? [])
        .filter((s) => {
          if (s.name === 'graphql_public') return true
          return !INTERNAL_SCHEMAS.includes(s.name)
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allSchemas]
  )

  const selectedSet = useMemo(() => new Set(selectedSchemas), [selectedSchemas])
  const selectedCount = schemas.filter((s) => selectedSet.has(s.name)).length

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          size="small"
          disabled={disabled}
          type="default"
          className="w-full [&>span]:w-full pr-1! space-x-1"
          iconRight={<ChevronsUpDown className="text-foreground-muted" strokeWidth={2} size={14} />}
        >
          <div className="w-full flex gap-1">
            <p className="text-foreground-lighter">
              {isSuccess
                ? `${selectedCount} of ${schemas.length} ${pluralize(schemas.length, 'schema')} exposed`
                : 'Loading schemas...'}
            </p>
          </div>
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_
        className="p-0 min-w-[200px] pointer-events-auto"
        side="bottom"
        align="start"
        sameWidthAsTrigger
      >
        <Command_Shadcn_>
          <CommandInput_Shadcn_ className="text-xs" placeholder="Find schema..." />
          <CommandList_Shadcn_>
            <CommandGroup_Shadcn_>
              {isPending ? (
                <>
                  <div className="px-2 py-1">
                    <ShimmeringLoader className="py-2" />
                  </div>
                  <div className="px-2 py-1 w-4/5">
                    <ShimmeringLoader className="py-2" />
                  </div>
                </>
              ) : isError ? (
                <div className="flex items-center py-3 justify-center">
                  <p className="text-xs text-foreground-lighter">Failed to retrieve schemas</p>
                </div>
              ) : (
                <>
                  <CommandEmpty_Shadcn_>
                    <p className="text-xs text-center text-foreground-lighter py-3">
                      No schemas found
                    </p>
                  </CommandEmpty_Shadcn_>
                  <ScrollArea className={schemas.length > 7 ? 'h-[210px]' : ''}>
                    {schemas.map((schema) => {
                      const isExposed = selectedSet.has(schema.name)

                      return (
                        <CommandItem_Shadcn_
                          key={schema.id}
                          value={schema.name}
                          className="cursor-pointer w-full"
                          onSelect={() => {
                            onToggleSchema(schema.name)
                          }}
                        >
                          <div
                            className={cn('w-full flex items-center gap-x-2', !isExposed && 'ml-6')}
                          >
                            {isExposed && <Check size={16} className="text-brand shrink-0" />}
                            <span className="truncate">{schema.name}</span>
                          </div>
                        </CommandItem_Shadcn_>
                      )
                    })}
                  </ScrollArea>
                </>
              )}
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
