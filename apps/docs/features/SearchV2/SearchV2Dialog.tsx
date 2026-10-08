'use client'

import { LoadingBeam } from '~/features/ui/LoadingBeam'
import { useDocsSearchV2, type DocsSearchV2Result } from 'common'
import { useRouter } from 'next/navigation'
import { VisuallyHidden } from 'radix-ui'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
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
  KeyboardShortcut,
} from 'ui'

import { getIsSearching } from './SearchV2.utils'
import { SearchV2Result } from './SearchV2Result'
import { useSendTelemetryEvent } from '@/lib/telemetry'

interface SearchV2DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SearchV2PanelProps {
  onResultSelect: (path: string) => void
  onResultOpen: () => void
}

export function SearchV2Dialog({ open, onOpenChange }: SearchV2DialogProps) {
  const router = useRouter()

  function handleSelect(path: string) {
    router.push(path)
    onOpenChange(false)
  }

  function handleResultOpen() {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        centered={false}
        dialogOverlayProps={{
          className:
            'data-closed:animate-out! data-closed:fade-out-0 data-closed:fill-mode-forwards data-closed:duration-150 data-closed:ease-enter pt-20 sm:pt-20',
        }}
        size="large"
        className="overflow-hidden rounded-lg border-0 p-0 inset-ring inset-ring-border shadow-(--shadow-codeblock)!"
      >
        <SearchV2Panel onResultSelect={handleSelect} onResultOpen={handleResultOpen} />
      </DialogContent>
    </Dialog>
  )
}

function SearchV2Panel({ onResultSelect, onResultOpen }: SearchV2PanelProps) {
  const sendTelemetryEvent = useSendTelemetryEvent()
  const { searchState, handleDocsSearchDebounced, resetSearch } = useDocsSearchV2()
  const [query, setQuery] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // highlight with the query the visible results belong to, not the one being typed
  const highlightQuery =
    'query' in searchState
      ? searchState.query
      : 'staleQuery' in searchState
        ? searchState.staleQuery
        : ''

  useEffect(() => {
    if (searchState.status === 'results' || searchState.status === 'noResults') {
      sendTelemetryEvent({
        action: 'docs_search_v2_search_submitted',
        properties: { query: searchState.query },
      })
    }
  }, [searchState, sendTelemetryEvent])

  const results: DocsSearchV2Result[] =
    'results' in searchState
      ? searchState.results
      : 'staleResults' in searchState
        ? searchState.staleResults
        : []

  const isListVisible =
    results.length > 0 || searchState.status === 'noResults' || searchState.status === 'error'
  const isSearching = getIsSearching({ searchState, query })

  function handleClear() {
    setQuery('')
    resetSearch()
    inputRef.current?.focus()
  }

  // cmdk's root turns enter into "open highlighted result", so keep it on the button.
  // other keys must bubble, or tab never reaches the dialog's focus trap
  function handleClearKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Enter') event.stopPropagation()
  }

  function handleValueChange(value: string) {
    setIsDeleting(value.length < query.length)
    setQuery(value)
    if (value) {
      handleDocsSearchDebounced(value)
    } else {
      resetSearch()
    }
  }

  function handleSelect(path: string) {
    sendTelemetryEvent({
      action: 'docs_search_v2_result_clicked',
      properties: { resultPath: path, query: highlightQuery },
    })
    onResultSelect(path)
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
    <Command shouldFilter={false} className="bg-transparent">
      <VisuallyHidden.VisuallyHidden>
        <DialogTitle>Search docs</DialogTitle>
        <DialogDescription>Search the Supabase documentation</DialogDescription>
      </VisuallyHidden.VisuallyHidden>
      <div className="relative flex items-center gap-3 pr-4">
        <CommandInput
          ref={inputRef}
          value={query}
          placeholder="Search docs..."
          aria-label="Search the Supabase documentation"
          onValueChange={handleValueChange}
          wrapperClassName="flex-1 border-0 pl-3 pr-0 text-foreground-lighter [&_svg]:size-4.5 [&_svg]:stroke-2 [&_svg]:opacity-100"
          className="h-12 pl-2.5 text-base text-foreground placeholder:text-foreground-lighter"
        />
        {query ? (
          <button
            type="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={handleClearKeyDown}
            className="relative -mx-2 shrink-0 cursor-pointer rounded-md px-2 py-1 text-xs text-foreground-lighter transition-colors duration-150 after:absolute after:inset-x-0 after:-inset-y-2 after:content-[''] hover:bg-overlay-hover hover:text-foreground focus-ring"
          >
            Clear
          </button>
        ) : null}
        <LoadingBeam
          isActive={isSearching}
          direction={isDeleting ? 'backward' : 'forward'}
          className={isListVisible ? '-bottom-px' : undefined}
        />
      </div>
      {/*
            Screen-reader-only status announcement. Focus stays in the input as results come in
            (that's what lets people keep typing), so nothing else here gets read aloud on its
            own — this is what tells a screen reader user a search ran and how many results it found.
          */}
      <div role="status" aria-live="polite" className="sr-only">
        {getStatusMessage()}
      </div>
      <CommandList
        label="Search results"
        className="h-(--cmdk-list-height) max-h-[min(477px,70dvh)] inset-shadow-2xs inset-shadow-border mx-px transition-all duration-150 ease-enter motion-reduce:transition-none scroll-fade-bottom"
      >
        {searchState.status === 'noResults' && <CommandEmpty>No results found.</CommandEmpty>}
        {searchState.status === 'error' && (
          <CommandEmpty>Something went wrong. Please try again.</CommandEmpty>
        )}
        {results.length > 0 && (
          <CommandGroup className="pt-1.25">
            {results.map((result) => (
              <SearchV2Result
                key={result.path}
                result={result}
                highlightQuery={highlightQuery}
                onResultSelect={handleSelect}
                onResultOpen={onResultOpen}
              />
            ))}
          </CommandGroup>
        )}
      </CommandList>
      {results.length > 0 ? <SearchV2Footer /> : null}
    </Command>
  )
}

function SearchV2Footer() {
  return (
    <footer
      aria-hidden
      className="flex items-center justify-end gap-3 border-t px-4 py-2.5 text-xs text-foreground-lighter mx-px max-lg:hidden"
    >
      <span className="flex items-center gap-1.5">
        Navigate
        <KeyboardShortcut keys={['ArrowUp']} />
        <KeyboardShortcut keys={['ArrowDown']} />
      </span>
      <span className="h-3 w-px bg-border" />
      <span className="flex items-center gap-1.5">
        Open
        <KeyboardShortcut keys={['Enter']} />
      </span>
    </footer>
  )
}
