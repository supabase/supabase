import { Check, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
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

import { useSchemasQuery } from '@/data/database/schemas-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

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
        <Alert variant="warning" className="px-3! py-3!">
          <AlertTitle className="text-xs text-amber-900">Failed to load schemas</AlertTitle>
          <AlertDescription className="text-xs mb-2 wrap-break-word">
            Error: {(schemasError as any)?.message}
          </AlertDescription>
          <Button type="default" size="tiny" onClick={() => refetchSchemas()}>
            Reload schemas
          </Button>
        </Alert>
      )}

      {isSchemasSuccess && (
        <Popover open={open} onOpenChange={setOpen} modal={false}>
          <PopoverTrigger asChild>
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
          </PopoverTrigger>
          <PopoverContent className="p-0 w-56" side="bottom" align="start">
            <Command>
              <CommandInput placeholder="Find schema..." />
              <CommandList>
                <CommandEmpty>No schemas found</CommandEmpty>
                <CommandGroup>
                  <ScrollArea className={(schemas || []).length > 7 ? 'h-[210px]' : ''}>
                    {schemas?.map((schema) => (
                      <CommandItem
                        key={schema.id}
                        className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                        onSelect={() => toggleSchema(schema.name)}
                        onClick={() => toggleSchema(schema.name)}
                      >
                        <span>{schema.name}</span>
                        {selectedSchemas.includes(schema.name) && (
                          <Check className="text-brand" strokeWidth={2} size={16} />
                        )}
                      </CommandItem>
                    ))}
                  </ScrollArea>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
