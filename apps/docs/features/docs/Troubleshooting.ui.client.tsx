'use client'

import { ChevronDown, RotateCw, Search, X } from 'lucide-react'
import { useQueryStates } from 'nuqs'
import { useEffect, useRef, useState, Suspense, useCallback } from 'react'

import {
  Input_Shadcn_,
  cn,
  Button_Shadcn_,
  Collapsible_Shadcn_ as Collapsible,
  CollapsibleTrigger_Shadcn_ as CollapsibleTrigger,
  CollapsibleContent_Shadcn_ as CollapsibleContent,
} from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'

import { MultiSelect } from '~/components/MultiSelect.client'
import { type ITroubleshootingMetadata } from './Troubleshooting.utils'
import {
  formatError,
  TROUBLESHOOTING_CONTAINER_ID,
  TROUBLESHOOTING_DATA_ATTRIBUTES,
  troubleshootingSearchParams,
} from './Troubleshooting.utils.shared'
import { useBreakpoint } from 'common'

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
      <TroubleshootingFilterMobileCollapsed {...props} />
    </Suspense>
  )
}

function TroubleshootingFilterMobileCollapsed(props: TroubleshootingFilterProps) {
  const isBelowSmallScreen = useBreakpoint('sm')
  const { selectedProducts, selectedErrorCodes, selectedTags, searchState } =
    useTroubleshootingSearchState()

  const numberFiltersApplied =
    (selectedProducts.length > 0 ? 1 : 0) +
    (selectedErrorCodes.length > 0 ? 1 : 0) +
    (selectedTags.length > 0 ? 1 : 0) +
    (searchState ? 1 : 0)

  if (isBelowSmallScreen) {
    return (
      <Collapsible className="border-b">
        <CollapsibleTrigger className="group w-full pb-6 text-foreground-light">
          <div className="flex items-center justify-between gap-2">
            <span>Filters</span>
            <ChevronDown
              size={16}
              className="group-data-[state=open]:rotate-180 transition-transform"
            />
          </div>
          {numberFiltersApplied > 0 && (
            <div className="group-data-[state=open]:hidden text-sm text-left">
              {numberFiltersApplied} filter{numberFiltersApplied > 1 ? 's' : ''} applied
            </div>
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-2">
          <TroubleshootingFilterInternal {...props} />
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return <TroubleshootingFilterInternal {...props} />
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

  const [productsOpen, _setProductsOpen] = useState(false)
  const [errorsOpen, _setErrorsOpen] = useState(false)
  const [tagsOpen, _setTagsOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const allEntries = useRef<HTMLElement[]>([])
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

  const setProductsOpen = useCallback(
    (open: boolean) => {
      _setProductsOpen(open)
      if (open) {
        allEntries.current?.forEach((entry) => (entry.inert = true))
      } else {
        allEntries.current?.forEach((entry) => (entry.inert = false))
      }
    },
    [_setProductsOpen]
  )
  const setErrorsOpen = useCallback(
    (open: boolean) => {
      _setErrorsOpen(open)
      if (open) {
        allEntries.current?.forEach((entry) => (entry.inert = true))
      } else {
        allEntries.current?.forEach((entry) => (entry.inert = false))
      }
    },
    [_setErrorsOpen]
  )
  const setTagsOpen = useCallback(
    (open: boolean) => {
      _setTagsOpen(open)
      if (open) {
        allEntries.current?.forEach((entry) => (entry.inert = true))
      } else {
        allEntries.current?.forEach((entry) => (entry.inert = false))
      }
    },
    [_setTagsOpen]
  )

  const convertToItem = useCallback(
    (arr: string[], { capitalize = false }: { capitalize?: boolean } = {}) =>
      arr.map((item) => ({
        value: item,
        label: capitalize ? item[0].toUpperCase() + item.slice(1) : item,
      })),
    []
  )

  return (
    <>
      <h2 className="sr-only">Search and filter</h2>
      <div className={cn('flex flex-wrap gap-2 items-center', className)}>
        <MultiSelect
          open={productsOpen}
          onOpenChange={setProductsOpen}
          selected={convertToItem(selectedProducts, { capitalize: true })}
          onSelectedChange={(newItemsOrCreateNewItems) => {
            const newItems =
              typeof newItemsOrCreateNewItems === 'function'
                ? newItemsOrCreateNewItems(convertToItem(selectedProducts, { capitalize: true }))
                : newItemsOrCreateNewItems
            setSelectedProducts(newItems.map((item) => item.value))
          }}
        >
          <MultiSelect.Trigger className="w-48" label="Products" />
          <MultiSelect.Content sameWidthAsTrigger>
            {products.map((product) => (
              <MultiSelect.Item
                item={{ value: product, label: product[0].toUpperCase() + product.slice(1) }}
              />
            ))}
          </MultiSelect.Content>
        </MultiSelect>
        <MultiSelect
          open={errorsOpen}
          onOpenChange={setErrorsOpen}
          selected={convertToItem(selectedErrorCodes, { capitalize: true })}
          onSelectedChange={(newItemsOrCreateNewItems) => {
            const newItems =
              typeof newItemsOrCreateNewItems === 'function'
                ? newItemsOrCreateNewItems(convertToItem(selectedErrorCodes, { capitalize: true }))
                : newItemsOrCreateNewItems
            setSelectedErrorCodes(newItems.map((item) => item.value))
          }}
        >
          <MultiSelect.Trigger className="w-48" label="Error codes" />
          <MultiSelect.Content sameWidthAsTrigger>
            {errors.map((error) => (
              <MultiSelect.Item item={{ value: formatError(error), label: formatError(error) }} />
            ))}
          </MultiSelect.Content>
        </MultiSelect>
        <MultiSelect
          open={tagsOpen}
          onOpenChange={setTagsOpen}
          selected={convertToItem(selectedTags, { capitalize: true })}
          onSelectedChange={(newItemsOrCreateNewItems) => {
            const newItems =
              typeof newItemsOrCreateNewItems === 'function'
                ? newItemsOrCreateNewItems(convertToItem(selectedTags, { capitalize: true }))
                : newItemsOrCreateNewItems
            setSelectedTags(newItems.map((item) => item.value))
          }}
        >
          <MultiSelect.Trigger className="w-48" label="Tags" />
          <MultiSelect.Content sameWidthAsTrigger>
            {keywords.map((keyword) => (
              <MultiSelect.Item item={{ value: keyword, label: keyword }} />
            ))}
          </MultiSelect.Content>
        </MultiSelect>
        <div className="relative">
          <Input_Shadcn_
            id="troubleshooting-search"
            ref={searchInputRef}
            type="text"
            placeholder="Search by keyword"
            className="pl-8 pr-8 h-[40px] w-60 rounded-md border-alternative placeholder:text-foreground-light"
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
              className="absolute right-1 top-1/2 -translate-y-1/2 text-foreground-light border-alternative hover:border-stronger rounded-md p-1 transition-colors"
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
          className="rounded-md text-foreground-light h-[40px] w-[40px] p-0"
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
  const { selectedProducts, selectedErrorCodes, selectedTags, searchState, reset } =
    useTroubleshootingSearchState()

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
