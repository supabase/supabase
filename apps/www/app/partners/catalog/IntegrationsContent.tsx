'use client'

import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import Panel from '~/components/Panel'
import { searchCatalogPartners } from '~/lib/marketplaceDb'
import type { Partner } from '~/types/partners'
import { ArrowRight, ArrowUpRight, LayoutGrid, List, Loader, Search } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Badge, Button, Checkbox, cn, InputGroup, InputGroupAddon, InputGroupInput } from 'ui'
import { useDebounce } from 'use-debounce'

interface Props {
  initialPartners: Partner[]
  metaTitle: string
  metaDescription: string
}

type ViewMode = 'grid' | 'list'

export default function IntegrationsContent({
  initialPartners,
  metaTitle,
  metaDescription,
}: Props) {
  const [partners, setPartners] = useState(initialPartners)
  const allCategories = Array.from(
    new Set(initialPartners?.flatMap((p) => p.categories.map((c) => c.name)))
  ).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))

  const [search, setSearch] = useState('')
  const [debouncedSearchTerm] = useDebounce(search, 300)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [partnerOnly, setPartnerOnly] = useState(false)
  const [oneClickOnly, setOneClickOnly] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
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

  const handleCategoryChange = (category: string) =>
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )

  const OFFICIAL_PARTNER_SLUGS = new Set(['grafana', 'stripe', 'aikido', 'doppler', 'resend'])
  const availableInMarketplace = (p: Partner) => p.publishedInMarketplace

  const HAS_ACTIVE_FILTERS =
    search.trim() !== '' || selectedCategories.length > 0 || partnerOnly || oneClickOnly

  const categoryFiltered =
    selectedCategories.length > 0
      ? partners.filter((p) => p.categories.some((c) => selectedCategories.includes(c.name)))
      : partners

  const partnerFiltered = partnerOnly
    ? categoryFiltered.filter((p) => OFFICIAL_PARTNER_SLUGS.has(p.slug))
    : categoryFiltered

  const filtered = oneClickOnly ? partnerFiltered.filter(availableInMarketplace) : partnerFiltered

  const featuredPartners = filtered
    .filter((p) => p.featured)
    .sort((a, b) => {
      if (a.publishedInMarketplace === b.publishedInMarketplace) {
        return a.title.localeCompare(b.title)
      }
      return a.publishedInMarketplace ? -1 : 1
    })
  const listPartners = HAS_ACTIVE_FILTERS
    ? [...filtered.filter((p) => p.featured), ...filtered.filter((p) => !p.featured)]
    : filtered.filter((p) => !p.featured)
  const showFeatured = !HAS_ACTIVE_FILTERS && featuredPartners.length > 0

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
            <Button asChild size="small" className="shrink-0">
              <Link href="/partners#become-a-partner">Become a partner</Link>
            </Button>
          </div>
        </div>

        <div className="relative grid md:grid-cols-4 md:gap-4">
          {/* Left sidebar — sticky search + filters */}
          <div className="relative w-full h-full">
            <div className="mb-4 flex flex-col gap-4 sticky top-20">
              <InputGroup className="w-full">
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
                <InputGroupInput
                  size="small"
                  autoComplete="off"
                  type="search"
                  placeholder="Search partners"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {isSearching && (
                  <InputGroupAddon align="inline-end">
                    <Loader size={14} className="animate-spin" />
                  </InputGroupAddon>
                )}
              </InputGroup>

              <div className="hidden md:flex flex-col gap-4">
                <h2 className="text-sm text-foreground-lighter">Filter by category:</h2>
                <div className="flex flex-col gap-2.5">
                  {allCategories.map((category) => (
                    <div
                      key={category}
                      className="flex items-center gap-2 text-foreground-light hover:text-foreground cursor-pointer! transition-colors"
                    >
                      <Checkbox
                        id={`cat-${category}`}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => handleCategoryChange(category)}
                        className="[&_input]:m-0"
                      />
                      <label
                        htmlFor={`cat-${category}`}
                        className="text-sm leading-none! flex-1 text-left"
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="border-t border-muted pt-4 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-foreground-light hover:text-foreground cursor-pointer! transition-colors">
                    <Checkbox
                      id="partner-only"
                      checked={partnerOnly}
                      onCheckedChange={(checked) => setPartnerOnly(!!checked)}
                      className="[&_input]:m-0"
                    />
                    <label
                      htmlFor="partner-only"
                      className="text-sm leading-none! flex-1 text-left"
                    >
                      Official Partners
                    </label>
                  </div>
                  <div className="flex items-center gap-2 text-foreground-light hover:text-foreground cursor-pointer! transition-colors">
                    <Checkbox
                      id="one-click"
                      checked={oneClickOnly}
                      onCheckedChange={(checked) => setOneClickOnly(!!checked)}
                      className="[&_input]:m-0"
                    />
                    <label htmlFor="one-click" className="text-sm leading-none! flex-1 text-left">
                      Available in Marketplace
                    </label>
                  </div>
                </div>
              </div>

              <Button
                tabIndex={HAS_ACTIVE_FILTERS ? 0 : -1}
                block
                type="dashed"
                onClick={() => {
                  setSelectedCategories([])
                  setPartnerOnly(false)
                  setOneClickOnly(false)
                  setSearch('')
                }}
                className={cn(
                  'opacity-0 transition-opacity hidden md:block',
                  HAS_ACTIVE_FILTERS && 'block! opacity-100'
                )}
              >
                Clear all filters
              </Button>
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
                            className="object-cover"
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
                  onClick={() => setViewMode('grid')}
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
                  onClick={() => setViewMode('list')}
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
                  {listPartners.map((p) => (
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
                            fill
                            className="object-contain p-6 lg:p-10"
                            sizes="(max-width: 768px) 80px, 200px"
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
                  {listPartners.map((p) => (
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
                          className="object-cover"
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
          </div>
        </div>
      </SectionContainer>

      <div className="border-t bg-background">
        <div
          id="become-a-partner"
          className="mx-auto max-w-2xl flex flex-col items-center gap-6 py-32 px-6 text-center"
        >
          <h2 className="h2 text-balance">Interested in adding your product to the catalog?</h2>
          <Button asChild size="medium" iconRight={<ArrowRight />}>
            <Link href="/partners#become-a-partner">Become a partner</Link>
          </Button>
        </div>
      </div>
    </DefaultLayout>
  )
}
