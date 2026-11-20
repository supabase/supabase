import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { uniqBy } from 'lodash'
import { CheckIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  ComboboxTrigger,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
} from 'ui'

import { CommandItemLink } from '@/components/ui/CommandItemLink'
import {
  DatabaseFunctionsData,
  databaseFunctionsQueryOptions,
} from '@/data/database-functions/database-functions-query'
import { usePermissionsQueryV2 } from '@/data/permissions/permissions-query-v2'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useGrant } from '@/lib/grants'

type DatabaseFunction = DatabaseFunctionsData[number]

interface FunctionSelectorProps {
  className?: string
  size?: 'tiny' | 'small'
  showError?: boolean
  schema?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  // used to filter the functions by a criteria
  filterFunction?: (func: DatabaseFunction) => boolean
  noResultsLabel?: React.ReactNode
}

const FunctionSelector = ({
  className,
  size = 'tiny',
  showError = true,
  disabled = false,
  schema,
  value,
  onChange,
  filterFunction = () => true,
  noResultsLabel = <span>No functions found in this schema.</span>,
}: FunctionSelectorProps) => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [open, setOpen] = useState(false)

  const readGrant = useGrant(
    'POST /platform/pg-meta/{ref}/query',
    { projectRef: project?.ref },
    { variant: 'read' }
  )
  const { refetch: refetchPermissions } = usePermissionsQueryV2({ enabled: false })
  const {
    data,
    error: queryError,
    isPending: isLoadingFunctions,
    isError: isQueryError,
    isSuccess,
    refetch,
  } = useQuery(
    databaseFunctionsQueryOptions({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      grant: readGrant.grant,
    })
  )
  const isLoading =
    readGrant.status === 'loading' || (readGrant.status === 'granted' && isLoadingFunctions)
  const isDenied = readGrant.status === 'denied'
  const isPermissionsError = readGrant.status === 'error'
  const isError = isQueryError || isPermissionsError
  const errorMessage = isPermissionsError ? readGrant.error.message : queryError?.message

  const filteredFunctions = (data ?? [])
    .filter((func) => schema && func.schema === schema)
    .filter(filterFunction)
  const functions = uniqBy(filteredFunctions, (func) => func.name)

  return (
    <div className={className}>
      {isLoading && (
        <Button variant="default" className="justify-start" block size={size} loading>
          Loading functions...
        </Button>
      )}

      {showError && isDenied && (
        <Alert variant="warning" className="px-3! py-3!">
          <AlertTitle className="text-xs text-amber-900">Failed to load functions</AlertTitle>
          <AlertDescription className="text-xs">
            You need additional permissions to view database functions
          </AlertDescription>
        </Alert>
      )}

      {showError && isError && (
        <Alert variant="warning" className="px-3! py-3!">
          <AlertTitle className="text-xs text-amber-900">Failed to load functions</AlertTitle>

          <AlertDescription className="text-xs mb-2">Error: {errorMessage}</AlertDescription>

          <Button
            variant="default"
            size="tiny"
            onClick={() => (isPermissionsError ? refetchPermissions() : refetch())}
          >
            Reload functions
          </Button>
        </Alert>
      )}

      {isSuccess && (
        <Popover open={open} onOpenChange={setOpen} modal={false}>
          <PopoverTrigger asChild>
            <ComboboxTrigger
              size={size}
              disabled={!!disabled}
              aria-expanded={open}
              data-state={open ? 'open' : 'closed'}
              className={size === 'small' ? 'py-1.5' : undefined}
            >
              {value ? (
                <span className="flex w-full gap-1">
                  <span className="text-foreground-lighter">function:</span>
                  <span className="text-foreground">{value}</span>
                </span>
              ) : (
                <span className="flex w-full gap-1 text-foreground-lighter">Select a function</span>
              )}
            </ComboboxTrigger>
          </PopoverTrigger>
          <PopoverContent className="p-0" side="bottom" align="start" sameWidthAsTrigger>
            <Command>
              <CommandInput placeholder="Search functions..." />
              <CommandList>
                <CommandEmpty>No functions found</CommandEmpty>
                <CommandGroup>
                  <ScrollArea className={(functions || []).length > 7 ? 'h-[210px]' : ''}>
                    {!functions.length && (
                      <CommandItem
                        key="no-function-found"
                        disabled={true}
                        className="flex items-center justify-between space-x-2 w-full"
                      >
                        {noResultsLabel}
                      </CommandItem>
                    )}
                    {functions.map((func) => (
                      <CommandItem
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
                          <CheckIcon className="text-primary" size={14} strokeWidth={2} />
                        )}
                      </CommandItem>
                    ))}
                  </ScrollArea>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItemLink
                    href={`/project/${ref}/database/functions`}
                    className="cursor-pointer w-full gap-2"
                    onSelect={() => setOpen(false)}
                  >
                    <PlusIcon size={14} strokeWidth={1.5} />
                    <p>New function</p>
                  </CommandItemLink>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

export default FunctionSelector
