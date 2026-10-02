'use client'

import { LoadingBeam } from '~/features/ui/LoadingBeam'
import { useDocsSearchV2, type DocsSearchV2Result } from 'common'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { VisuallyHidden } from 'radix-ui'
import { useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import {
  cn,
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

import { formatHeadingPath, highlightMatches } from './SearchV2.utils'

interface SearchV2DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SearchV2PanelProps {
  onResultSelect: (path: string) => void
  onResultOpen: () => void
}

interface SearchV2ResultProps {
  result: DocsSearchV2Result
  highlightQuery: string
  onResultSelect: (path: string) => void
  onResultOpen: () => void
}

type PointerOpen = 'none' | 'same-tab' | 'new-tab'

type DocsSearchV2State = ReturnType<typeof useDocsSearchV2>['searchState']

interface GetIsSearchingParams {
  searchState: DocsSearchV2State
  query: string
}

const OVERLAY_CLASS = cn(
  'data-closed:animate-out! data-closed:fade-out-0 data-closed:fill-mode-forwards',
  'data-closed:duration-150 data-closed:ease-enter',
  'max-lg:bg-transparent max-lg:backdrop-blur-none',
  'max-lg:top-(--header-height) max-lg:p-0!',
  'max-lg:data-closed:duration-200!'
)

const CONTENT_CLASS = cn(
  'overflow-hidden rounded-lg border-0 p-0',
  'shadow-[inset_0_0_0_1px_var(--border-default),var(--shadow-codeblock,0_0_#0000)]!',
  'max-lg:flex max-lg:flex-1 max-lg:flex-col max-lg:max-w-none! max-lg:rounded-none!',
  'max-lg:shadow-none!',
  'max-lg:data-[state=open]:zoom-in-100! max-lg:data-[state=closed]:zoom-out-100!',
  'max-lg:motion-safe:data-[state=open]:slide-in-from-top-[100%]!',
  'max-lg:motion-safe:data-[state=closed]:slide-out-to-top-[100%]!',
  'max-lg:motion-reduce:data-[state=open]:fade-in-0',
  'max-lg:duration-300 max-lg:data-[state=closed]:duration-200! max-lg:ease-enter'
)

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
        dialogOverlayProps={{ className: OVERLAY_CLASS }}
        size="large"
        className={CONTENT_CLASS}
      >
        <SearchV2Panel onResultSelect={handleSelect} onResultOpen={handleResultOpen} />
      </DialogContent>
    </Dialog>
  )
}

