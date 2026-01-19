import { Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ControllerRenderProps } from 'react-hook-form'

import type { ReplicationPublication } from 'data/replication/publications-query'
import {
  Badge,
  Button,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
} from 'ui'

interface PublicationsComboBoxProps {
  publications: ReplicationPublication[]
  isLoadingPublications: boolean
  onNewPublicationClick: () => void
  field: ControllerRenderProps<any, 'publicationName'>
}

export const PublicationsComboBox = ({
  publications,
  isLoadingPublications,
  onNewPublicationClick,
  field,
}: PublicationsComboBoxProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedPublication, setSelectedPublication] = useState<string>(field?.value || '')
  const [searchTerm, setSearchTerm] = useState('')

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
        if (!open && field?.onBlur) {
          field.onBlur()
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="default"
          size="medium"
          className={cn(
            'w-full [&>span]:w-full text-left',
            !selectedPublication && 'text-foreground-muted'
          )}
          iconRight={<ChevronsUpDown className="text-foreground-muted" strokeWidth={2} size={14} />}
          name={field.name}
          onBlur={field.onBlur}
        >
          {selectedPublication || 'Select publication'}
        </Button>
      </PopoverTrigger>
      <PopoverContent sameWidthAsTrigger className="p-0" align="start">
        <Command_Shadcn_>
          <CommandInput_Shadcn_
            placeholder="Find publication..."
            className="text-xs"
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <div className="px-2 pt-2 pb-1">
            <p className="text-xs text-foreground-lighter">
              Publications with no tables are hidden
            </p>
          </div>
          <CommandList_Shadcn_>
            <CommandEmpty_Shadcn_>
              {isLoadingPublications ? (
                <div className="flex items-center gap-2 text-center justify-center">
                  <Loader2 size={12} className="animate-spin" />
                  Loading...
                </div>
              ) : (
                'No publications found'
              )}
            </CommandEmpty_Shadcn_>

            <CommandGroup_Shadcn_>
              {publications.length === 0 && (
                <p className="text-foreground-lighter text-xs py-3 px-2">
                  No publications available
                </p>
              )}
              <ScrollArea className={publications.length > 7 ? 'h-[210px]' : ''}>
                {publications.map((pub) => (
                  <CommandItem_Shadcn_
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
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="default"
                        className="rounded-full px-2 py-0.5 text-[10px] font-normal border border-border bg-surface-100"
                      >
                        {pub.tables.length} {pub.tables.length === 1 ? 'table' : 'tables'}
                      </Badge>
                      {selectedPublication === pub.name && (
                        <Check className="text-brand" strokeWidth={2} size={13} />
                      )}
                    </div>
                  </CommandItem_Shadcn_>
                ))}
              </ScrollArea>
            </CommandGroup_Shadcn_>

            <CommandSeparator_Shadcn_ />

            <CommandGroup_Shadcn_>
              <CommandItem_Shadcn_
                className="cursor-pointer w-full"
                onSelect={onNewPublicationClick}
                onClick={onNewPublicationClick}
              >
                <Plus size={14} strokeWidth={1.5} className="mr-2" />
                <p>New publication</p>
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent>
    </Popover>
  )
}
