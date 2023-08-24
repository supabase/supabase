import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { startCase } from 'lodash'

import { Button, Dropdown, IconChevronDown, IconSearch, IconX, Input } from 'ui'
import { useParams } from '~/hooks/useParams'

import PostTypes from '~/types/post'
import { useBreakpoint } from 'common'
import { AnimatePresence, motion } from 'framer-motion'

interface Props {
  posts: PostTypes[]
  setPosts: (posts: any) => void
  setCategory: (category: string) => void
  allCategories: string[]
  handlePosts: VoidFunction
}

const MotionButton = motion(Button)

const BlogFilters = ({ posts, setPosts, setCategory, allCategories, handlePosts }: Props) => {
  const activeCategory = useParams()?.category
  const [searchKey, setSearchKey] = useState<string>('')
  const isMobile = useBreakpoint(1023)
  const is2XL = useBreakpoint(1535)
  const [showSearchInput, setShowSearchInput] = useState<boolean>(false)
  const router = useRouter()

  useEffect(() => {
    setShowSearchInput(!isMobile)
  }, [isMobile])

  useEffect(() => {
    if (!!searchKey) {
      setPosts(handleSearchByText)
    } else {
      handlePosts()
    }
  }, [searchKey])

  useEffect(() => {
    if (router.isReady && activeCategory && activeCategory !== 'all') {
      setCategory(activeCategory)
    }
  }, [activeCategory, router.isReady])

  const handleSearchByText = useCallback(() => {
    if (!searchKey) return
    const matches = posts.filter((post: any) => {
      const found =
        post.tags?.join(' ').replaceAll('-', ' ').includes(searchKey.toLowerCase()) ||
        post.title?.toLowerCase().includes(searchKey.toLowerCase()) ||
        post.author?.includes(searchKey.toLowerCase())
      return found
    })
    return matches
  }, [searchKey])

  const handleSearchChange = (event: any) => {
    activeCategory && setCategory('all')
    setSearchKey(event.target.value)
  }

  return (
    <div className="flex flex-row items-center justify-between gap-2">
      <AnimatePresence exitBeforeEnter>
        {!showSearchInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.05 } }}
            className="flex lg:hidden"
          >
            <Dropdown
              side="bottom"
              align="start"
              size="large"
              overlay={allCategories.map((category: string) => (
                <Dropdown.Item
                  key="custom-expiry"
                  onClick={() => setCategory(category)}
                  className={[
                    (category === 'all' && !activeCategory) || category === activeCategory
                      ? 'text-brand-600'
                      : '',
                  ].join(' ')}
                >
                  {category === 'all' ? 'All Posts' : startCase(category.replaceAll('-', ' '))}
                </Dropdown.Item>
              ))}
            >
              <Button
                type="outline"
                iconRight={<IconChevronDown />}
                className="w-full min-w-[200px] flex justify-between items-center py-2"
              >
                {!activeCategory ? 'All Posts' : startCase(activeCategory?.replaceAll('-', ' '))}
              </Button>
            </Dropdown>
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
              onClick={() => setCategory(category)}
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
                    className="text-scale-1100 hover:text-scale-1200"
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
