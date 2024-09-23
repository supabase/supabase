'use client'

import { RotateCw, Search, X } from 'lucide-react'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { useEffect, useRef, useState, Suspense, useCallback } from 'react'

import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from '@ui-patterns/multi-select'
import ShimmeringLoader from '@ui-patterns/ShimmeringLoader'
import { Input_Shadcn_, cn, Admonition, Button_Shadcn_ } from 'ui'

import { type ITroubleshootingMetadata } from './Troubleshooting.utils'
import {
  formatError,
  TROUBLESHOOTING_CONTAINER_ID,
  TROUBLESHOOTING_DATA_ATTRIBUTES,
  troubleshootingSearchParams,
} from './Troubleshooting.utils.shared'

function useTroubleshootingSearchState() {
  const [_state, _setState] = useQueryStates(troubleshootingSearchParams)

  const setSelectedProducts = useCallback(
    (products: string[]) => {
      _setState({
        products: products.length === 0 ? null : products,
      })
    },
    [_setState]
  )
  const setSelectedErrorCodes = useCallback(
    (errorCodes: string[]) => {
      _setState({
        errorCodes: errorCodes.length === 0 ? null : errorCodes,
      })
    },
    [_setState]
  )
  const setSelectedTags = useCallback(
    (tags: string[]) => {
      _setState({
        tags: tags.length === 0 ? null : tags,
      })
    },
    [_setState]
  )
  const setSearchState = useCallback(
    (search: string) => {
      _setState({
        search: search.length === 0 ? null : search,
      })
    },
    [_setState]
  )

  const reset = useCallback(() => {
    setSearchState('')
    setSelectedTags([])
    setSelectedProducts([])
    setSelectedErrorCodes([])
  }, [setSearchState, setSelectedTags, setSelectedProducts, setSelectedErrorCodes])

  return {
    selectedProducts: _state.products,
    selectedErrorCodes: _state.errorCodes,
    selectedTags: _state.tags,
    searchState: _state.search,
    setSelectedProducts,
    setSelectedErrorCodes,
    setSelectedTags,
    setSearchState,
    reset,
  }
}

function entryMatchesFilter(
  entry: HTMLElement,
  selectedProducts: string[],
  selectedErrorCodes: string[],
  selectedTags: string[],
  searchState: string
) {
  const content = entry.textContent ?? ''
  const dataKeywords = entry.getAttribute(TROUBLESHOOTING_DATA_ATTRIBUTES.KEYWORDS_LIST_ATTRIBUTE)
  const dataProducts = entry.getAttribute(TROUBLESHOOTING_DATA_ATTRIBUTES.PRODUCTS_LIST_ATTRIBUTE)
  const dataErrors = entry.getAttribute('data-errors')?.split(',') ?? []

  const productsMatch =
    selectedProducts.length === 0 ||
    selectedProducts.some((product) => dataProducts?.includes(product))
  const tagsMatch =
    selectedTags.length === 0 || selectedTags.some((tag) => dataKeywords?.includes(tag))
  const errorsMatch =
    selectedErrorCodes.length === 0 ||
    selectedErrorCodes.some((error) => dataErrors.includes(error))
  const searchMatch =
    searchState === '' || content.toLowerCase().includes(searchState.toLowerCase())

  return productsMatch && errorsMatch && tagsMatch && searchMatch
}

interface TroubleshootingFilterProps {
  products: string[]
  errors: ITroubleshootingMetadata['errors']
  keywords: string[]
  className?: string
}

export function TroubleshootingFilter(props: TroubleshootingFilterProps) {
  return (
    <Suspense fallback={<ShimmeringLoader className="h-7 py-0" />}>
      <TroubleshootingFilterInternal {...props} />
    </Suspense>
  )
}

