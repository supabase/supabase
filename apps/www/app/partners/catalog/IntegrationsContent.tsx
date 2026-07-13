'use client'

import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import Panel from '~/components/Panel'
import { searchCatalogPartners } from '~/lib/marketplaceDb'
import type { Partner } from '~/types/partners'
import { getCategoryIcon } from 'common/marketplace-categories'
import { useInfiniteScrollWithFetch } from 'hooks/useInfiniteScroll'
import { ArrowRight, ArrowUpRight, Filter, LayoutGrid, List, Loader, Search } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Badge,
  Button,
  Checkbox,
  cn,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from 'ui'
import { useDebounce } from 'use-debounce'

interface Props {
  initialPartners: Partner[]
  metaTitle: string
  metaDescription: string
}

type ViewMode = 'grid' | 'list'

const OFFICIAL_PARTNER_SLUGS = new Set(['grafana', 'stripe', 'aikido', 'doppler', 'resend'])
const PARTNERS_PAGE_SIZE = 24

export default function IntegrationsContent({
  initialPartners,
  metaTitle,
  metaDescription,
}: Props) {
  const [partners, setPartners] = useState(initialPartners)
  // Deduplicate by slug, keep name for display, sort alphabetically.
  const allCategories = Array.from(
    new Map(initialPartners?.flatMap((p) => p.categories).map((c) => [c.slug, c]) ?? []).values()
  ).sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))

  const [{ q: search, cat: selectedCategories, partner: partnerOnly, view: viewMode }, setFilters] =
    useQueryStates(
      {
        q: parseAsString.withDefault(''),
        cat: parseAsArrayOf(parseAsString).withDefault([]),
        partner: parseAsBoolean.withDefault(false),
        view: parseAsStringEnum<ViewMode>(['grid', 'list']).withDefault('grid'),
      },
      { history: 'replace' }
    )

  const [debouncedSearchTerm] = useDebounce(search, 300)
  const [isSearching, setIsSearching] = useState(false)
  const searchIdRef = useRef(0)

  useEffect(() => {
    if (debouncedSearchTerm.trim() === '') {
      setIsSearching(false)
      setPartners(initialPartners)
      return
    }
    setIsSearching(true)
    const currentSearchId = ++searchIdRef.current
    searchCatalogPartners(debouncedSearchTerm)
      .then((results) => {
        if (currentSearchId === searchIdRef.current) setPartners(results ?? [])
      })
      .catch(() => {
        if (currentSearchId === searchIdRef.current) setPartners([])
      })
      .finally(() => {
        if (currentSearchId === searchIdRef.current) setIsSearching(false)
      })
  }, [debouncedSearchTerm, initialPartners])

  // selectedCategories holds slugs; toggle by slug
  const handleCategoryChange = (slug: string) =>
    setFilters({
      cat: selectedCategories.includes(slug)
        ? selectedCategories.filter((s) => s !== slug)
        : [...selectedCategories, slug],
    })

  const HAS_ACTIVE_FILTERS = search.trim() !== '' || selectedCategories.length > 0 || partnerOnly
  const activeFilterCount = selectedCategories.length + (partnerOnly ? 1 : 0)

  const filtered = useMemo(() => {
    const categoryFiltered =
      selectedCategories.length > 0
        ? partners.filter((p) => p.categories.some((c) => selectedCategories.includes(c.slug)))
        : partners

    return partnerOnly
      ? categoryFiltered.filter((p) => OFFICIAL_PARTNER_SLUGS.has(p.slug))
      : categoryFiltered
  }, [partners, selectedCategories, partnerOnly])

  const featuredPartners = useMemo(
    () => filtered.filter((p) => p.featured).sort((a, b) => a.title.localeCompare(b.title)),
    [filtered]
  )
  const listPartners = useMemo(
    () =>
      HAS_ACTIVE_FILTERS
        ? [...filtered.filter((p) => p.featured), ...filtered.filter((p) => !p.featured)]
        : filtered.filter((p) => !p.featured),
    [filtered, HAS_ACTIVE_FILTERS]
  )
  const showFeatured = !HAS_ACTIVE_FILTERS && featuredPartners.length > 0

  // Only render the first page of the (already-fetched, in-memory) partner list up front,
  // then reveal more as the sentinel below the grid/list scrolls into view — avoids mounting
  // every partner card (and its logo <Image>) on initial load.
  const initialVisiblePartners = useMemo(
    () => listPartners.slice(0, PARTNERS_PAGE_SIZE),
    [listPartners]
  )
  const fetchMoreVisiblePartners = useCallback(
    async (offset: number, limit: number) => listPartners.slice(offset, offset + limit),
    [listPartners]
  )
  const {
    items: visiblePartners,
    hasMore: hasMorePartners,
    loadMoreRef: partnersLoadMoreRef,
  } = useInfiniteScrollWithFetch({
    initialItems: initialVisiblePartners,
    totalItems: listPartners.length,
    pageSize: PARTNERS_PAGE_SIZE,
    fetchMore: fetchMoreVisiblePartners,
  })

  // Shared filter UI — rendered in both the desktop sidebar and the mobile bottom sheet.
  // Uses wrapping <label> elements (no id/htmlFor) to avoid duplicate HTML IDs in the DOM.
  const filtersPanel = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2.5">
        <h2 className="text-xs font-mono uppercase text-foreground-lighter">Categories</h2>
        {allCategories.map((category) => {
          const Icon = getCategoryIcon(category.slug)
          return (
            <label
              key={category.slug}
              className="flex cursor-pointer items-center justify-between gap-3 text-foreground-light transition-colors hover:text-foreground"
            >
              <span className="flex flex-1 items-center gap-2 text-sm text-left">
                <Icon size={13} className="shrink-0 text-foreground-lighter" />
                {category.name}
              </span>
              <Checkbox
                checked={selectedCategories.includes(category.slug)}
                onCheckedChange={() => handleCategoryChange(category.slug)}
                className="[&_input]:m-0"
              />
            </label>
          )
        })}
      </div>

      {HAS_ACTIVE_FILTERS && (
        <Button
          block
          variant="dashed"
          onClick={() => setFilters({ cat: [], partner: false, q: '' })}
        >
          Clear all filters
        </Button>
      )}
    </div>
  )

  return (
    <DefaultLayout>
      <SectionContainer>
        <div className="flex flex-col gap-3 mb-8">
          <span className="text-brand font-mono uppercase tracking-widest text-sm">
            Partner Catalog
          </span>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex flex-col gap-3">
              <h1 className="h1 mb-0!">{metaTitle}</h1>
              <p className="text-foreground-lighter text-xl max-w-2xl text-balance">
                {metaDescription}
              </p>
            </div>
            <Button asChild size="tiny" className="shrink-0">
              <Link href="https://forms.supabase.com/partner">Apply as a Partner</Link>
            </Button>
          </div>
        </div>

        <div className="relative grid md:grid-cols-4 md:gap-4">
          {/* Left sidebar — sticky search + filters */}
          <div className="relative w-full h-full">
            <div className="mb-4 flex flex-col gap-4 sticky top-20">
              {/* Search bar + mobile filter trigger */}
              <div className="flex gap-2">
                <InputGroup className="flex-1">
                  <InputGroupAddon>
                    <Search />
                  </InputGroupAddon>
                  <InputGroupInput
                    size="small"
                    autoComplete="off"
                    type="search"
                    placeholder="Search partners"
                    value={search}
                    onChange={(e) => setFilters({ q: e.target.value })}
                  />
                  {isSearching && (
                    <InputGroupAddon align="inline-end">
                      <Loader size={14} className="animate-spin" />
                    </InputGroupAddon>
                  )}
                </InputGroup>

                {/* Mobile-only: opens bottom sheet with filters */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="default" size="small" className="shrink-0 md:hidden flex">
                      <div className="flex gap-1.5 items-center text-foreground-lighter hover:text-foreground">
                        <Filter size={14} />
                        {activeFilterCount > 0 && (
                          <span className="flex items-center justify-center text-xs text-foreground-light">
                            {activeFilterCount}
                          </span>
                        )}
                      </div>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="flex h-screen max-h-[85dvh] flex-col">
                    <SheetHeader className="px-4 py-3.5">
                      <SheetTitle className="text-sm text-left">Filter partners</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto p-4">{filtersPanel}</div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Desktop-only filter panel */}
              <div className="hidden md:block">{filtersPanel}</div>
            </div>
          </div>

          {/* Right: content */}
          <div className="md:col-span-3 min-w-0 flex flex-col gap-4 md:gap-6">
            {/* Featured partners */}
            {showFeatured && (
              <div className="flex flex-col gap-4">
                <h2 className="text-2xl">Featured</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredPartners.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/partners/catalog/${p.slug}`}
                      className="group flex h-full flex-col gap-3 rounded-xl border bg-surface-100 p-5 transition-colors hover:bg-surface-200 overflow-hidden"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 rounded-full overflow-hidden bg-muted">
                          <Image
                            src={p.logo}
                            alt={p.title}
                            fill
                            className="object-cover bg-white rounded-full overflow-hidden p-1"
                            sizes="40px"
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <h3 className="text-foreground text-base font-medium tracking-tight">
                            {p.title}
                          </h3>
                        </div>
                      </div>
                      <p className="text-foreground-lighter text-sm line-clamp-3 text-pretty">
                        {p.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-1">
                        {p.categories.map((c) => (
                          <Badge key={c.name}>{c.name}</Badge>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Toolbar: count + view toggle */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-foreground-muted text-xs">
                {listPartners.length} partner{listPartners.length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center rounded-lg border border-muted">
                <button
                  title="Grid view"
                  onClick={() => setFilters({ view: 'grid' })}
                  className={cn(
                    'relative flex items-center justify-center w-8 h-8 transition-colors rounded-l-lg focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground-lighter focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                    viewMode === 'grid'
                      ? 'bg-surface-300 text-foreground'
                      : 'bg-surface-75 text-foreground-muted hover:text-foreground hover:bg-surface-200'
                  )}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  title="List view"
                  onClick={() => setFilters({ view: 'list' })}
                  className={cn(
                    'relative flex items-center justify-center w-8 h-8 transition-colors border-l border-muted rounded-r-lg focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground-lighter focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                    viewMode === 'list'
                      ? 'bg-surface-300 text-foreground'
                      : 'bg-surface-75 text-foreground-muted hover:text-foreground hover:bg-surface-200'
                  )}
                >
                  <List size={14} />
                </button>
              </div>
            </div>

            {/* Grid view */}
            {viewMode === 'grid' &&
              (listPartners.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                  {visiblePartners.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/partners/catalog/${p.slug}`}
                      className="flex flex-col justify-start items-stretch group cursor-pointer transition rounded-xl focus-visible:ring-2 focus-visible:ring-foreground-lighter outline-hidden outline-0 focus-visible:outline-4 focus-visible:outline-offset-1 focus-visible:outline-foreground-lighter"
                    >
                      <Panel
                        hasActiveOnHover
                        outerClassName="h-full"
                        innerClassName="flex md:flex-col gap-3 sm:gap-2 h-full items-start p-2"
                      >
                        <div className="relative rounded-lg min-h-[80px] max-h-[80px] md:max-h-[140px] h-full md:h-auto aspect-square md:w-full md:aspect-video! bg-alternative flex items-center justify-center shadow-inner border border-muted overflow-hidden shrink-0 md:shrink">
                          <Image
                            src={p.logo}
                            alt={p.title}
                            width={60}
                            height={60}
                            className="border w-14 h-14 aspect-square p-1 bg-white rounded-full overflow-hidden"
                            sizes="60px"
                          />
                        </div>
                        <div className="md:p-2 md:pt-1 flex flex-col h-full md:h-auto grow gap-0.5 md:gap-1.5 justify-center md:justify-start min-w-0">
                          <h3 className="text-sm md:text-base text-foreground leading-5!">
                            {p.title}
                          </h3>
                          <p className="text-foreground-light text-sm line-clamp-2 flex-1">
                            {p.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {p.categories.map((c) => (
                              <Badge key={c.name}>{c.name}</Badge>
                            ))}
                          </div>
                        </div>
                      </Panel>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-foreground-lighter text-sm">
                  No partners found with these filters.
                </p>
              ))}

            {/* List view */}
            {viewMode === 'list' &&
              (listPartners.length ? (
                <div className="border bg-background rounded-xl overflow-hidden divide-y">
                  {visiblePartners.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/partners/catalog/${p.slug}`}
                      className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-100"
                    >
                      <div className="relative size-10 shrink-0 rounded-full overflow-hidden bg-muted">
                        <Image
                          src={p.logo}
                          alt={p.title}
                          fill
                          className="object-cover bg-white rounded-full overflow-hidden p-1"
                          sizes="40px"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-foreground text-sm font-medium tracking-tight">
                            {p.title}
                          </span>
                          <div className="flex items-center gap-1">
                            {p.categories.map((c) => (
                              <Badge key={c.name}>{c.name}</Badge>
                            ))}
                          </div>
                        </div>
                        <p className="text-foreground-lighter text-sm truncate">{p.description}</p>
                      </div>
                      <ArrowUpRight
                        size={16}
                        className="shrink-0 text-foreground-lighter transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-foreground-lighter text-sm">
                  No partners found with these filters.
                </p>
              ))}

            {hasMorePartners && (
              <div
                ref={partnersLoadMoreRef}
                className="flex justify-center py-4"
                aria-hidden="true"
              >
                <Loader size={16} className="animate-spin text-foreground-lighter" />
              </div>
            )}
          </div>
        </div>
      </SectionContainer>

      <div className="border-t bg-background">
        <div
          id="become-a-partner"
          className="mx-auto max-w-2xl flex flex-col items-center gap-6 py-32 px-6 text-center"
        >
          <h2 className="h2 text-balance">Interested in partnering with Supabase?</h2>
          <Button asChild size="medium" iconRight={<ArrowRight />}>
            <Link href="https://forms.supabase.com/partner">Apply as a Partner</Link>
          </Button>
        </div>
      </div>
    </DefaultLayout>
  )
}
