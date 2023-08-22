import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { startCase } from 'lodash'

import { Button, IconSearch, Input } from 'ui'
import { useParams } from '~/hooks/useParams'

import PostTypes from '~/types/post'

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
        // post.categories?.join(' ').replaceAll('-', ' ').includes(searchKey.toLowerCase()) ||
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
    <div className="flex flex-col lg:flex-row lg:items-center gap-2">
      <Input
        icon={<IconSearch size="tiny" />}
        size="small"
        layout="vertical"
        autoComplete="off"
        type="text"
        placeholder="Search by keyword"
        value={searchKey}
        onChange={handleSearchChange}
        className="w-full lg:w-[300px]"
      />
      <div className="flex flex-wrap items-center gap-2">
        {allCategories
          .sort((a: string, b: string) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1))
          .map((category: string) => (
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
              size="small"
            >
              {startCase(category.replaceAll('-', ' '))}
            </Button>
          ))}
      </div>
    </div>
  )
}

export default BlogFilters
