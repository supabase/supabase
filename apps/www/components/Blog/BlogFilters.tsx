'use client'

import { LOCAL_STORAGE_KEYS, useBreakpoint } from 'common'
import { startCase } from 'lib/helpers'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/compat/router'
import { useEffect, useState } from 'react'
import type { BlogView } from 'app/blog/BlogClient'
import type PostTypes from 'types/post'

import { AlignJustify, ChevronDown, Grid, Search, X as CloseIcon } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  cn,
} from 'ui'

interface Props {
  allPosts: PostTypes[]
  setPosts: (posts: any) => void
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

function BlogFilters({ allPosts, setPosts, view, setView }: Props) {
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
  const is2XL = useBreakpoint(1535)

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

  useEffect(() => {
    if (!q) {
      handlePosts()
    }
  }, [category])

  useEffect(() => {
    if (q) {
      handleSearchByText(q)
    }
  }, [q])

  const handleReplaceRouter = () => {
    if (!searchTerm && category !== 'all' && router) {
      router.query.category = category
      router?.replace(router, undefined, { shallow: true, scroll: false })
    }
  }

  const handlePosts = () => {
    // construct an array of blog posts
    // not inluding the first blog post
    const shiftedBlogs = [...allPosts]
    shiftedBlogs.shift()

    handleReplaceRouter()

    setPosts(
      category === 'all'
        ? shiftedBlogs
        : allPosts.filter((post: any) => {
            const found = post.categories?.includes(category)
            return found
          })
    )
  }

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

  useEffect(() => {
    if (router?.isReady && q) {
      setSearchTerm(q)
    }
    if (router?.isReady && activeCategory && activeCategory !== 'all') {
      setCategory(activeCategory)
    }
  }, [activeCategory, router?.isReady, q])

  function handleSearchByText(text: string) {
    setSearchTerm(text)
    searchParams?.has('q') && router?.replace('/blog', undefined, { shallow: true, scroll: false })
    router?.replace(`/blog?q=${text}`, undefined, { shallow: true, scroll: false })
    if (text.length < 1) router?.replace('/blog', undefined, { shallow: true, scroll: false })

    const matches = allPosts.filter((post: any) => {
      const found =
        post.tags?.join(' ').replaceAll('-', ' ').includes(text.toLowerCase()) ||
        post.title?.toLowerCase().includes(text.toLowerCase()) ||
        post.author?.includes(text.toLowerCase())
      return found
    })

    setPosts(matches)
  }

  const handleSetCategory = (category: string) => {
    searchTerm && handlePosts()
    searchTerm && setSearchTerm('')
    setCategory(category)
    category === 'all'
      ? router?.replace('/blog', undefined, { shallow: true, scroll: false })
      : router?.replace(`/blog?category=${category}`, undefined, {
          shallow: true,
          scroll: false,
        })
  }

  const handleSearchChange = (event: any) => {
    activeCategory && setCategory('all')
    handleSearchByText(event.target.value)
  }

  const handleViewSelection = () => {
    setView((prevView: 'list' | 'grid') => {
      const newValue = prevView === 'list' ? 'grid' : 'list'
      localStorage.setItem(BLOG_VIEW, newValue)

      return newValue
    })
  }

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
      <div className="hidden lg:flex flex-wrap items-center flex-grow gap-2">
        {allCategories.map((category: string) => (
          <Button
            key={category}
            type={
              category === 'all' && !searchTerm && !activeCategory
                ? 'default'
                : category === activeCategory
                  ? 'default'
                  : 'outline'
            }
            onClick={() => handleSetCategory(category)}
            size={is2XL ? 'tiny' : 'small'}
            className="rounded-full"
          >
            {category === 'all' ? 'All' : startCase(category.replaceAll('-', ' '))}
          </Button>
        ))}
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
          <Input
            icon={<Search size="14" />}
            size="small"
            layout="vertical"
            autoComplete="off"
            type="search"
            placeholder="Search blog"
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full"
            actions={
              isMobile && (
                <Button
                  type="link"
                  onClick={() => {
                    setSearchTerm('')
                    setShowSearchInput(false)
                  }}
                  className="text-foreground-light hover:text-foreground hover:bg-selection"
                >
                  <CloseIcon size="14" />
                </Button>
              )
            }
          />
        </div>
      )}
      <Button
        type="default"
        title={isList ? 'Grid View' : 'List View'}
        onClick={handleViewSelection}
        className="h-full p-2 text-foreground-light"
      >
        {isList ? (
          <Grid className="w-4 h-4 stroke-1.5" />
        ) : (
          <AlignJustify className="w-4 h-4 stroke-1.5" />
        )}
      </Button>
    </div>
  )
}

export default BlogFilters
