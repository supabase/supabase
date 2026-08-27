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
import { GenericSelectionSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'
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
  const showLoadingState = isLoadingPublications && publications.length === 0
  const showErrorState = isError && publications.length === 0

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
        if (open) {
          if (typeof projectRef !== 'undefined' && typeof sourceId !== 'undefined') {
            if (!isFetching) void refetchPublications()
          }
        }

        if (!open && field?.onBlur) {
          field.onBlur()
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="default"
          size="medium"
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
            {!showLoadingState && !showErrorState && (
              <CommandEmpty>No publications found</CommandEmpty>
            )}

            {showLoadingState && (
              <div className="p-1">
                <GenericSelectionSkeletonLoader className="w-full" variant="command" />
              </div>
            )}

            {showErrorState && (
              <div className="px-3 py-4 text-xs text-foreground-lighter">
                Unable to load publications
              </div>
            )}

            <CommandGroup>
              {publications.length === 0 && !showLoadingState && !showErrorState && (
                <div className="text-foreground-lighter text-xs py-3 px-2">
                  <p>No publications available</p>
                </div>
              )}
              <ScrollArea
                className={publications.length > 7 ? 'h-[210px]' : ''}
                onWheel={(e) => e.stopPropagation()}
              >
                {publications.map((pub) => (
                  <CommandItem
                    key={pub.name}
                    className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                    onSelect={() => {
                      handlePublicationSelect(pub.name)
                    }}
                    onClick={() => {
                      handlePublicationSelect(pub.name)
                    }}
                  >
                    <span>{pub.name}</span>
                    {selectedPublication === pub.name && (
                      <Check className="text-brand" strokeWidth={2} size={13} />
                    )}
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>

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
