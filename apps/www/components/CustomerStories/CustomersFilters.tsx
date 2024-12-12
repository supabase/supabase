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
  allCustomers: PostTypes[]
  customers?: PostTypes[]
  setCustomers: (posts: any) => void
  industries: { [key: string]: number }
}

/**
 * search via industry if no q param
 * search via industry and reset q param if present
 */

function CustomerFilters({ allCustomers, setCustomers, industries }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [industry, setIndustry] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [showSearchInput, setShowSearchInput] = useState<boolean>(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams?.get('q')
  const activeIndustry = searchParams?.get('industry')
  const isMobile = useBreakpoint(1023)

  const handleSearchChange = (customer: any) => {
    activeIndustry && setIndustry('all')
    handleSearchByText(customer.target.value)
  }

  useEffect(() => {
    if (!q) {
      handlePosts()
    }
  }, [industry])

  useEffect(() => {
    if (q) {
      handleSearchByText(q)
    }
  }, [q])

  const handleReplaceRouter = () => {
    if (!searchTerm && industry !== 'all') {
      router.query.industry = industry
      router.replace(router, undefined, { shallow: true, scroll: false })
    }
  }

  const handlePosts = () => {
    handleReplaceRouter()

    setCustomers(
      industry === 'all'
        ? allCustomers
        : allCustomers.filter((customer: any) => {
            const found = customer.industry?.includes(industry)
            console.log('customer', customer, industry, found)
            return found
          })
    )
  }

  useKey('Escape', () => handleSearchByText(''))

  useEffect(() => {
    if (router.isReady && q) {
      setSearchTerm(q)
    }
    if (router.isReady && activeIndustry && activeIndustry !== 'all') {
      setIndustry(activeIndustry)
    }
  }, [activeIndustry, router.isReady, q])

  const handleSearchByText = (text: string) => {
    setSearchTerm(text)
    searchParams?.has('q') &&
      router.replace('/customers', undefined, { shallow: true, scroll: false })
    router.replace(`/customers?q=${text}`, undefined, { shallow: true, scroll: false })
    if (text.length < 1) router.replace('/customers', undefined, { shallow: true, scroll: false })

    const matches = allCustomers.filter((customer: any) => {
      const found =
        customer.title?.toLowerCase().includes(text.toLowerCase()) ||
        customer.about?.toLowerCase().includes(text.toLowerCase())
      return found
    })

    setCustomers(matches)
  }

  const handleSetIndustry = (industry: string) => {
    searchTerm && handlePosts()
    searchTerm && setSearchTerm('')
    setIndustry(industry)
    industry === 'all'
      ? router.replace('/customers', undefined, { shallow: true, scroll: false })
      : router.replace(`/customers?industry=${industry}`, undefined, {
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.05 } }}
          className="flex"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="outline"
                size="medium"
                iconRight={<ChevronDown />}
                className="w-full min-w-[200px] flex [&_span]:flex [&_span]:items-center [&_span]:gap-2 justify-between items-center py-2"
              >
                {!activeIndustry ? (
                  <>
                    All Industries{' '}
                    <span className="text-foreground-lighter text-xs">{industries['all']}</span>
                  </>
                ) : (
                  <>
                    {startCase(activeIndustry?.replaceAll('-', ' '))}
                    <span className="text-foreground-lighter text-xs">
                      {industries[activeIndustry]}
                    </span>
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start">
              {Object.entries(industries).map(([industry, count]) => (
                <DropdownMenuItem
                  key={`item-${industry}`}
                  onClick={() => handleSetIndustry(industry)}
                  className={cn(
                    'flex gap-0.5 items-center justify-between',
                    (industry === 'all' && !activeIndustry) || industry === activeIndustry
                      ? 'text-brand-600'
                      : ''
                  )}
                >
                  {industry === 'all' ? 'All Industries' : startCase(industry.replaceAll('-', ' '))}{' '}
                  <span className="text-foreground-lighter text-xs w-3">{count}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      </AnimatePresence>
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
          placeholder="Search customer"
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full [&_input]:!h-[38px]"
          actions={
            searchTerm && (
              <Button
                type="link"
                onClick={() => {
                  handleSearchByText('')
                }}
                className="text-foreground-light hover:text-foreground bg-control/100 hover:bg-selection"
              >
                <CloseIcon size="14" />
              </Button>
            )
          }
        />
      </motion.div>
    </div>
  )
}

export default CustomerFilters
