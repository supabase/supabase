import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Command_Shadcn_,
  CommandInput_Shadcn_,
  CommandList_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
} from 'ui'
import { useContentQuery } from 'data/content/content-query'

type SnippetDropdownProps = {
  projectRef?: string
  onSelect: (snippet: any) => void
  trigger: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  className?: string
  autoFocus?: boolean
}

export default function SnippetDropdown({
  projectRef,
  onSelect,
  trigger,
  side = 'bottom',
  align = 'end',
  className,
  autoFocus = false,
}: SnippetDropdownProps) {
  const [snippetSearch, setSnippetSearch] = useState('')

  const { data: snippetsData, isLoading } = useContentQuery({
    projectRef,
    type: 'sql',
    name: snippetSearch.length === 0 ? undefined : snippetSearch,
  })
  const snippets = (snippetsData?.content ?? []) as any[]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align={align}
        className={['w-80 p-0', className].filter(Boolean).join(' ')}
      >
        <Command_Shadcn_ shouldFilter={false}>
          <CommandInput_Shadcn_
            autoFocus={autoFocus}
            placeholder="Search snippets..."
            value={snippetSearch}
            onValueChange={setSnippetSearch}
          />
          <CommandList_Shadcn_>
            {isLoading ? (
              <CommandEmpty_Shadcn_>Loading…</CommandEmpty_Shadcn_>
            ) : snippets.length === 0 ? (
              <CommandEmpty_Shadcn_>No snippets found</CommandEmpty_Shadcn_>
            ) : null}
            <CommandGroup_Shadcn_>
              {snippets.map((snippet: any) => (
                <CommandItem_Shadcn_ key={snippet.id} onSelect={() => onSelect(snippet)}>
                  {snippet.name}
                </CommandItem_Shadcn_>
              ))}
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
