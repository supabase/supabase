import { Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ControllerRenderProps } from 'react-hook-form'
import {
  Button,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
} from 'ui'

interface PublicationsComboBoxProps {
  publications: string[]
  isLoadingPublications: boolean
  isLoadingCheck: boolean
  onNewPublicationClick: () => void
  field: ControllerRenderProps<any, 'publicationName'>
}

const PublicationsComboBox = ({
  publications,
  isLoadingPublications,
  isLoadingCheck,
  onNewPublicationClick,
  field,
}: PublicationsComboBoxProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedPublication, setSelectedPublication] = useState<string>(field?.value || '')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    setSelectedPublication(field?.value || '')
  }, [field?.value])

  function handleSearchChange(value: string) {
    setSearchTerm(value)
  }

  function handlePublicationSelect(pub: string) {
    setSelectedPublication(pub)
    setDropdownOpen(false)
    field.onChange(pub)
  }

  return (
    <Popover_Shadcn_
      modal={false}
      open={dropdownOpen}
      onOpenChange={(open) => {
        setDropdownOpen(open)
        if (!open && field?.onBlur) {
          field.onBlur()
        }
      }}
    >
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type="default"
          size="medium"
          className={cn(
            'w-full [&>span]:w-full text-left',
            !selectedPublication && 'text-foreground-muted'
          )}
          iconRight={
            isLoadingCheck ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <ChevronsUpDown className="text-foreground-muted" strokeWidth={2} size={14} />
            )
          }
          name={field.name}
          onBlur={field.onBlur}
        >
          {selectedPublication || 'Select publication'}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0" sameWidthAsTrigger>
        <Command_Shadcn_>
          <CommandInput_Shadcn_
            placeholder="Find publication..."
            value={searchTerm}
            onValueChange={handleSearchChange}
          />
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
              <ScrollArea className={publications.length > 7 ? 'h-[210px]' : ''}>
                {publications.map((pub) => (
                  <CommandItem_Shadcn_
                    key={pub}
                    className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                    onSelect={() => {
                      handlePublicationSelect(pub)
                    }}
                    onClick={() => {
                      handlePublicationSelect(pub)
                    }}
                  >
                    <span>{pub}</span>
                    {selectedPublication === pub && (
                      <Check className="text-brand" strokeWidth={2} size={13} />
                    )}
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
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default PublicationsComboBox
