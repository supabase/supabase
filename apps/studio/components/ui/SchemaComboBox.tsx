import { Check, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useSchemasQuery } from 'data/database/schemas-query'
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
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
} from 'ui'

interface SchemaComboBoxProps {
  className?: string
  disabled?: boolean
  size?: 'tiny' | 'small'
  showError?: boolean
  selectedSchemas: string[]
  supportSelectAll?: boolean
  excludedSchemas?: string[]
  onSelectSchemas: (schemas: string[]) => void
  label: string
}

export const SchemaComboBox = ({
  className,
  disabled = false,
  size = 'tiny',
  showError = true,
  selectedSchemas = [],
  excludedSchemas = [],
  label,
  onSelectSchemas,
}: SchemaComboBoxProps) => {
  const [open, setOpen] = useState(false)

  const { project } = useProjectContext()
  const {
    data,
    isLoading: isSchemasLoading,
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

  const toggleSchema = (schema: string) => {
    if (selectedSchemas.includes(schema)) {
      onSelectSchemas(selectedSchemas.filter((s) => s !== schema))
    } else {
      const newSelectedSchemas = [...selectedSchemas, schema].sort((a, b) => a.localeCompare(b))
      onSelectSchemas(newSelectedSchemas)
    }
  }

  return (
    <div className={className}>
      {isSchemasLoading && (
        <Button type="default" className="justify-start" block size={size} loading>
          Loading schemas...
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
        <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
          <PopoverTrigger_Shadcn_ asChild>
            <Button
              size={size}
              disabled={disabled}
              type="default"
              className={`w-full [&>span]:w-full`}
              iconRight={
                <ChevronsUpDown className="text-foreground-muted" strokeWidth={2} size={14} />
              }
            >
              <div className="w-full flex">
                <p className="text-foreground">{label}</p>
              </div>
            </Button>
          </PopoverTrigger_Shadcn_>
          <PopoverContent_Shadcn_ className="p-0 w-56" side="bottom" align="start">
            <Command_Shadcn_>
              <CommandInput_Shadcn_ placeholder="Find schema..." />
              <CommandList_Shadcn_>
                <CommandEmpty_Shadcn_>No schemas found</CommandEmpty_Shadcn_>
                <CommandGroup_Shadcn_>
                  <ScrollArea className={(schemas || []).length > 7 ? 'h-[210px]' : ''}>
                    {schemas?.map((schema) => (
                      <CommandItem_Shadcn_
                        key={schema.id}
                        className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                        onSelect={() => toggleSchema(schema.name)}
                        onClick={() => toggleSchema(schema.name)}
                      >
                        <span>{schema.name}</span>
                        {selectedSchemas.includes(schema.name) && (
                          <Check className="text-brand" strokeWidth={2} size={16} />
                        )}
                      </CommandItem_Shadcn_>
                    ))}
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
