import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { startCase } from 'lodash'

import { Button, IconSearch, Input } from 'ui'
import { useParams } from '~/hooks/useParams'

import PostTypes from '~/types/post'
import { useBreakpoint } from 'common'

interface Props {
  posts: PostTypes[]
  setPosts: (posts: any) => void
  setCategory: (category: string) => void
  allCategories: string[]
  handlePosts: VoidFunction
}

const BlogFilters = ({ posts, setPosts, setCategory, allCategories, handlePosts }: Props) => {
  const activeCategory = useParams()?.category
  const [searchKey, setSearchKey] = useState<string>('')
  const router = useRouter()
  const isMobile = useBreakpoint()

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
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2">
      <div className="flex flex-wrap items-center flex-grow gap-2">
        {allCategories.map((category: string) => (
          <Button
            key={category}
            type={
              category === 'all' && !searchKey && !activeCategory
                ? 'alternative'
                : category === activeCategory
                ? 'alternative'
                : 'default'
            }
            onClick={() => setCategory(category)}
            size={isMobile ? 'tiny' : 'small'}
          >
            {startCase(category.replaceAll('-', ' '))}
          </Button>
        ))}
      </div>
      <Input
        icon={<IconSearch size="tiny" />}
        size="small"
        layout="vertical"
        autoComplete="off"
        type="text"
        placeholder="Search blog"
        value={searchKey}
        onChange={handleSearchChange}
        className="w-full lg:w-[260px]"
      />
    </div>
  )
}

export default BlogFilters