function TroubleshootingFilterInternal({
  keywords,
  products,
  errors,
  className,
}: TroubleshootingFilterProps) {
  const {
    selectedProducts,
    selectedErrorCodes,
    selectedTags,
    searchState,
    setSelectedProducts,
    setSelectedErrorCodes,
    setSelectedTags,
    setSearchState,
    reset,
  } = useTroubleshootingSearchState()

  const searchInputRef = useRef<HTMLInputElement | null>(null)

  return (
    <>
      <h2 className="sr-only">Search and filter</h2>
      <div className={cn('flex flex-wrap gap-2 items-center', className)}>
        <MultiSelector values={selectedProducts} onValuesChange={setSelectedProducts}>
          <MultiSelectorTrigger>
            <MultiSelectorInput
              placeholder="Products"
              className="placeholder:text-foreground-light"
            />
          </MultiSelectorTrigger>
          <MultiSelectorContent>
            <MultiSelectorList>
              {products.map((product) => (
                <MultiSelectorItem key={product} value={product}>
                  {product}
                </MultiSelectorItem>
              ))}
            </MultiSelectorList>
          </MultiSelectorContent>
        </MultiSelector>
        <MultiSelector values={selectedErrorCodes} onValuesChange={setSelectedErrorCodes}>
          <MultiSelectorTrigger>
            <MultiSelectorInput
              placeholder="Error codes"
              className="placeholder:text-foreground-light"
            />
          </MultiSelectorTrigger>
          <MultiSelectorContent>
            <MultiSelectorList>
              {errors.map((error) => (
                <MultiSelectorItem key={formatError(error)} value={formatError(error)}>
                  {formatError(error)}
                </MultiSelectorItem>
              ))}
            </MultiSelectorList>
          </MultiSelectorContent>
        </MultiSelector>
        <MultiSelector values={selectedTags} onValuesChange={setSelectedTags}>
          <MultiSelectorTrigger>
            <MultiSelectorInput placeholder="Tags" className="placeholder:text-foreground-light" />
          </MultiSelectorTrigger>
          <MultiSelectorContent>
            <MultiSelectorList>
              {keywords.map((keyword) => (
                <MultiSelectorItem key={keyword} value={keyword}>
                  {keyword}
                </MultiSelectorItem>
              ))}
            </MultiSelectorList>
          </MultiSelectorContent>
        </MultiSelector>
        <div className="relative">
          <Input_Shadcn_
            id="troubleshooting-search"
            ref={searchInputRef}
            type="text"
            placeholder="Search by keyword"
            className="pl-8 pr-8 h-[36px] w-60 rounded-lg border-control placeholder:text-foreground-light"
            value={searchState}
            onChange={(e) => setSearchState(e.target.value)}
          />
          <Search
            aria-hidden
            className="absolute left-2 top-1/2 -translate-y-1/2 text-foreground-light"
            size={16}
          />
          {searchState && (
            <button
              className="absolute right-1 top-1/2 -translate-y-1/2 text-foreground-light border hover:border-stronger rounded-md p-1 transition-colors"
              onClick={() => {
                setSearchState('')
                searchInputRef.current?.focus()
              }}
            >
              <span className="sr-only">Clear search</span>
              <X size={16} />
            </button>
          )}
        </div>
        <Button_Shadcn_
          variant="outline"
          className="rounded-lg text-foreground-light h-[36px] w-[36px] p-0"
          onClick={reset}
        >
          <RotateCw size={16} />
          <span className="sr-only">Reset filters</span>
        </Button_Shadcn_>
      </div>
    </>
  )
}

export function TroubleshootingFilterEmptyState() {
  return (
    <Suspense>
      <TroubleshootingFilterEmptyStateInternal />
    </Suspense>
  )
}

function TroubleshootingFilterEmptyStateInternal() {
  const allEntries = useRef<HTMLElement[] | undefined>(undefined)
  const {
    selectedProducts,
    selectedErrorCodes,
    selectedTags,
    searchState,
    setSearchState,
    setSelectedTags,
    setSelectedProducts,
    setSelectedErrorCodes,
    reset,
  } = useTroubleshootingSearchState()

  const [numberResults, setNumberResults] = useState<number | undefined>(undefined)

  useEffect(() => {
    const container = document.getElementById(TROUBLESHOOTING_CONTAINER_ID)
    if (!container) return

    const entries = Array.from(
      container.querySelectorAll(
        `[${TROUBLESHOOTING_DATA_ATTRIBUTES.QUERY_ATTRIBUTE}="${TROUBLESHOOTING_DATA_ATTRIBUTES.QUERY_VALUE_ENTRY}"]`
      )
    ) as HTMLElement[]

    allEntries.current = entries
  }, [])

  useEffect(() => {
    if (!allEntries.current) return

    const numberEntries = allEntries.current.filter((entry) => !entry.hidden).length
    setNumberResults(numberEntries)
  }, [searchState, selectedProducts, selectedErrorCodes, selectedTags])

  return numberResults === 0 ? (
    <span className="flex items-center gap-4 text-foreground-light">
      No results found.
      <Button_Shadcn_ variant="outline" className="flex items-center gap-2" onClick={reset}>
        <RotateCw size={16} /> Reset filters
      </Button_Shadcn_>
    </span>
  ) : null
}

/**
 * This component is used to control the visibility of the list of
 * troubleshooting entries.
 *
 * Filtering is done wth imperative DOM manipulation rather than mapping and
 * filtering the target list in React, in order to opt the full troubleshooting
 * list into server-side rendering.
 */
export function TroubleshootingListController() {
  return (
    <Suspense>
      <TroubleshootingListControllerInternal />
    </Suspense>
  )
}

function TroubleshootingListControllerInternal() {
  const allEntries = useRef<HTMLElement[]>([])

  const { selectedProducts, selectedErrorCodes, selectedTags, searchState } =
    useTroubleshootingSearchState()

  useEffect(() => {
    const container = document.getElementById(TROUBLESHOOTING_CONTAINER_ID)
    if (!container) return

    const entries = Array.from(
      container.querySelectorAll(
        `[${TROUBLESHOOTING_DATA_ATTRIBUTES.QUERY_ATTRIBUTE}="${TROUBLESHOOTING_DATA_ATTRIBUTES.QUERY_VALUE_ENTRY}"]`
      )
    ) as HTMLElement[]
    allEntries.current = entries
  }, [])

  useEffect(() => {
    if (
      !searchState &&
      selectedProducts.length === 0 &&
      selectedErrorCodes.length === 0 &&
      selectedTags.length === 0
    ) {
      allEntries.current.forEach((entry) => {
        entry.hidden = false
      })
    } else {
      allEntries.current.forEach((entry) => {
        entry.hidden = !entryMatchesFilter(
          entry,
          selectedProducts,
          selectedErrorCodes,
          selectedTags,
          searchState
        )
      })
    }
  }, [searchState, selectedProducts, selectedErrorCodes, selectedTags])

  return null
}
