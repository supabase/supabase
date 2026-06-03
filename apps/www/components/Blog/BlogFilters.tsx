'use client'

import type { BlogView } from 'app/blog/BlogClient'
import { LOCAL_STORAGE_KEYS, useBreakpoint } from 'common'
import { motion } from 'framer-motion'
import { startCase } from 'lib/helpers'
import { AlignJustify, ChevronDown, X as CloseIcon, Grid, Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  onFilterChange: (category?: string, search?: string) => void
  view: BlogView
  setView: (view: any) => void
}

/**
 * ✅ search via text input
 * ✅ update searchTerm when deleting text input
 * ✅ search via q param
 * ✅ search via category if no q param
 * ✅ search via category and reset q param if present
 */

function BlogFilters({ onFilterChange, view, setView }: Props) {
  const { BLOG_VIEW } = LOCAL_STORAGE_KEYS
  const isList = view === 'list'
  const [category, setCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [showSearchInput, setShowSearchInput] = useState<boolean>(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams?.get('q')
  const activeCategory = searchParams?.get('category')
  const isMobile = useBreakpoint(1023)

  // Use hard-coded categories here as they:
  // - serve as a reference
  // - are easier to reorder
  const allCategories = [
    'all',
    'product',
    'company',
    'postgres',
    'developers',
    'engineering',
    'launch-week',
  ]

  // Debounced filter change to avoid too many API calls
  const debouncedFilterChange = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (cat: string, search: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          onFilterChange(cat, search)
        }, 300)
      }
    })(),
    [onFilterChange]
  )

  // Handle URL params on mount
  useEffect(() => {
    if (q) {
      setSearchTerm(q)
      onFilterChange(category, q)
    } else if (activeCategory && activeCategory !== 'all') {
      setCategory(activeCategory)
      onFilterChange(activeCategory, '')
    }
  }, []) // Only run on mount

  const handleSearchByText = useCallback(
    (text: string) => {
      setSearchTerm(text)

      // Update URL
      if (text.length > 0) {
        router?.replace(`/blog?q=${text}`, { scroll: false })
      } else {
        router?.replace('/blog', { scroll: false })
      }

      // Trigger filter change (debounced)
      debouncedFilterChange(category, text)
    },
    [category, router, debouncedFilterChange]
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

  const handleSetCategory = useCallback(
    (newCategory: string) => {
      setSearchTerm('')
      setCategory(newCategory)

      // Update URL
      if (newCategory === 'all') {
        router?.replace('/blog', { scroll: false })
      } else {
        router?.replace(`/blog?category=${newCategory}`, { scroll: false })
      }

      // Trigger filter change immediately for category changes
      onFilterChange(newCategory, '')
    },
    [router, onFilterChange]
  )

  const handleSearchChange = useCallback(
    (event: any) => {
      setCategory('all')
      handleSearchByText(event.target.value)
    },
    [handleSearchByText]
  )

  return (
    <div className="flex flex-row items-center justify-between gap-2">
      {!showSearchInput && (
        <div className="flex lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="outline"
                iconRight={<ChevronDown />}
                className="w-full min-w-[200px] flex justify-between items-center py-2"
              >
                {!activeCategory ? 'All Posts' : startCase(activeCategory?.replaceAll('-', ' '))}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start">
              {allCategories.map((category: string, i: number) => (
                <DropdownMenuItem
                  key={`item-${category}-${
                    // biome-ignore lint/suspicious/noArrayIndexKey: to disambiguate emtpy values
                    i
                  }`}
                  onClick={() => handleSetCategory(category)}
                  className={cn(
                    (category === 'all' && !activeCategory) || category === activeCategory
                      ? 'text-brand-600'
                      : ''
                  )}
                >
                  {category === 'all' ? 'All Posts' : startCase(category.replaceAll('-', ' '))}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <div className="hidden lg:flex flex-wrap items-center flex-grow gap-1">
        {allCategories.map((cat: string) => {
          const isActive = (cat === 'all' && !searchTerm && category === 'all') || cat === category
          return (
            <button
              key={cat}
              onClick={() => handleSetCategory(cat)}
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
              <span className="relative z-10">
                {cat === 'all' ? 'All' : startCase(cat.replaceAll('-', ' '))}
              </span>
            </button>
          )
        })}
      </div>

      {!showSearchInput && (
        <div className="flex-1 flex justify-end">
          {' '}
          <Button
            className="px-2 h-full"
            size="medium"
            type="default"
            onClick={() => setShowSearchInput(true)}
          >
            <Search size="14" />
          </Button>
        </div>
      )}

      {showSearchInput && (
        <div className="w-full h-auto flex justify-end gap-2 items-stretch lg:max-w-[240px] xl:max-w-[280px]">
          <InputGroup className="w-full">
            <InputGroupInput
              size="small"
              autoComplete="off"
              type="search"
              placeholder="Search blog"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <InputGroupAddon>
              <Search />
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
      <div className="flex items-center border border-border rounded-full p-0.5 gap-0.5 bg-surface-100">
        {(['list', 'grid'] as BlogView[]).map((v) => (
          <button
            key={v}
            onClick={() => {
              setView(v)
              localStorage.setItem(BLOG_VIEW, v)
            }}
            className={cn(
              'relative flex items-center justify-center w-7 h-7 rounded-full transition-colors',
              view === v ? 'text-foreground' : 'text-foreground-light hover:text-foreground'
            )}
          >
            {view === v && (
              <motion.span
                layoutId="blog-view-bg"
                className="absolute inset-0 rounded-full bg-surface-300 border border-border"
                transition={{ type: 'spring', duration: 0.3, bounce: 0.15 }}
              />
            )}
            <span className="relative z-10">
              {v === 'list' ? (
                <AlignJustify className="w-3.5 h-3.5" />
              ) : (
                <Grid className="w-3.5 h-3.5" />
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default BlogFilters
