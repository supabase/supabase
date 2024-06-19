import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { startCase } from 'lodash'
import { useKey } from 'react-use'
import { LOCAL_STORAGE_KEYS, useBreakpoint } from 'common'
import type PostTypes from '~/types/post'
import type { BlogView } from '~/pages/blog'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconAlignJustify,
  IconChevronDown,
  IconGrid,
  IconSearch,
  IconX,
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
  const q = searchParams.get('q')
  const activeCategory = searchParams.get('category')
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
    if (!searchTerm && category !== 'all') {
      router.query.category = category
      router.replace(router, undefined, { shallow: true, scroll: false })
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

  useKey('Escape', () => handleSearchByText(''))

  useEffect(() => {
    setShowSearchInput(!isMobile)
  }, [isMobile])

  useEffect(() => {
    if (router.isReady && q) {
      setSearchTerm(q)
    }
    if (router.isReady && activeCategory && activeCategory !== 'all') {
      setCategory(activeCategory)
    }
  }, [activeCategory, router.isReady, q])

  const handleSearchByText = (text: string) => {
    setSearchTerm(text)
    searchParams.has('q') && router.replace('/blog', undefined, { shallow: true, scroll: false })
    router.replace(`/blog?q=${text}`, undefined, { shallow: true, scroll: false })
    if (text.length < 1) router.replace('/blog', undefined, { shallow: true, scroll: false })

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
      ? router.replace('/blog', undefined, { shallow: true, scroll: false })
      : router.replace(`/blog?category=${category}`, undefined, {
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
      <AnimatePresence mode="wait">
        {!showSearchInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.05 } }}
            className="flex lg:hidden"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="outline"
                  iconRight={<IconChevronDown />}
                  className="w-full min-w-[200px] flex justify-between items-center py-2"
                >
                  {!activeCategory ? 'All Posts' : startCase(activeCategory?.replaceAll('-', ' '))}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="start">
                {allCategories.map((category: string) => (
                  <DropdownMenuItem
                    key={`item-${category}`}
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
          </motion.div>
        )}
        <div className="hidden lg:flex flex-wrap items-center flex-grow gap-2">
          {allCategories.map((category: string) => (
            <Button
              key={category}
              type={
                category === 'all' && !searchTerm && !activeCategory
                  ? 'alternative'
                  : category === activeCategory
                    ? 'alternative'
                    : 'outline'
              }
              onClick={() => handleSetCategory(category)}
              size={is2XL ? 'tiny' : 'small'}
            >
              {category === 'all' ? 'All' : startCase(category.replaceAll('-', ' '))}
            </Button>
          ))}
        </div>

        {!showSearchInput && (
          <motion.div
            className="flex-1 flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.05 } }}
          >
            <Button
              className="px-2"
              size="large"
              type="default"
              onClick={() => setShowSearchInput(true)}
            >
              <IconSearch size="tiny" />
            </Button>
          </motion.div>
        )}

        {showSearchInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.05 } }}
            className="w-full h-auto flex justify-end gap-2 items-stretch lg:max-w-[240px] xl:max-w-[280px]"
          >
            <Input
              icon={<IconSearch size="tiny" />}
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
                    <IconX size="tiny" />
                  </Button>
                )
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
      <Button
        type="default"
        title={isList ? 'Grid View' : 'List View'}
        onClick={handleViewSelection}
        className="h-full p-1.5"
      >
        {isList ? <IconGrid /> : <IconAlignJustify />}
      </Button>
    </div>
  )
}

export default BlogFilters
