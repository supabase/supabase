import { useBreakpoint } from 'common'
import { AnimatePresence, motion } from 'framer-motion'
import { startCase } from 'lodash'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { useKey } from 'react-use'
import type PostTypes from '~/types/post'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  cn,
} from 'ui'
import { ChevronDown, Search, X as CloseIcon } from 'lucide-react'

interface Props {
  allEvents: PostTypes[]
  events?: PostTypes[]
  setEvents: (posts: any) => void
  categories: { [key: string]: number }
}

/**
 * search via category if no q param
 * search via category and reset q param if present
 */

function EventFilters({ allEvents, setEvents, categories }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [category, setCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [showSearchInput, setShowSearchInput] = useState<boolean>(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams?.get('q')
  const activeCategory = searchParams?.get('category')
  const isMobile = useBreakpoint(1023)
  const is2XL = useBreakpoint(1535)

  const handleSearchChange = (event: any) => {
    activeCategory && setCategory('all')
    handleSearchByText(event.target.value)
  }

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
      setSearchTerm(q)
    }
    if (router.isReady && activeCategory && activeCategory !== 'all') {
      setCategory(activeCategory)
    }
  }, [activeCategory, router.isReady, q])

  const handleSearchByText = (text: string) => {
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

  useEffect(() => {
    if (!inputRef.current) return
    if (showSearchInput && isMobile) {
      inputRef.current?.focus()
    }
  }, [showSearchInput, isMobile])

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
                  iconRight={<ChevronDown />}
                  className="w-full min-w-[200px] flex [&_span]:flex [&_span]:items-center [&_span]:gap-2 justify-between items-center py-2"
                >
                  {!activeCategory ? (
                    <>
                      All Events{' '}
                      <span className="text-foreground-lighter text-xs">{categories['all']}</span>
                    </>
                  ) : (
                    <>
                      {startCase(activeCategory?.replaceAll('-', ' '))}
                      <span className="text-foreground-lighter text-xs">
                        {categories[activeCategory]}
                      </span>
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="start">
                {Object.entries(categories).map(([category, count]) => (
                  <DropdownMenuItem
                    key={`item-${category}`}
                    onClick={() => handleSetCategory(category)}
                    className={cn(
                      'flex gap-0.5 items-center justify-between',
                      (category === 'all' && !activeCategory) || category === activeCategory
                        ? 'text-brand-600'
                        : ''
                    )}
                  >
                    {category === 'all' ? 'All Posts' : startCase(category.replaceAll('-', ' '))}{' '}
                    <span className="text-foreground-lighter text-xs w-3">{count}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        )}
        <div className="hidden lg:flex flex-wrap items-center flex-grow gap-2">
          {Object.entries(categories).map(([category, count]) => (
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
              iconRight={
                <span className="text-foreground-lighter text-xs flex items-center h-[16px] self-center">
                  {count}
                </span>
              }
            >
              {category === 'all' ? 'All' : startCase(category.replaceAll('-', ' '))}{' '}
            </Button>
          ))}
        </div>
      </AnimatePresence>
      {!showSearchInput && (
        <motion.div
          className="flex-1 flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.05 } }}
        >
          <Button
            className="px-2 w-9 h-9"
            size="large"
            type="default"
            onClick={() => setShowSearchInput(true)}
          >
            <Search size="14" />
          </Button>
        </motion.div>
      )}
      {showSearchInput && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.05 } }}
          className="w-full h-[38px] flex justify-end gap-2 items-stretch lg:max-w-[240px] xl:max-w-[280px]"
        >
          <Input
            inputRef={inputRef}
            icon={<Search size="14" />}
            size="small"
            layout="vertical"
            autoComplete="off"
            type="search"
            placeholder="Search event"
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
                  className="text-foreground-light hover:text-foreground bg-control/100 hover:bg-selection"
                >
                  <CloseIcon size="14" />
                </Button>
              )
            }
          />
        </motion.div>
      )}
    </div>
  )
}

export default EventFilters
