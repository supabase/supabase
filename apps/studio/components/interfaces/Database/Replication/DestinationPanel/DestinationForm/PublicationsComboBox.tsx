import { useParams } from 'common'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ControllerRenderProps } from 'react-hook-form'
import {
  Button,
  cn,
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
import { SelectionListState } from 'ui-patterns/SelectionListState'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { useRefreshOnOpen } from './useRefreshOnOpen'
import { useReplicationPublicationNamesQuery } from '@/data/replication/publication-names-query'

interface PublicationsComboBoxProps {
  sourceId?: number
  field: ControllerRenderProps<DestinationPanelSchemaType, 'publicationName'>
  onNewPublicationClick: () => void
}

export const PublicationsComboBox = ({
  sourceId,
  field,
  onNewPublicationClick,
}: PublicationsComboBoxProps) => {
  const { ref: projectRef } = useParams()

  const [searchTerm, setSearchTerm] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedPublication, setSelectedPublication] = useState<string>(field?.value || '')

  const {
    data: publications = [],
    isPending,
    isFetching,
    isError,
    refetch: refetchPublications,
  } = useReplicationPublicationNamesQuery({ projectRef, sourceId })
  const isLoadingPublications = isPending || isFetching
  const isLoadingStateVisible = isLoadingPublications && publications.length === 0
  const isErrorStateVisible = isError && publications.length === 0
  const { handleOpenChange: handleRefreshPublicationsOnOpen } = useRefreshOnOpen({
    isEnabled: projectRef !== undefined && sourceId !== undefined,
    refetch: refetchPublications,
  })

  function handlePublicationSelect(pub: string) {
    setSelectedPublication(pub)
    setDropdownOpen(false)
    field.onChange(pub)
  }

  useEffect(() => {
    setSelectedPublication(field?.value || '')
  }, [field?.value])

  return (
    <Popover
      modal={false}
      open={dropdownOpen}
      onOpenChange={(open) => {
        setDropdownOpen(open)
        handleRefreshPublicationsOnOpen(open)

        if (!open && field?.onBlur) {
          setSearchTerm('')
          field.onBlur()
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="default"
          size="small"
          className={cn(
            'w-full [&>span]:w-full text-left',
            !selectedPublication && 'text-foreground-muted'
          )}
          iconRight={<ChevronsUpDown />}
          name={field.name}
          onBlur={field.onBlur}
        >
          {selectedPublication || 'Select publication'}
        </Button>
      </PopoverTrigger>
      <PopoverContent sameWidthAsTrigger className="p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Find publication..."
            className="text-xs"
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {!isLoadingStateVisible && !isErrorStateVisible && publications.length > 0 && (
              <CommandEmpty>No publications found</CommandEmpty>
            )}

            <SelectionListState
              loading={isLoadingStateVisible}
              error={isErrorStateVisible}
              empty={!isLoadingStateVisible && !isErrorStateVisible && publications.length === 0}
              emptyLabel="No publications available"
              errorLabel="Unable to load publications"
              skeletonVariant="command"
            />

            {publications.length > 0 && (
              <CommandGroup>
                <ScrollArea
                  className={publications.length > 7 ? 'h-[210px]' : ''}
                  onWheel={(e) => e.stopPropagation()}
                >
                  {publications.map((pub) => (
                    <CommandItem
                      key={pub.name}
                      className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                      onSelect={() => handlePublicationSelect(pub.name)}
                      onClick={() => handlePublicationSelect(pub.name)}
                    >
                      <span>{pub.name}</span>
                      {selectedPublication === pub.name && (
                        <Check className="text-brand" strokeWidth={2} size={13} />
                      )}
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
            )}

            <CommandSeparator />

            <CommandGroup>
              <CommandItem
                className="cursor-pointer w-full"
                onSelect={onNewPublicationClick}
                onClick={onNewPublicationClick}
              >
                <Plus size={14} strokeWidth={1.5} className="mr-2" />
                <p>New publication</p>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