function SearchV2Panel({ onResultSelect, onResultOpen }: SearchV2PanelProps) {
  const { searchState, handleDocsSearchDebounced, resetSearch } = useDocsSearchV2()
  const [query, setQuery] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [lastSettledQuery, setLastSettledQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Only update the highlighted query once a new result set actually lands, so highlights
  // don't shift on every keystroke while the debounced search is still in flight.
  const highlightQuery = getSettledQuery(searchState) ?? lastSettledQuery
  if (highlightQuery !== lastSettledQuery) setLastSettledQuery(highlightQuery)

  const results: DocsSearchV2Result[] =
    'results' in searchState
      ? searchState.results
      : 'staleResults' in searchState
        ? searchState.staleResults
        : []

  const hasListContent =
    results.length > 0 || searchState.status === 'noResults' || searchState.status === 'error'
  const isSearching = getIsSearching({ searchState, query })

  function handleClear() {
    setQuery('')
    resetSearch()
    inputRef.current?.focus()
  }

  function handleClearKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    event.stopPropagation()
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
    <Command className="bg-transparent max-lg:min-h-0 max-lg:flex-1">
      <VisuallyHidden.VisuallyHidden>
        <DialogTitle>Search docs</DialogTitle>
        <DialogDescription>Search the Supabase documentation</DialogDescription>
      </VisuallyHidden.VisuallyHidden>
      <div className="relative flex items-center gap-3 pr-4 max-lg:pr-5">
        <CommandInput
          ref={inputRef}
          value={query}
          placeholder="Search docs..."
          aria-label="Search the Supabase documentation"
          onValueChange={handleValueChange}
          wrapperClassName={cn(
            'flex-1 border-0 pl-3 pr-0 text-foreground-lighter max-lg:pl-5',
            '[&_svg]:size-4.5 [&_svg]:stroke-[2.25] [&_svg]:opacity-100'
          )}
          className="h-12 pl-2.5 text-base text-foreground placeholder:text-foreground-lighter"
        />
        {query ? (
          <button
            type="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={handleClearKeyDown}
            className="shrink-0 rounded-sm text-sm text-foreground-lighter transition-colors hover:text-foreground-light focus-ring"
          >
            Clear
          </button>
        ) : null}
        <LoadingBeam
          isActive={isSearching}
          direction={isDeleting ? 'backward' : 'forward'}
          className={hasListContent ? '-bottom-px' : 'max-lg:-bottom-px'}
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
        className={cn(
          'h-(--cmdk-list-height) max-h-[min(477px,70dvh)]',
          'max-lg:h-auto max-lg:max-h-none max-lg:flex-1',
          'shadow-[inset_0_1px_0_var(--border-default)] lg:mx-px',
          'transition-[height] duration-150 ease-enter',
          'motion-reduce:transition-none',
          'scroll-fade-bottom'
        )}
      >
        {searchState.status === 'noResults' && <CommandEmpty>No results found.</CommandEmpty>}
        {searchState.status === 'error' && (
          <CommandEmpty>Something went wrong. Please try again.</CommandEmpty>
        )}
        {results.length > 0 && (
          <CommandGroup forceMount className="pt-1.25">
            {results.map((result) => (
              <SearchV2Result
                key={result.path}
                result={result}
                highlightQuery={highlightQuery}
                onResultSelect={onResultSelect}
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
      className="flex items-center justify-end gap-3 border-t px-4 py-2.5 text-xs text-foreground-lighter max-lg:hidden lg:mx-px"
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

function SearchV2Result({
  result,
  highlightQuery,
  onResultSelect,
  onResultOpen,
}: SearchV2ResultProps) {
  const parentHeadings = result.headingPath.slice(0, -1)
  const heading = result.headingPath.at(-1) ?? result.title

  const pointerOpenRef = useRef<PointerOpen>('none')

  function handleLinkClick(event: MouseEvent<HTMLAnchorElement>) {
    const isNewTab = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
    pointerOpenRef.current = isNewTab ? 'new-tab' : 'same-tab'
  }

  function handleSelect() {
    const pointerOpen = pointerOpenRef.current
    pointerOpenRef.current = 'none'
    if (pointerOpen === 'none') return onResultSelect(result.path)
    if (pointerOpen === 'same-tab') onResultOpen()
  }

  return (
    <CommandItem
      asChild
      value={result.path}
      forceMount
      onSelect={handleSelect}
      className="cursor-pointer rounded-md px-2 py-2 max-lg:px-4"
    >
      <Link href={result.path} prefetch={false} onClick={handleLinkClick}>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p
            title={formatHeadingPath(result.headingPath)}
            className="flex min-w-0 items-baseline gap-1.5 text-sm leading-5"
          >
            {parentHeadings.length > 0 ? (
              <span className="min-w-0 truncate text-foreground-lighter">
                {highlightMatches(`${formatHeadingPath(parentHeadings)} >`, highlightQuery)}
              </span>
            ) : null}
            <span className="max-w-full shrink-0 truncate font-medium text-foreground [&_strong]:font-semibold">
              {highlightMatches(heading, highlightQuery)}
            </span>
          </p>
          {result.excerpt ? (
            <p
              className={cn(
                'line-clamp-2 text-pretty text-sm leading-5 text-foreground-lighter',
                '[&_strong]:font-medium [&_strong]:text-foreground-light'
              )}
            >
              {highlightMatches(result.excerpt, highlightQuery)}
            </p>
          ) : null}
        </div>
      </Link>
    </CommandItem>
  )
}

function getSettledQuery(searchState: DocsSearchV2State): string | null {
  if (searchState.status === 'results' || searchState.status === 'noResults') {
    return searchState.query
  }
  if (searchState.status === 'initial') return ''
  return null
}

function getIsSearching({ searchState, query }: GetIsSearchingParams): boolean {
  if (searchState.status === 'loading') return true
  if (searchState.status === 'error') return false
  const trimmedQuery = query.trim()
  const settledQuery = 'query' in searchState ? searchState.query : null
  return trimmedQuery !== '' && trimmedQuery !== settledQuery
}
