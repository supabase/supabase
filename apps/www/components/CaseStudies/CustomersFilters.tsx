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
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectLabel_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
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
import { products } from 'shared-data'
import { PRODUCT_NAMES } from 'shared-data/products'

interface Props {
  allPosts: PostTypes[]
  setPosts: (posts: any) => void
  view?: BlogView
  setView?: (view: any) => void
}

/**
 * ✅ search via text input
 * ✅ update searchTerm when deleting text input
 * ✅ search via q param
 * ✅ search via category if no q param
 * ✅ search via category and reset q param if present
 */

function CustomersFilters({ allPosts, setPosts, view, setView }: Props) {
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

  const PRODUCTS = [
    PRODUCT_NAMES.DATABASE,
    PRODUCT_NAMES.AUTHENTICATION,
    PRODUCT_NAMES.STORAGE,
    PRODUCT_NAMES.FUNCTIONS,
    PRODUCT_NAMES.REALTIME,
    PRODUCT_NAMES.VECTOR,
  ]
  const SEGMENTS = Array.from(new Set(allPosts.map((post) => post.company_segment)))
  const INDUSTRIES = Array.from(new Set(allPosts.map((post) => post.industry)))
  console.log('allPosts', allPosts)
  console.log('industries', INDUSTRIES)
  console.log('PRODUCTS', PRODUCTS)
  console.log('SEGMENTS', SEGMENTS)

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
    searchParams?.has('q') && router.replace('/blog', undefined, { shallow: true, scroll: false })
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

  // TODO: create multiselect input like https://cast.ai/case-studies/

  return (
    <div className="flex flex-row items-center justify-between gap-2">
      {/* <Select_Shadcn_>
        <SelectTrigger_Shadcn_ className="w-[180px]">
          <SelectValue_Shadcn_ placeholder="Industry" />
        </SelectTrigger_Shadcn_>
        <SelectContent_Shadcn_>
          {INDUSTRIES.map((industry) => (
            <SelectItem_Shadcn_ value={industry!}>{industry}</SelectItem_Shadcn_>
          ))}
        </SelectContent_Shadcn_>
      </Select_Shadcn_> */}
    </div>
  )
}

export default CustomersFilters
