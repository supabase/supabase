import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { useState } from 'react'

import { useSchemasQuery } from 'data/database/schemas-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  Command_Shadcn_,
  PopoverContent,
  PopoverTrigger,
  Popover,
  ScrollArea,
  Skeleton,
} from 'ui'

interface SchemaSelectorProps {
  className?: string
  disabled?: boolean
  size?: 'tiny' | 'small'
  showError?: boolean
  selectedSchemaName: string
  supportSelectAll?: boolean
  excludedSchemas?: string[]
  onSelectSchema: (name: string) => void
  onSelectCreateSchema?: () => void
  portal?: boolean
  align?: 'start' | 'end'
}

export const SchemaSelector = ({
  className,
  disabled = false,
  size = 'tiny',
  showError = true,
  selectedSchemaName,
  supportSelectAll = false,
  excludedSchemas = [],
  onSelectSchema,
  onSelectCreateSchema,
  portal = true,
  align = 'start',
}: SchemaSelectorProps) => {
  const [open, setOpen] = useState(false)
  const { can: canCreateSchemas } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'schemas'
  )

  const { data: project } = useSelectedProjectQuery()
  const {
    data,
    isPending: isSchemasLoading,
    isSuccess: isSchemasSuccess,
    isError: isSchemasError,
    error: schemasError,
    refetch: refetchSchemas,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const schemas = (data || [])
    .filter((schema) => !excludedSchemas.includes(schema.name))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className={className}>
      {isSchemasLoading && (
        <Button
          type="default"
          key="schema-selector-skeleton"
          className="w-full [&>span]:w-full"
          size={size}
          disabled
        >
          <Skeleton className="w-full h-3 bg-foreground-muted" />
        </Button>
      )}

      {showError && isSchemasError && (
        <Alert_Shadcn_ variant="warning" className="!px-3 !py-3">
          <AlertTitle_Shadcn_ className="text-xs text-amber-900">
            Failed to load schemas
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_ className="text-xs mb-2 break-words">
            Error: {(schemasError as any)?.message}
          </AlertDescription_Shadcn_>
          <Button type="default" size="tiny" onClick={() => refetchSchemas()}>
            Reload schemas
          </Button>
        </Alert_Shadcn_>
      )}

      {isSchemasSuccess && (
        <Popover open={open} onOpenChange={setOpen} modal={false}>
          <PopoverTrigger asChild>
            <Button
              size={size}
              disabled={disabled}
              type="default"
              data-testid="schema-selector"
              className={`w-full [&>span]:w-full !pr-1 space-x-1`}
              iconRight={
                <ChevronsUpDown className="text-foreground-muted" strokeWidth={2} size={14} />
              }
            >
              {selectedSchemaName ? (
                <div className="w-full flex gap-1">
                  <p className="text-foreground-lighter">schema</p>
                  <p className="text-foreground">
                    {selectedSchemaName === '*' ? 'All schemas' : selectedSchemaName}
                  </p>
                </div>
              ) : (
                <div className="w-full flex gap-1">
                  <p className="text-foreground-lighter">Choose a schema...</p>
                </div>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-0 min-w-[200px] pointer-events-auto"
            side="bottom"
            align={align}
            portal={portal}
            sameWidthAsTrigger
          >
            <Command_Shadcn_>
              <CommandInput_Shadcn_ placeholder="Find schema..." />
              <CommandList_Shadcn_>
                <CommandEmpty_Shadcn_>No schemas found</CommandEmpty_Shadcn_>
                <CommandGroup_Shadcn_>
                  <ScrollArea className={(schemas || []).length > 7 ? 'h-[210px]' : ''}>
                    {supportSelectAll && (
                      <CommandItem_Shadcn_
                        key="select-all"
                        className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                        onSelect={() => {
                          onSelectSchema('*')
                          setOpen(false)
                        }}
                        onClick={() => {
                          onSelectSchema('*')
                          setOpen(false)
                        }}
                      >
                        <span>All schemas</span>
                        {selectedSchemaName === '*' && (
                          <Check className="text-brand" strokeWidth={2} size={16} />
                        )}
                      </CommandItem_Shadcn_>
                    )}
                    {schemas?.map((schema) => (
                      <CommandItem_Shadcn_
                        key={schema.id}
                        className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                        onSelect={() => {
                          onSelectSchema(schema.name)
                          setOpen(false)
                        }}
                        onClick={() => {
                          onSelectSchema(schema.name)
                          setOpen(false)
                        }}
                      >
                        <span>{schema.name}</span>
                        {selectedSchemaName === schema.name && (
                          <Check className="text-brand" strokeWidth={2} size={16} />
                        )}
                      </CommandItem_Shadcn_>
                    ))}
                  </ScrollArea>
                </CommandGroup_Shadcn_>
                {onSelectCreateSchema !== undefined && canCreateSchemas && (
                  <>
                    <CommandSeparator_Shadcn_ />
                    <CommandGroup_Shadcn_>
                      <CommandItem_Shadcn_
                        className="cursor-pointer flex items-center gap-x-2 w-full"
                        onSelect={() => {
                          onSelectCreateSchema()
                          setOpen(false)
                        }}
                        onClick={() => {
                          onSelectCreateSchema()
                          setOpen(false)
                        }}
                      >
                        <Plus size={12} />
                        Create a new schema
                      </CommandItem_Shadcn_>
                    </CommandGroup_Shadcn_>
                  </>
                )}
              </CommandList_Shadcn_>
            </Command_Shadcn_>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

export default SchemaSelector
