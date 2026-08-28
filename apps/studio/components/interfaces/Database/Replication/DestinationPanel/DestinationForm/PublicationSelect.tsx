import { useParams } from 'common'
import { Check, Loader2, Plus } from 'lucide-react'
import { useId, useState } from 'react'
import { ControllerRenderProps } from 'react-hook-form'
import {
  cn,
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
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { useReplicationPublicationsQuery } from '@/data/replication/publications-query'

interface PublicationSelectProps {
  sourceId?: number
  field: ControllerRenderProps<DestinationPanelSchemaType, 'publicationName'>
  onNewPublicationClick: () => void
}

export const PublicationSelect = ({
  sourceId,
  field,
  onNewPublicationClick,
}: PublicationSelectProps) => {
  const { ref: projectRef } = useParams()
  const listboxId = useId()
  const [open, setOpen] = useState(false)
  const selectedPublication = field.value ?? ''

  const {
    data: publications = [],
    isPending,
    isFetching,
    refetch: refetchPublications,
  } = useReplicationPublicationsQuery({ projectRef, sourceId })
  const isLoadingPublications = isPending || isFetching
  const showLoadingState = isLoadingPublications && publications.length === 0

  const handlePublicationSelect = (publicationName: string) => {
    setOpen(false)
    field.onChange(publicationName)
  }

  return (
    <Popover
      modal={false}
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) {
          if (typeof projectRef !== 'undefined' && typeof sourceId !== 'undefined') {
            refetchPublications()
          }
        }

        if (!nextOpen) {
          field.onBlur()
        }
      }}
    >
      <PopoverTrigger asChild>
        <ComboboxTrigger
          aria-expanded={open}
          aria-controls={listboxId}
          data-state={open ? 'open' : 'closed'}
          disabled={showLoadingState}
          name={field.name}
          onBlur={field.onBlur}
          className={cn(!selectedPublication && !showLoadingState && 'text-foreground-lighter')}
          icon={
            showLoadingState ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-foreground-lighter" />
            ) : undefined
          }
        >
          {showLoadingState
            ? 'Loading publications...'
            : selectedPublication || 'Select publication'}
        </ComboboxTrigger>
      </PopoverTrigger>
      <PopoverContent id={listboxId} sameWidthAsTrigger className="p-0" align="start">
        <Command>
          <CommandInput placeholder="Find publication..." className="text-xs" />
          <CommandList>
            <CommandEmpty>No publications found</CommandEmpty>

            {showLoadingState ? (
              <div className="p-2">
                <GenericSkeletonLoader className="w-full" />
              </div>
            ) : (
              <>
                {publications.length === 0 ? (
                  <div className="text-foreground-lighter text-xs py-3 px-2 space-y-0.5">
                    <p>No publications available</p>
                    <p className="text-foreground-muted">Publications with no tables are hidden</p>
                  </div>
                ) : (
                  <CommandGroup>
                    <ScrollArea
                      className={publications.length > 7 ? 'h-[210px]' : ''}
                      onWheel={(event) => event.stopPropagation()}
                    >
                      {publications.map((pub) => (
                        <CommandItem
                          key={pub.name}
                          value={pub.name}
                          className="cursor-pointer [&>span]:top-2.5"
                          onSelect={() => {
                            handlePublicationSelect(pub.name)
                          }}
                        >
                          <div className="flex w-full items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p>{pub.name}</p>
                              <p className="text-foreground-lighter">
                                {pub.tables.length} {pub.tables.length === 1 ? 'table' : 'tables'}
                              </p>
                            </div>
                            <Check
                              className={cn(
                                'mt-0.5 h-4 w-4 shrink-0 text-brand',
                                selectedPublication === pub.name ? 'opacity-100' : 'opacity-0'
                              )}
                              strokeWidth={2}
                            />
                          </div>
                        </CommandItem>
                      ))}
                    </ScrollArea>
                  </CommandGroup>
                )}

                <CommandSeparator />

                <CommandGroup>
                  <CommandItem
                    value="new-publication"
                    className="cursor-pointer"
                    onSelect={() => {
                      setOpen(false)
                      onNewPublicationClick()
                    }}
                  >
                    <Plus size={14} strokeWidth={1.5} className="mr-2" />
                    New publication
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
