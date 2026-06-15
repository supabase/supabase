import { useParams } from 'common'
import { noop } from 'lodash'
import { ChevronDown, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, ButtonProps, cn, Popover, PopoverContent, PopoverTrigger } from 'ui'

import { DatabaseSelectorMenuContent } from './DatabaseSelectorMenuContent'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { formatDatabaseID, formatDatabaseRegion } from '@/data/read-replicas/replicas.utils'
import { useDatabaseSelectorStateSnapshot } from '@/state/database-selector'

interface DatabaseSelectorProps {
  selectedDatabaseId?: string // To override initial state
  variant?: 'regular' | 'connected-on-right' | 'connected-on-left' | 'connected-on-both'
  additionalOptions?: { id: string; name: string }[]
  buttonProps?: ButtonProps
  onSelectId?: (id: string) => void // Optional callback
  className?: string
  align?: 'start' | 'end'
  isForm?: boolean
  showLabel?: boolean
}

export const DatabaseSelector = ({
  selectedDatabaseId: _selectedDatabaseId,
  variant = 'regular',
  additionalOptions = [],
  onSelectId = noop,
  buttonProps,
  align = 'end',
  className,
  isForm = false,
  showLabel = !isForm,
}: DatabaseSelectorProps) => {
  const { ref: projectRef } = useParams()
  const [open, setOpen] = useState(false)

  const state = useDatabaseSelectorStateSnapshot()
  const selectedDatabaseId = _selectedDatabaseId ?? state.selectedDatabaseId

  const { data, isPending: isLoading, isSuccess } = useReadReplicasQuery({ projectRef })
  const databases = data ?? []

  const selectedDatabase = databases.find((db) => db.identifier === selectedDatabaseId)
  const selectedDatabaseRegion = formatDatabaseRegion(selectedDatabase?.region ?? '')
  const formattedDatabaseId = formatDatabaseID(selectedDatabaseId ?? '')

  const selectedAdditionalOption = additionalOptions.find((x) => x.id === selectedDatabaseId)

  useEffect(() => {
    if (_selectedDatabaseId && !isForm) state.setSelectedDatabaseId(_selectedDatabaseId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_selectedDatabaseId])

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <div className={cn('flex cursor-pointer', className)}>
          {showLabel && (
            <span className="flex items-center text-foreground-lighter px-3 rounded-lg rounded-r-none text-xs border border-button border-r-0">
              Source
            </span>
          )}
          <Button
            type="default"
            icon={isLoading && <Loader2 className="animate-spin" />}
            iconRight={<ChevronDown strokeWidth={1.5} size={12} />}
            {...buttonProps}
            className={cn(
              'justify-start',
              showLabel && 'rounded-l-none',
              variant === 'connected-on-right' && 'rounded-r-none',
              variant === 'connected-on-left' && 'rounded-l-none border-l-0',
              variant === 'connected-on-both' && 'rounded-none border-x-0',
              buttonProps?.className
            )}
          >
            {selectedAdditionalOption ? (
              <span>{selectedAdditionalOption.name}</span>
            ) : (
              <>
                <span className="capitalize">
                  {isLoading || selectedDatabase?.identifier === projectRef
                    ? 'Primary'
                    : 'Read replica'}
                </span>{' '}
                {isSuccess && selectedDatabase?.identifier !== projectRef && (
                  <span>
                    ({selectedDatabaseRegion} - {formattedDatabaseId})
                  </span>
                )}
              </>
            )}
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-64" side="bottom" align={align}>
        <DatabaseSelectorMenuContent
          selectedDatabaseId={selectedDatabaseId}
          additionalOptions={additionalOptions}
          onSelectId={onSelectId}
          onAfterSelect={() => setOpen(false)}
          isForm={isForm}
        />
      </PopoverContent>
    </Popover>
  )
}
