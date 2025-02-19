import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
} from 'ui'

interface PublicationsComboBoxProps {
  publications: string[]
  loading: boolean
  onSelectPublication: (publication: string) => void
}

const PublicationsComboBox = ({
  publications,
  loading,
  onSelectPublication,
}: PublicationsComboBoxProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedPublication, setSelectedPublication] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  function handleSearchChange(value: string) {
    setSearchTerm(value)
  }

  return (
    <Popover_Shadcn_ modal={false} open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type="default"
          size="medium"
          className={`w-full [&>span]:w-full text-left`}
          iconRight={
            <ChevronsUpDown
              className="text-foreground-muted"
              strokeWidth={2}
              size={14}
            ></ChevronsUpDown>
          }
        >
          {selectedPublication !== undefined && selectedPublication !== ''
            ? selectedPublication
            : 'Select publication'}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ sameWidthAsTrigger>
        <Command_Shadcn_>
          <CommandInput_Shadcn_
            placeholder="Find publication..."
            value={searchTerm}
            onValueChange={handleSearchChange}
          ></CommandInput_Shadcn_>
          <CommandList_Shadcn_>
            <CommandEmpty_Shadcn_>
              {loading ? (
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
                      setSelectedPublication(pub)
                      setDropdownOpen(false)
                      onSelectPublication(pub)
                    }}
                    onClick={() => {
                      setSelectedPublication(pub)
                      setDropdownOpen(false)
                      onSelectPublication(pub)
                    }}
                  >
                    <span>{pub}</span>
                    {selectedPublication === pub && (
                      <Check className="text-brand" strokeWidth={2} size={16} />
                    )}
                  </CommandItem_Shadcn_>
                ))}
              </ScrollArea>
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default PublicationsComboBox
