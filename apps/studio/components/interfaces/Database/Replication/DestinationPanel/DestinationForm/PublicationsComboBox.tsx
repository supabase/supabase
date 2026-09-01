import { useParams } from 'common'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { useState } from 'react'
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
import {
  isMetadataListErrorVisible,
  isMetadataListLoading,
  useRefreshOnOpen,
} from './useRefreshOnOpen'
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const selectedPublication = field.value || ''

  const {
    data: publications = [],
    isPending,
    isFetching,
    isError,
    refetch: refetchPublications,
  } = useReplicationPublicationNamesQuery({ projectRef, sourceId })
  const isLoadingStateVisible = isMetadataListLoading(isPending || isFetching, publications.length)
  const isErrorStateVisible = isMetadataListErrorVisible(isError, publications.length)
  const { handleOpenChange: handleRefreshPublicationsOnOpen } = useRefreshOnOpen({
    isEnabled: projectRef !== undefined && sourceId !== undefined,
    refetch: refetchPublications,
  })

  function handlePublicationSelect(pub: string) {
    setIsDropdownOpen(false)
    field.onChange(pub)
  }

  return (
    <Popover
      modal={false}
      open={isDropdownOpen}
      onOpenChange={(open) => {
        setIsDropdownOpen(open)
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
      <PopoverContent
        sameWidthAsTrigger
        className="p-0"
        align="start"
        side="bottom"
        collisionPadding={16}
      >
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
              isLoading={isLoadingStateVisible}
              isError={isErrorStateVisible}
              isEmpty={!isLoadingStateVisible && !isErrorStateVisible && publications.length === 0}
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
