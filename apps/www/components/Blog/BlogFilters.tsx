'use client'

import { type BlogView } from 'app/blog/blog-view'
import { useBreakpoint } from 'common'
import BlogViewToggle from 'components/Blog/BlogViewToggle'
import { motion } from 'framer-motion'
import { startCase } from 'lib/helpers'
import { ChevronDown, X as CloseIcon, Search } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from 'ui'

interface Props {
  view: BlogView
  setView: (view: any) => void
  /**
   * Blog index search: keeps the query in the URL (`?q=`) and filters the full
   * post set client-side via the index's fetch logic.
   */
  onFilterChange?: (category?: string, search?: string) => void
  /**
   * Category-page search: filters the in-memory posts for the current category.
   * No URL sync / fetch. Mutually exclusive with `onFilterChange`.
   */
  onSearch?: (term: string) => void
}

// Hard-coded so they can be curated/reordered. Each (except "all") maps to a
// statically generated /blog/categories/<category> page, so selecting a
// category is a navigation (prefetched, no client fetch / skeleton flash).
const allCategories = [
  'all',
  'product',
  'company',
  'postgres',
  'developers',
  'engineering',
  'launch-week',
]

const categoryHref = (category: string) =>
  category === 'all' ? '/blog' : `/blog/categories/${category}`

const categoryLabel = (category: string) =>
  category === 'all' ? 'All' : startCase(category.replaceAll('-', ' '))

function BlogFilters({ view, setView, onFilterChange, onSearch }: Props) {
  const showSearch = Boolean(onFilterChange) || Boolean(onSearch)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [showSearchInput, setShowSearchInput] = useState<boolean>(false)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const q = searchParams?.get('q')
  const isMobile = useBreakpoint(1023)

  // Active category is derived from the URL: /blog or /blog/categories/<cat>.
  const categoryMatch = pathname?.match(/^\/blog\/categories\/([^/]+)/)
  const activeCategory = categoryMatch?.[1] ?? 'all'

  // Debounced search to avoid too many API calls
  const debouncedFilterChange = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (search: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          onFilterChange?.(undefined, search)
        }, 300)
      }
    })(),
    [onFilterChange]
  )

  // Reflect ?q= deep links into the search state on mount (index only)
  useEffect(() => {
    if (onFilterChange && q) {
      setSearchTerm(q)
      onFilterChange(undefined, q)
    }
  }, []) // Only run on mount

  const handleSearchByText = useCallback(
    (text: string) => {
      setSearchTerm(text)

      if (onFilterChange) {
        // Index: keep the query in the URL and filter the full list (debounced).
        router?.replace(text.length > 0 ? `/blog?q=${encodeURIComponent(text)}` : '/blog', {
          scroll: false,
        })
        debouncedFilterChange(text)
      } else {
        // Category: filter the in-memory posts; no URL change.
        onSearch?.(text)
      }
    },
    [router, debouncedFilterChange, onFilterChange, onSearch]
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSearchByText('')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleSearchByText])

  useEffect(() => {
    setShowSearchInput(!isMobile)
  }, [isMobile])

  return (
    <div className="flex flex-row items-center justify-between gap-2">
      {/* Mobile: category dropdown (hidden on lg+) */}
      {!showSearchInput && (
        <div className="flex lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                iconRight={<ChevronDown />}
                className="w-full min-w-[200px] flex justify-between items-center py-2"
              >
                {activeCategory === 'all' ? 'All Posts' : categoryLabel(activeCategory)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start">
              {allCategories.map((category) => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => router.push(categoryHref(category))}
                  className={cn(category === activeCategory ? 'text-brand-600' : '')}
                >
                  {category === 'all' ? 'All Posts' : categoryLabel(category)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Desktop: category pills */}
      <div className="hidden lg:flex flex-wrap items-center grow gap-1">
        {allCategories.map((category) => {
          const isActive = category === activeCategory
          return (
            <Link
              key={category}
              href={categoryHref(category)}
              aria-label={
                category === 'all'
                  ? 'Show all blog posts'
                  : `Filter blog posts by category: ${categoryLabel(category)}`
              }
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative px-3 py-1.5 text-sm rounded-full transition-colors',
                isActive ? 'text-foreground' : 'text-foreground-lighter hover:text-foreground-light'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="blog-cat-bg"
                  className="absolute inset-0 rounded-full bg-surface-300 border border-border"
                  transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
                />
              )}
              <span className="relative z-10">{categoryLabel(category)}</span>
            </Link>
          )
        })}
      </div>

      {/* Search (index only) */}
      {showSearch && !showSearchInput && (
        <div className="flex-1 flex justify-end">
          <Button
            className="px-2 h-full"
            size="medium"
            variant="default"
            aria-label="Search posts"
            onClick={() => setShowSearchInput(true)}
          >
            <Search size="14" aria-hidden="true" />
          </Button>
        </div>
      )}

      {showSearch && showSearchInput && (
        <div className="w-full h-auto flex justify-end gap-2 items-stretch lg:max-w-[240px] xl:max-w-[280px]">
          <InputGroup className="w-full">
            <InputGroupInput
              size="small"
              autoComplete="off"
              type="search"
              placeholder="Search blog"
              value={searchTerm}
              onChange={(event) => handleSearchByText(event.target.value)}
            />
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
            {isMobile && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  onClick={() => {
                    setSearchTerm('')
                    setShowSearchInput(false)
                  }}
                >
                  <CloseIcon size="14" />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
        </div>
      )}

      {/* View toggle */}
      <BlogViewToggle view={view} setView={setView} />
    </div>
  )
}

export default BlogFilters
