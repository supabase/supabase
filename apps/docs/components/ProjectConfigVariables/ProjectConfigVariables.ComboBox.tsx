import { noop } from 'lodash-es'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  Button_Shadcn_ as Button,
  cn,
  Command_Shadcn_ as Command,
  CommandGroup_Shadcn_ as CommandGroup,
  CommandInput_Shadcn_ as CommandInput,
  CommandItem_Shadcn_ as CommandItem,
  CommandList_Shadcn_ as CommandList,
  Popover as Popover,
  PopoverContent as PopoverContent,
  PopoverTrigger as PopoverTrigger,
  ScrollArea,
} from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { useIntersectionObserver } from '~/hooks/useIntersectionObserver'

export interface ComboBoxOption {
  id: string
  value: string
  displayName: string
}

export function ComboBox<Opt extends ComboBoxOption>({
  isLoading,
  disabled,
  name,
  options,
  selectedOption,
  selectedDisplayName,
  onSelectOption = noop,
  className,
  search = '',
  hasNextPage = false,
  isFetching = false,
  isFetchingNextPage = false,
  fetchNextPage,
  setSearch = () => {},
  useCommandSearch = true,
}: {
  isLoading: boolean
  disabled?: boolean
  name: string
  options: Opt[]
  selectedOption?: string
  selectedDisplayName?: string
  onSelectOption?: (newValue: string) => void
  className?: string
  search?: string
  hasNextPage?: boolean
  isFetching?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void
  setSearch?: (value: string) => void
  useCommandSearch?: boolean
}) {
  const [open, setOpen] = useState(false)

  const scrollRootRef = useRef<HTMLDivElement | null>(null)
  const [sentinelRef, entry] = useIntersectionObserver({
    root: scrollRootRef.current,
    threshold: 0,
    rootMargin: '0px',
  })

  useEffect(() => {
    if (!isLoading && !isFetching && !isFetchingNextPage && hasNextPage && entry?.isIntersecting) {
      fetchNextPage?.()
    }
  }, [isLoading, isFetching, isFetchingNextPage, hasNextPage, entry?.isIntersecting, fetchNextPage])

  return (
    <Popover
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) setSearch('')
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          aria-expanded={open}
          className={cn(
            'overflow-hidden',
            'h-auto min-h-10',
            'flex justify-between',
            'border-none',
            'py-0 pl-0 pr-1 text-left',
            className
          )}
        >
          {selectedDisplayName ??
            (isLoading && options.length > 0
              ? 'Loading...'
              : options.length === 0
                ? `No ${name} found`
                : `Select a ${name}...`)}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" side="bottom" align="start">
        <Command shouldFilter={useCommandSearch}>
          <CommandInput
            placeholder={`Search ${name}...`}
            className="border-none ring-0"
            showResetIcon
            value={search}
            onValueChange={setSearch}
            handleReset={() => setSearch('')}
          />
          <CommandList>
            <CommandGroup>
              {isLoading ? (
                <div className="px-2 py-1 flex flex-col gap-2">
                  <ShimmeringLoader className="w-full" />
                  <ShimmeringLoader className="w-4/5" />
                </div>
              ) : (
                <>
                  {search.length > 0 && options.length === 0 && (
                    <p className="text-xs text-center text-foreground-lighter py-3">
                      No {name}s found based on your search
                    </p>
                  )}
                  <ScrollArea className={options.length > 7 ? 'h-[210px]' : ''}>
                    {options.map((option) => (
                      <CommandItem
                        key={option.id}
                        value={option.value}
                        onSelect={(selectedValue: string) => {
                          setOpen(false)
                          onSelectOption(selectedValue)
                        }}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedOption === option.value ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {option.displayName}
                      </CommandItem>
                    ))}
                    <div ref={sentinelRef} className="h-1 -mt-1" />
                    {hasNextPage && <ShimmeringLoader className="px-2 py-3" />}
                  </ScrollArea>
                </>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
