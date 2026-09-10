'use client'

import { useDocsSearch, type DocsSearchResult } from 'common'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { VisuallyHidden } from 'radix-ui'
import { useEffect } from 'react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from 'ui'

interface SearchV2DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchV2Dialog({ open, onOpenChange }: SearchV2DialogProps) {
  const router = useRouter()
  const { searchState, handleDocsSearchDebounced, resetSearch } = useDocsSearch()

  // Clear stale results once the dialog closes
  useEffect(() => {
    if (!open) resetSearch()
  }, [open, resetSearch])

  const results: DocsSearchResult[] =
    'results' in searchState
      ? searchState.results
      : 'staleResults' in searchState
        ? searchState.staleResults
        : []

  function handleValueChange(value: string) {
    if (value) {
      handleDocsSearchDebounced(value)
    } else {
      resetSearch()
    }
  }

  function handleSelect(path: string) {
    router.push(path)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* hideClose: this is a search box, not a form — closing is Escape/click-outside only, no "X" */}
      <DialogContent hideClose size="large" className="overflow-hidden p-0 shadow-lg">
        <Command>
          <VisuallyHidden.VisuallyHidden>
            <DialogTitle>Search docs</DialogTitle>
            <DialogDescription>Search the Supabase documentation</DialogDescription>
          </VisuallyHidden.VisuallyHidden>
          <CommandInput
            placeholder="Search docs..."
            onValueChange={handleValueChange}
            wrapperClassName="[&_svg]:h-5 [&_svg]:w-5 border-0"
            className="h-14 text-base"
          />
          <CommandList>
            {searchState.status === 'loading' && results.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-foreground-muted">
                <Loader2 className="animate-spin" size={14} />
                Searching...
              </div>
            )}
            {searchState.status === 'noResults' && <CommandEmpty>No results found.</CommandEmpty>}
            {searchState.status === 'error' && (
              <CommandEmpty>Something went wrong. Please try again.</CommandEmpty>
            )}
            {results.length > 0 && (
              <CommandGroup heading="Results" forceMount>
                {results.map((page) => (
                  <CommandItem
                    key={page.id}
                    value={String(page.id)}
                    forceMount
                    onSelect={() => handleSelect(page.path)}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm">{page.title}</span>
                      {(page.description || page.subtitle) && (
                        <span className="text-xs text-foreground-muted">
                          {page.description || page.subtitle}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
