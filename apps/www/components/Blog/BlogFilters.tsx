import { startCase } from 'lodash'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconChevronDown,
  IconSearch,
  IconX,
  Input,
  cn,
} from 'ui'
import { useParams } from '~/hooks/useParams'

import { useBreakpoint } from 'common'
import { AnimatePresence, motion } from 'framer-motion'
import PostTypes from '~/types/post'
import { adaptEventsOfChild } from 'recharts/types/util/types'
import { useSearchParams } from 'next/navigation'

interface Props {
  allPosts: PostTypes[]
  posts: PostTypes[]
  setPosts: (posts: any) => void
}

const MotionButton = motion(Button)

/**
 * ✅ search via text input
 * ✅ update search when deleting text input
 * ✅ search via q param
 * ✅ search via category if no q
 * ✅ search via category and reset q if present
 * */

function BlogFilters({ allPosts, posts, setPosts }: Props) {
  const [category, setCategory] = useState<string>('all')
  const [searchKey, setSearchKey] = useState<string>('')
  const [showSearchInput, setShowSearchInput] = useState<boolean>(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams.get('q')
  const activeCategory = searchParams.get('category')
  const isMobile = useBreakpoint(1023)
  const is2XL = useBreakpoint(1535)

  // Using hard-coded categories as they:
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
    if (!searchKey && category !== 'all') {
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

  useEffect(() => {
    setShowSearchInput(!isMobile)
  }, [isMobile])

  useEffect(() => {
    if (router.isReady && q) {
      setSearchKey(q)
    }
    if (router.isReady && activeCategory && activeCategory !== 'all') {
      setCategory(activeCategory)
    }
  }, [activeCategory, router.isReady, q])

  const handleSearchByText = (text: string) => {
    setSearchKey(text)
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
    searchKey && handlePosts()
    searchKey && setSearchKey('')
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
                    key="custom-expiry"
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
                category === 'all' && !searchKey && !activeCategory
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
          <MotionButton
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.05 } }}
            size="large"
            type="default"
            onClick={() => setShowSearchInput(true)}
          >
            <IconSearch size="tiny" />
          </MotionButton>
        )}

        {showSearchInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.05 } }}
            className="w-full lg:max-w-[240px] xl:max-w-[280px]"
          >
            <Input
              icon={<IconSearch size="tiny" />}
              size="small"
              layout="vertical"
              autoComplete="off"
              type="search"
              placeholder="Search blog"
              value={searchKey}
              onChange={handleSearchChange}
              className="w-full"
              actions={
                isMobile && (
                  <Button
                    type="link"
                    onClick={() => {
                      setSearchKey('')
                      setShowSearchInput(false)
                    }}
                    className="text-foreground-light hover:text-foreground"
                  >
                    <IconX size="tiny" />
                  </Button>
                )
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BlogFilters
