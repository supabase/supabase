import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { startCase } from 'lodash'
import { useKey } from 'react-use'
import { useBreakpoint } from 'common'
import type PostTypes from '~/types/post'

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

interface Props {
  allEvents: PostTypes[]
  events?: PostTypes[]
  setEvents: (posts: any) => void
}

/**
 * search via category if no q param
 * search via category and reset q param if present
 */

function EventFilters({ allEvents, events, setEvents }: Props) {
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
  const allCategories = ['all', 'webinar', 'talk', 'hackathon', 'meetup']

  useEffect(() => {
    if (!q) {
      console.log('useEffect handlePosts', events)
      handlePosts()
    }
  }, [category])

  useEffect(() => {
    if (q) {
      handleSearchByText(q)
    }
  }, [q])

  const handleReplaceRouter = () => {
    console.log('handleReplaceRouter', events)
    if (!searchTerm && category !== 'all') {
      router.query.category = category
      router.replace(router, undefined, { shallow: true, scroll: false })
    }
  }

  const handlePosts = () => {
    console.log('handlePosts', events)
    handleReplaceRouter()

    setEvents(
      category === 'all'
        ? allEvents
        : allEvents.filter((event: any) => {
            const found = event.categories?.includes(category)
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
      console.log('setSearchTerm(q)', events)
      setSearchTerm(q)
    }
    if (router.isReady && activeCategory && activeCategory !== 'all') {
      console.log('setCategory(activeCategory)', events)
      setCategory(activeCategory)
    }
  }, [activeCategory, router.isReady, q])

  const handleSearchByText = (text: string) => {
    console.log('handleSearchByText', events)
    setSearchTerm(text)
    searchParams?.has('q') && router.replace('/events', undefined, { shallow: true, scroll: false })
    router.replace(`/events?q=${text}`, undefined, { shallow: true, scroll: false })
    if (text.length < 1) router.replace('/events', undefined, { shallow: true, scroll: false })

    const matches = allEvents.filter((event: any) => {
      const found =
        event.tags?.join(' ').replaceAll('-', ' ').includes(text.toLowerCase()) ||
        event.title?.toLowerCase().includes(text.toLowerCase()) ||
        event.author?.includes(text.toLowerCase())
      return found
    })

    setEvents(matches)
  }

  const handleSetCategory = (category: string) => {
    console.log('handleSetCategory', events)
    searchTerm && handlePosts()
    searchTerm && setSearchTerm('')
    setCategory(category)
    category === 'all'
      ? router.replace('/events', undefined, { shallow: true, scroll: false })
      : router.replace(`/events?category=${category}`, undefined, {
          shallow: true,
          scroll: false,
        })
  }

  const handleSearchChange = (event: any) => {
    activeCategory && setCategory('all')
    handleSearchByText(event.target.value)
    console.log('handleSearchChange', events)
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
                  size="medium"
                  iconRight={<IconChevronDown />}
                  className="w-full min-w-[200px] flex justify-between items-center py-2"
                >
                  {!activeCategory ? 'All Events' : startCase(activeCategory?.replaceAll('-', ' '))}
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

        {/* {!showSearchInput && (
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
        )} */}

        {/* {showSearchInput && (
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
              placeholder="Search events"
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
        )} */}
      </AnimatePresence>
    </div>
  )
}

export default EventFilters
