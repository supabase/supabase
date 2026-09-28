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

  // Announced via the aria-live region below — a sighted user sees the spinner/list update,
  // but a screen reader user gets no equivalent signal unless we say so explicitly. Also covers
  // the result count, which isn't reliably announced by the listbox/option roles alone.
  function getStatusMessage(): string {
    if (searchState.status === 'loading') return 'Searching the docs…'
    if (searchState.status === 'noResults') return 'No results found.'
    if (searchState.status === 'error') return 'Something went wrong. Please try again.'
    if (results.length > 0) {
      return `${results.length} result${results.length === 1 ? '' : 's'} found.`
    }
    return ''
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
            aria-label="Search the Supabase documentation"
            onValueChange={handleValueChange}
            wrapperClassName="[&_svg]:h-5 [&_svg]:w-5 border-0"
            className="h-14 text-base"
          />
          {/*
            Screen-reader-only status announcement. Focus stays in the input as results come in
            (that's what lets people keep typing), so nothing else here gets read aloud on its
            own — this is what tells a screen reader user a search ran and how many results it found.
          */}
          <div role="status" aria-live="polite" className="sr-only">
            {getStatusMessage()}
          </div>
          <CommandList label="Search results">
            {searchState.status === 'initial' && (
              <CommandEmpty>Start typing to search the docs.</CommandEmpty>
            )}
            {searchState.status === 'loading' && results.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-foreground-muted">
                <Loader2 className="animate-spin" size={14} aria-hidden="true" />
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
