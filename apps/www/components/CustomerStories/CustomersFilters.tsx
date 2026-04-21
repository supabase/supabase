'use client'

import { useRouter } from 'next/compat/router'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type PostTypes from '~/types/post'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from 'ui'
import { ChevronDown, X as CloseIcon } from 'lucide-react'
import { startCase } from 'lib/helpers'
import { useBreakpoint } from 'common'
import { usePathname } from 'next/navigation'

interface Props {
  allCustomers: PostTypes[]
  setCustomers: (posts: any) => void
  industries: { [key: string]: number }
  products: { [key: string]: number }
}

const useFilters = (initialIndustry: string, initialProduct: string) => {
  const router = useRouter()
  const [industry, setIndustry] = useState<string>(initialIndustry)
  const [product, setProduct] = useState<string>(initialProduct)

  const updateUrlParams = () => {
    const params = new URLSearchParams()
    if (industry !== 'all') params.set('industry', industry)
    if (product !== 'all') params.set('product', product)
    router?.replace({ pathname: '/customers', query: params.toString() }, undefined, {
      shallow: true,
    })
  }

  useEffect(() => {
    updateUrlParams()
  }, [industry, product])

  return { industry, setIndustry, product, setProduct }
}

function CustomerFilters({ allCustomers, setCustomers, industries, products }: Props) {
  const isMobile = useBreakpoint('sm')
  const router = useRouter()
  const pathname = usePathname()
  const {
    industry: activeIndustry,
    setIndustry,
    product: activeProduct,
    setProduct,
  } = useFilters('all', 'all')

  const handlePosts = () => {
    setCustomers(
      allCustomers.filter((customer: any) => {
        const matchesIndustry =
          activeIndustry === 'all' || customer.industry?.includes(activeIndustry)
        const matchesProduct = activeProduct === 'all' || customer.products?.includes(activeProduct)
        return matchesIndustry && matchesProduct
      })
    )
  }

  const resetFilters = () => {
    handleIndustryFilter('all')
    handleProductFilter('all')
  }

  useEffect(() => {
    handlePosts()
  }, [activeIndustry, activeProduct])

  const handleIndustryFilter = (selectedIndustry: string) => {
    if (!router) return
    if (selectedIndustry === 'all') {
      setIndustry('all')
      const { industry, ...rest } = router.query
      router?.push({
        pathname: pathname,
        query: rest,
      })
    } else {
      setIndustry(selectedIndustry)
      router?.push({
        pathname: pathname,
        query: { ...router?.query, industry: selectedIndustry },
      })
    }
  }

  const handleProductFilter = (selectedProduct: string) => {
    if (!router) return
    if (selectedProduct === 'all') {
      setProduct('all')
      const { product, ...rest } = router.query
      router?.push({
        pathname: pathname,
        query: rest,
      })
    } else {
      setProduct(selectedProduct)
      router?.push({
        pathname: pathname,
        query: { ...router?.query, product: selectedProduct },
      })
    }
  }

  return (
    <div className="flex flex-row items-center justify-between gap-2">
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.05 } }}
          className="flex flex-row flex-wrap sm:flex-nowrap justify-start items-center gap-2"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="outline"
                size="medium"
                iconRight={<ChevronDown />}
                className="w-full min-w-[150px] flex [&_span]:flex [&_span]:items-center [&_span]:gap-2 justify-between items-center py-2"
              >
                {getIndustryLabel(activeIndustry) || 'All Industries'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.entries(industries).map(([industry, count]) => (
                <DropdownMenuItem
                  key={`item-${industry}`}
                  onClick={() => handleIndustryFilter(industry)}
                  className={cn(
                    'flex gap-0.5 items-center justify-between',
                    (industry === 'all' && !activeIndustry) || industry === activeIndustry
                      ? 'text-brand-600'
                      : ''
                  )}
                >
                  {getIndustryLabel(industry)}{' '}
                  <span className="text-foreground-lighter text-xs w-3">{count}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="outline"
                size="medium"
                iconRight={<ChevronDown />}
                className="w-full min-w-[200px] flex [&_span]:flex [&_span]:items-center [&_span]:gap-2 justify-between items-center py-2"
              >
                {getProductLabel(activeProduct) || 'All Products'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.entries(products).map(([product, count]) => (
                <DropdownMenuItem
                  key={`item-${product}`}
                  onClick={() => handleProductFilter(product)}
                  className={cn(
                    'flex gap-0.5 items-center justify-between',
                    (product === 'all' && !activeProduct) || product === activeProduct
                      ? 'text-brand-600'
                      : ''
                  )}
                >
                  {getProductLabel(product)}{' '}
                  <span className="text-foreground-lighter text-xs w-3">{count}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={resetFilters}
            className={cn(
              'transition-opacity',
              activeIndustry !== 'all' || activeProduct !== 'all'
                ? 'opacity-100 visible'
                : 'opacity-0 invisible'
            )}
            type={isMobile ? 'default' : 'text'}
            block={isMobile}
            iconRight={<CloseIcon />}
          >
            Reset filters
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

const getIndustryLabel = (industry: string) => {
  switch (industry) {
    case 'all':
      return 'All Industries'
    case 'ai':
      return 'AI'
    case 'saas':
      return 'SaaS'
    default:
      return startCase(industry.replaceAll('-', ' '))
  }
}

const getProductLabel = (product: string) => {
  switch (product) {
    case 'all':
      return 'All Products'
    case 'functions':
      return 'Edge Functions'
    default:
      return startCase(product.replaceAll('-', ' '))
  }
}

export default CustomerFilters
