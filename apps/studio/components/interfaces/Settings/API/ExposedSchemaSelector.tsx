import { Check, ChevronsUpDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Button,
  cn,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { useSchemasQuery } from '@/data/database/schemas-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { INTERNAL_SCHEMAS } from '@/hooks/useProtectedSchemas'
import { pluralize } from '@/lib/helpers'

/**
 * [Joshen] This would only affect graphql_public and pgmq_public, given that they're intended
 * to be public, we can let users expose them via the API, but not let them adjust the schema via the dashboard
 * */
export const internalSchemasCannotExpose = new Set(
  INTERNAL_SCHEMAS.filter((x) => !x.endsWith('_public'))
)

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
        .filter((s) => !internalSchemasCannotExpose.has(s.name))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allSchemas]
  )

  const missingExposedSchema = useMemo(
    () => selectedSchemas.filter((schema) => !schemas.some((s) => s.name === schema)),
    [schemas, selectedSchemas]
  )

  const selectedSet = useMemo(() => new Set(selectedSchemas), [selectedSchemas])
  const selectedCount = schemas.filter((s) => selectedSet.has(s.name)).length

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          size="small"
          disabled={disabled}
          variant="default"
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
      </PopoverTrigger>
      <PopoverContent
        className="p-0 min-w-[200px] pointer-events-auto"
        side="bottom"
        align="start"
        sameWidthAsTrigger
      >
        <Command>
          <CommandInput className="text-xs" placeholder="Find schema..." />
          <CommandList>
            <CommandGroup>
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
                  <CommandEmpty>
                    <p className="text-xs text-center text-foreground-lighter py-3">
                      No schemas found
                    </p>
                  </CommandEmpty>
                  <ScrollArea className={schemas.length > 7 ? 'h-[210px]' : ''}>
                    {missingExposedSchema.map((schema) => (
                      <CommandItem
                        key={schema}
                        value={schema}
                        className="cursor-pointer w-full"
                        onSelect={() => {
                          onToggleSchema(schema)
                        }}
                      >
                        <div className="w-full flex flex-col">
                          <div className="w-full flex items-center gap-x-2">
                            <Check size={16} className="text-brand shrink-0" />
                            <span className="truncate">{schema}</span>
                          </div>
                          {internalSchemasCannotExpose.has(schema) ? (
                            <span className="pl-6 text-warning text-xs tracking-tight">
                              This schema is protected and should not be exposed
                            </span>
                          ) : (
                            <span className="pl-6 text-foreground-lighter text-xs tracking-tight">
                              This schema does not exist and can be safely removed
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                    {schemas.map((schema) => {
                      const isExposed = selectedSet.has(schema.name)

                      return (
                        <CommandItem
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
                        </CommandItem>
                      )
                    })}
                  </ScrollArea>
                </>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
