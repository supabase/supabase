import { useState } from 'react'
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

import { convertArgumentTypes } from 'components/interfaces/Database/Functions/Functions.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseFunctionsQuery } from 'data/database-functions/database-functions-query'
import { Check, Code } from 'lucide-react'

interface FunctionSelectorProps {
  className?: string
  size?: 'tiny' | 'small'
  showError?: boolean
  schema?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

const FunctionSelector = ({
  className,
  size = 'tiny',
  showError = true,
  disabled = false,
  schema,
  value,
  onChange,
}: FunctionSelectorProps) => {
  const { project } = useProjectContext()
  const [open, setOpen] = useState(false)

  const { data, error, isLoading, isError, isSuccess, refetch } = useDatabaseFunctionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const functions = (data ?? [])
    .filter((func) => schema && func.schema === schema)
    .filter((func) => func.return_type === 'json' || func.return_type === 'jsonb')
    .filter((func) => {
      const { value } = convertArgumentTypes(func.argument_types)
      if (value.length !== 1) return false
      return value[0].type === 'json' || value[0].type === 'jsonb'
    })

  return (
    <div className={className}>
      {isLoading && (
        <Button type="default" className="justify-start" block size={size} loading>
          Loading functions...
        </Button>
      )}

      {showError && isError && (
        <Alert_Shadcn_ variant="warning" className="!px-3 !py-3">
          <AlertTitle_Shadcn_ className="text-xs text-amber-900">
            Failed to load functions
          </AlertTitle_Shadcn_>

          <AlertDescription_Shadcn_ className="text-xs mb-2">
            Error: {error.message}
          </AlertDescription_Shadcn_>

          <Button type="default" size="tiny" onClick={() => refetch()}>
            Reload functions
          </Button>
        </Alert_Shadcn_>
      )}

      {isSuccess && (
        <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
          <PopoverTrigger_Shadcn_ asChild>
            <Button
              size={size}
              type="default"
              className={`w-full [&>span]:w-full ${size === 'small' ? 'py-1.5' : ''}`}
              iconRight={
                <Code className="text-foreground-light rotate-90" strokeWidth={2} size={12} />
              }
              disabled={!!disabled}
            >
              <div className="w-full flex gap-1">
                <p className="text-foreground-lighter">function:</p>
                <p className="text-foreground">{value}</p>
              </div>
            </Button>
          </PopoverTrigger_Shadcn_>
          <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start" sameWidthAsTrigger>
            <Command_Shadcn_>
              <CommandInput_Shadcn_ placeholder="Search functions..." />
              <CommandList_Shadcn_>
                <CommandEmpty_Shadcn_>No functions found</CommandEmpty_Shadcn_>
                <CommandGroup_Shadcn_>
                  <ScrollArea className={(functions || []).length > 7 ? 'h-[210px]' : ''}>
                    {!(functions || []).length && (
                      <CommandItem_Shadcn_
                        key="no-function-found"
                        disabled={true}
                        className="flex items-center justify-between space-x-2 w-full"
                      >
                        <span>
                          No function with a single JSON/B argument
                          <br />
                          and JSON/B return type found in this schema.
                        </span>
                      </CommandItem_Shadcn_>
                    )}
                    {functions?.map((func) => (
                      <CommandItem_Shadcn_
                        key={func.id}
                        value={func.name.replaceAll('"', '')}
                        className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                        onSelect={() => {
                          onChange(func.name)
                          setOpen(false)
                        }}
                        onClick={() => {
                          onChange(func.name)
                          setOpen(false)
                        }}
                      >
                        <span>{func.name}</span>
                        {value === func.name && (
                          <Check className="text-brand" size={14} strokeWidth={2} />
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

export default FunctionSelector
