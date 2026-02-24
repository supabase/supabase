import { debounce } from 'lodash'
import { Check, ChevronsUpDown, Loader } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useEntityTypesQuery, type Entity } from 'data/entity-types/entity-types-infinite-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
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
  Skeleton,
} from 'ui'

interface TableSelectorProps {
  className?: string
  disabled?: boolean
  size?: 'tiny' | 'small'
  showError?: boolean
  selectedTableId?: string
  placeholderLabel?: string
  supportSelectAll?: boolean
  excludedSchemas?: string[]
  excludedTableIds?: string[]
  onSelectTable: (id: string) => void
  align?: 'start' | 'end'
}

function getTableId(entity: Entity): string {
  return `${entity.schema}.${entity.name}`
}

export const TableSelector = ({
  className,
  disabled = false,
  size = 'tiny',
  showError = true,
  selectedTableId,
  placeholderLabel = 'Choose a table...',
  supportSelectAll = false,
  excludedSchemas = [],
  excludedTableIds = [],
  onSelectTable,
  align = 'start',
}: TableSelectorProps) => {
  const [open, setOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [initiallyLoaded, setInitiallyLoaded] = useState(false)

  const { data: project } = useSelectedProjectQuery()

  const {
    data: schemasData,
    isPending: isSchemasLoading,
    isSuccess: isSchemasSuccess,
    isError: isSchemasError,
    error: schemasError,
    refetch: refetchSchemas,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const schemaNames = useMemo(
    () =>
      (schemasData || [])
        .filter((schema) => !excludedSchemas.includes(schema.name))
        .map((schema) => schema.name),
    [schemasData, excludedSchemas]
  )

  const {
    data: entitiesData,
    isSuccess: isEntitiesSuccess,
    isError: isEntitiesError,
    error: entitiesError,
    isFetching: isEntitiesFetching,
    refetch: refetchEntities,
  } = useEntityTypesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      schemas: schemaNames,
      search: searchInput || undefined,
    },
    {
      enabled: isSchemasSuccess && schemaNames.length > 0,
    }
  )

  useEffect(() => {
    if (!initiallyLoaded && isEntitiesSuccess) {
      setInitiallyLoaded(true)
    }
  }, [initiallyLoaded, isEntitiesSuccess])

  useEffect(() => {
    if (!open && searchInput !== '') {
      setSearchInput('')
    }
  }, [open, searchInput])

  const debouncedSearch = useMemo(() => debounce(setSearchInput, 300), [])

  const tables = useMemo(() => {
    const entities = entitiesData?.pages[0]?.data?.entities ?? []
    return entities
      .filter((entity) => !excludedTableIds.includes(getTableId(entity)))
      .sort((a, b) => getTableId(a).localeCompare(getTableId(b)))
  }, [entitiesData, excludedTableIds])

  const isPending =
    isSchemasLoading ||
    (isSchemasSuccess && schemaNames.length > 0 && !initiallyLoaded && !isEntitiesError)
  const hasError = isSchemasError || isEntitiesError
  const combinedError = schemasError || entitiesError
  const isReady = initiallyLoaded || (isSchemasSuccess && schemaNames.length === 0)

  return (
    <div className={className}>
      {isPending && (
        <Button
          type="default"
          key="table-selector-skeleton"
          className="w-full [&>span]:w-full"
          size={size}
          disabled
        >
          <Skeleton className="w-full h-3 bg-foreground-muted" />
        </Button>
      )}

      {showError && hasError && !isPending && (
        <Alert_Shadcn_ variant="warning" className="!px-3 !py-3">
          <AlertTitle_Shadcn_ className="text-xs text-amber-900">
            Failed to load tables
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_ className="text-xs mb-2 break-words">
            Error: {(combinedError as any)?.message}
          </AlertDescription_Shadcn_>
          <Button
            type="default"
            size="tiny"
            onClick={() => {
              refetchSchemas()
              refetchEntities()
            }}
          >
            Reload tables
          </Button>
        </Alert_Shadcn_>
      )}

      {isReady && (
        <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
          <PopoverTrigger_Shadcn_ asChild>
            <Button
              size={size}
              disabled={disabled}
              type="default"
              data-testid="table-selector"
              className={`w-full [&>span]:w-full !pr-1 space-x-1`}
              iconRight={
                <ChevronsUpDown className="text-foreground-muted" strokeWidth={2} size={14} />
              }
            >
              {selectedTableId ? (
                <div className="w-full flex gap-1">
                  <p className="text-foreground-lighter">table</p>
                  <p className="text-foreground">
                    {selectedTableId === '*' ? 'All tables' : selectedTableId}
                  </p>
                </div>
              ) : (
                <div className="w-full flex gap-1">
                  <p className="text-foreground-lighter">{placeholderLabel}</p>
                </div>
              )}
            </Button>
          </PopoverTrigger_Shadcn_>
          <PopoverContent_Shadcn_
            className="p-0 min-w-[200px] pointer-events-auto"
            side="bottom"
            align={align}
            sameWidthAsTrigger
          >
            <Command_Shadcn_>
              <CommandInput_Shadcn_
                className="text-xs"
                placeholder="Find table..."
                onValueChange={(str) => debouncedSearch(str)}
              />
              <CommandList_Shadcn_>
                {isEntitiesFetching && (
                  <div className="flex items-center justify-center gap-2 px-3 py-2">
                    <Loader className="animate-spin" size={12} />
                    <p className="text-xs text-foreground-lighter">Loading tables...</p>
                  </div>
                )}
                {!isEntitiesFetching && (
                  <CommandEmpty_Shadcn_>No tables found</CommandEmpty_Shadcn_>
                )}
                <CommandGroup_Shadcn_>
                  <ScrollArea className={(tables || []).length > 7 ? 'h-[210px]' : ''}>
                    {supportSelectAll && (
                      <CommandItem_Shadcn_
                        key="select-all"
                        className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                        onSelect={() => {
                          onSelectTable('*')
                          setOpen(false)
                        }}
                        onClick={() => {
                          onSelectTable('*')
                          setOpen(false)
                        }}
                      >
                        <span>All tables</span>
                        {selectedTableId === '*' && (
                          <Check className="text-brand" strokeWidth={2} size={16} />
                        )}
                      </CommandItem_Shadcn_>
                    )}
                    {tables.map((entity) => {
                      const tableId = getTableId(entity)
                      return (
                        <CommandItem_Shadcn_
                          key={entity.id}
                          className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                          onSelect={() => {
                            onSelectTable(tableId)
                            setOpen(false)
                          }}
                          onClick={() => {
                            onSelectTable(tableId)
                            setOpen(false)
                          }}
                        >
                          <span>{tableId}</span>
                          {selectedTableId === tableId && (
                            <Check className="text-brand" strokeWidth={2} size={16} />
                          )}
                        </CommandItem_Shadcn_>
                      )
                    })}
                  </ScrollArea>
                </CommandGroup_Shadcn_>
              </CommandList_Shadcn_>
            </Command_Shadcn_>
          </PopoverContent_Shadcn_>
        </Popover_Shadcn_>
      )}
    </div>
  )
}
