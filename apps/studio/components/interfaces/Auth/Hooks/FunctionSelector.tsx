import { observer } from 'mobx-react-lite'
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
  IconCheck,
  IconCode,
  IconLoader,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
} from 'ui'

import { convertArgumentTypes } from 'components/interfaces/Database/Functions/Functions.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useStore } from 'hooks'

interface FunctionSelectorProps {
  className?: string
  size?: 'tiny' | 'small'
  showError?: boolean
  schema?: string
  selectedFunctionName: string
  onSelectFunction: (name: string) => void
  disabled?: boolean
}

const FunctionSelector = ({
  className,
  size = 'tiny',
  showError = true,
  disabled = false,
  schema,
  selectedFunctionName,
  onSelectFunction,
}: FunctionSelectorProps) => {
  const { project } = useProjectContext()
  const { meta } = useStore()
  const [open, setOpen] = useState(false)

  const refetchFunctions = () => {
    meta.functions.load()
  }

  const functions = meta.functions
    .list()
    .filter((func) => schema && func.schema === schema)
    .filter((func) => func.return_type === 'json' || func.return_type === 'jsonb')
    .filter((func) => {
      const { value } = convertArgumentTypes(func.argument_types)

      if (value.length !== 1) {
        return false
      }

      return value[0].type === 'json' || value[0].type === 'jsonb'
    })

  const isFunctionsLoading = meta.functions.isLoading
  const isFunctionsError = meta.functions.hasError
  const functionsError = meta.functions.error
  const isFunctionsSuccess = !isFunctionsLoading && !isFunctionsError

  return (
    <div className={className}>
      {isFunctionsLoading && (
        <Button
          type="outline"
          className="w-full [&>span]:w-full"
          icon={<IconLoader className="animate-spin" size={12} />}
          disabled={!!disabled}
        >
          <div className="w-full flex space-x-3 py-0.5">
            <p className="text-xs text-foreground-light">Loading functions...</p>
          </div>
        </Button>
      )}

      {showError && isFunctionsError && (
        <Alert_Shadcn_ variant="warning" className="!px-3 !py-3">
          <AlertTitle_Shadcn_ className="text-xs text-amber-900">
            Failed to load functions
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_ className="text-xs mb-2">
            Error: {functionsError?.message}
          </AlertDescription_Shadcn_>
          <Button type="default" size="tiny" onClick={() => refetchFunctions()}>
            Reload functions
          </Button>
        </Alert_Shadcn_>
      )}

      {isFunctionsSuccess && (
        <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
          <PopoverTrigger_Shadcn_ asChild>
            <Button
              size={size}
              type="outline"
              className={`w-full [&>span]:w-full ${size === 'small' ? 'py-1.5' : ''}`}
              iconRight={
                <IconCode className="text-foreground-light rotate-90" strokeWidth={2} size={12} />
              }
              disabled={!!disabled}
            >
              <div className="w-full flex space-x-3 py-0.5">
                <p className="text-xs text-foreground-light">function</p>
                <p className="text-xs">
                  {selectedFunctionName === '*' ? 'All functions' : selectedFunctionName}
                </p>
              </div>
            </Button>
          </PopoverTrigger_Shadcn_>
          <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
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
                        className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                        onSelect={() => {
                          onSelectFunction(func.name)
                          setOpen(false)
                        }}
                        onClick={() => {
                          onSelectFunction(func.name)
                          setOpen(false)
                        }}
                      >
                        <span>{func.name}</span>
                        {selectedFunctionName === func.name && (
                          <IconCheck className="text-brand" strokeWidth={2} />
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

export default observer(FunctionSelector)
