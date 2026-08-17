'use client'

import { useBreakpoint } from 'common'
import { ChevronDown, RotateCw, Search, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useQueryStates } from 'nuqs'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Button_Shadcn_,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { MultiSelector } from 'ui-patterns/multi-select'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { type ITroubleshootingMetadata } from './Troubleshooting.utils'
import {
  serializeTroubleshootingSearchParams,
  TROUBLESHOOTING_CONTAINER_ID,
  TROUBLESHOOTING_DATA_ATTRIBUTES,
  troubleshootingEntryMatchesFilter,
  troubleshootingSearchParams,
  type TroubleshootingGroupBy,
} from './Troubleshooting.utils.shared'

function useTroubleshootingSearchState() {
  const [_state, _setState] = useQueryStates(troubleshootingSearchParams)

  const setSelectedProducts = useCallback(
    (products: string[]) => {
      _setState({
        products: products.length === 0 ? [] : products,
      })
    },
    [_setState]
  )
  const setSelectedErrorCodes = useCallback(
    (errorCodes: string[]) => {
      _setState({
        errorCodes: errorCodes.length === 0 ? [] : errorCodes,
      })
    },
    [_setState]
  )
  const setSelectedTags = useCallback(
    (tags: string[]) => {
      _setState({
        tags: tags.length === 0 ? [] : tags,
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

function getTroubleshootingEntries() {
  const container = document.getElementById(TROUBLESHOOTING_CONTAINER_ID)
  if (!container) return

  return Array.from(
    container.querySelectorAll(
      `[${TROUBLESHOOTING_DATA_ATTRIBUTES.QUERY_ATTRIBUTE}="${TROUBLESHOOTING_DATA_ATTRIBUTES.QUERY_VALUE_ENTRY}"]`
    )
  ) as HTMLElement[]
}

interface TroubleshootingFilterProps {
  className?: string
  products?: string[]
  errors: ITroubleshootingMetadata['errors']
  keywords: string[]
  enableGroupBy?: boolean
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
            <ChevronDown size={16} className="group-data-open:rotate-180 transition-transform" />
          </div>
          {numberFiltersApplied > 0 && (
            <div className="group-data-open:hidden text-sm text-left">
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
  enableGroupBy,
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

  const allErrorCodes: string[] = useMemo(
    () =>
      Array.from(
        new Set(
          errors?.flatMap((error) => {
            const result: string[] = []
            if (error.http_status_code) {
              result.push(String(error.http_status_code))
            }
            if (error.code) {
              result.push(error.code)
            }
            return result
          }) ?? []
        )
      ),
    [errors]
  )

  return (
    <>
      <h2 className="sr-only">Search and filter</h2>
      <div className={cn('flex flex-nowrap gap-2 items-center w-full', className)}>
        {!!products && (
          <MultiSelector
            className="min-w-0 flex-1 w-full"
            values={selectedProducts}
            onValuesChange={setSelectedProducts}
          >
            <MultiSelector.Trigger badgeLimit={1} className="w-full min-w-0" label="Products" />
            <MultiSelector.Content>
              <MultiSelector.List>
                {products?.map((product) => (
                  <MultiSelector.Item key={`product-${product}`} value={product}>
                    {product}
                  </MultiSelector.Item>
                ))}
              </MultiSelector.List>
            </MultiSelector.Content>
          </MultiSelector>
        )}
        <MultiSelector
          className="min-w-0 flex-1 w-full"
          values={selectedErrorCodes}
          onValuesChange={setSelectedErrorCodes}
        >
          <MultiSelector.Trigger badgeLimit={1} className="w-full min-w-0" label="Error codes" />
          <MultiSelector.Content>
            <MultiSelector.List>
              {allErrorCodes.map((error) => (
                <MultiSelector.Item key={`error-${error}`} value={error}>
                  {error}
                </MultiSelector.Item>
              ))}
            </MultiSelector.List>
          </MultiSelector.Content>
        </MultiSelector>
        <MultiSelector
          className="min-w-0 flex-1 w-full"
          values={selectedTags}
          onValuesChange={setSelectedTags}
        >
          <MultiSelector.Trigger badgeLimit={1} className="w-full min-w-0" label="Tags" />
          <MultiSelector.Content>
            <MultiSelector.List>
              {keywords?.map((keyword) => (
                <MultiSelector.Item key={`keyword-${keyword}`} value={keyword}>
                  {keyword}
                </MultiSelector.Item>
              ))}
            </MultiSelector.List>
          </MultiSelector.Content>
        </MultiSelector>
        <div className="relative min-w-0 flex-1">
          <Input
            id="troubleshooting-search"
            ref={searchInputRef}
            type="text"
            placeholder="Search by keyword"
            className="pl-8 pr-8 h-[40px] w-full rounded-md border-alternative placeholder:text-foreground-light"
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
              tabIndex={0}
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
          className="rounded-md text-foreground-light h-[40px] w-[40px] p-0 shrink-0"
          onClick={reset}
        >
          <RotateCw size={16} />
          <span className="sr-only">Reset filters</span>
        </Button_Shadcn_>
        {enableGroupBy && <TroubleshootingGroupByControl />}
      </div>
    </>
  )
}

function TroubleshootingGroupByControl() {
  const router = useRouter()
  const pathname = usePathname()
  const [state] = useQueryStates(troubleshootingSearchParams)

  function setGroup(group: TroubleshootingGroupBy) {
    router.push(
      serializeTroubleshootingSearchParams(`${pathname}${window.location.search}`, { group })
    )
  }

  const selectedGroup: TroubleshootingGroupBy = state.group === 'type' ? 'type' : 'product'

  return (
    <div className="min-w-0 flex-1">
      <Select
        value={selectedGroup}
        onValueChange={(value) => setGroup(value as TroubleshootingGroupBy)}
      >
        <SelectTrigger
          aria-label="Group by"
          className="w-full h-[40px] rounded-md border-alternative text-foreground-light"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="product">Group by product</SelectItem>
          <SelectItem value="type">Group by type</SelectItem>
        </SelectContent>
      </Select>
    </div>
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
  const { selectedProducts, selectedErrorCodes, selectedTags, searchState, reset } =
    useTroubleshootingSearchState()

  const [numberResults, setNumberResults] = useState<number | undefined>(undefined)

  useEffect(() => {
    const updateResultCount = () => {
      const entries = getTroubleshootingEntries()
      if (!entries) return

      const numberEntries = entries.filter((entry) =>
        troubleshootingEntryMatchesFilter(
          entry,
          selectedProducts,
          selectedErrorCodes,
          selectedTags,
          searchState
        )
      ).length
      setNumberResults(numberEntries)
    }

    updateResultCount()
    const observer = new MutationObserver(updateResultCount)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
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
  const { selectedProducts, selectedErrorCodes, selectedTags, searchState } =
    useTroubleshootingSearchState()

  useEffect(() => {
    const updateEntryVisibility = () => {
      const entries = getTroubleshootingEntries()
      if (!entries) return

      if (
        !searchState &&
        selectedProducts.length === 0 &&
        selectedErrorCodes.length === 0 &&
        selectedTags.length === 0
      ) {
        entries.forEach((entry) => {
          entry.hidden = false
        })
      } else {
        entries.forEach((entry) => {
          entry.hidden = !troubleshootingEntryMatchesFilter(
            entry,
            selectedProducts,
            selectedErrorCodes,
            selectedTags,
            searchState
          )
        })
      }

      const groups = document.querySelectorAll<HTMLElement>(
        `[${TROUBLESHOOTING_DATA_ATTRIBUTES.GROUP_ATTRIBUTE}]`
      )
      groups.forEach((group) => {
        const groupEntries = group.querySelectorAll<HTMLElement>(
          `[${TROUBLESHOOTING_DATA_ATTRIBUTES.QUERY_ATTRIBUTE}="${TROUBLESHOOTING_DATA_ATTRIBUTES.QUERY_VALUE_ENTRY}"]`
        )
        group.hidden = Array.from(groupEntries).every((entry) => entry.hidden)
      })
    }

    updateEntryVisibility()
    const observer = new MutationObserver(updateEntryVisibility)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [searchState, selectedProducts, selectedErrorCodes, selectedTags])

  return null
}
