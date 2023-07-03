import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { startCase } from 'lodash'

import { Button, IconSearch, Input, Popover, useOnClickOutside } from 'ui'
import { useParams } from '~/hooks/useParams'

import PostTypes from '~/types/post'

interface Props {
  blogs: PostTypes[]
  setBlogs: (blogs: any) => void
  setCategory: (category: string) => void
  allTags: string[]
  handleBlogs: VoidFunction
}

const BlogFilters = ({ blogs, setBlogs, setCategory, allTags, handleBlogs }: Props) => {
  const activeTag = useParams()?.tag
  const [searchTag, setSearchTag] = useState<string>('')
  const [isTagsMenuOpen, setIsTagsMenuOpen] = useState<boolean>(false)
  const ref = useRef<any>(null)
  const router = useRouter()
  const primaryTags = ['launch-week', 'AI', 'auth', 'database', 'release-notes']

  useEffect(() => {
    if (!!searchTag) {
      setBlogs(handleSearchByText)
    } else {
      handleBlogs()
    }
  }, [searchTag])

  useEffect(() => {
    setIsTagsMenuOpen(false)
    if (router.isReady && activeTag && activeTag !== 'all') {
      setCategory(activeTag)
    }
  }, [activeTag, router.isReady])

  useOnClickOutside(ref, () => {
    if (isTagsMenuOpen) {
      setIsTagsMenuOpen(!isTagsMenuOpen)
    }
  })

  const handleSearchByText = useCallback(() => {
    if (!searchTag) return
    const matches = blogs.filter((post: any) => {
      const found =
        post.tags?.join(' ').replaceAll('-', ' ').includes(searchTag.toLowerCase()) ||
        post.title?.toLowerCase().includes(searchTag.toLowerCase()) ||
        post.author?.includes(searchTag.toLowerCase())
      return found
    })
    return matches
  }, [searchTag])

  const handleSearchChange = (event: any) => {
    activeTag && setCategory('all')
    setSearchTag(event.target.value)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        icon={<IconSearch size="tiny" />}
        size="small"
        layout="vertical"
        autoComplete="off"
        type="text"
        placeholder="Search by keyword"
        value={searchTag}
        onChange={handleSearchChange}
        className="w-full lg:w-[300px]"
      />
      <Button
        type={!searchTag && !activeTag ? 'alternative' : 'default'}
        onClick={() => {
          setSearchTag('')
          setCategory('all')
        }}
      >
        View All
      </Button>
      {allTags
        .filter((tag: string) => primaryTags.includes(tag))
        .sort((a: string, b: string) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1))
        .map((tag: string) => (
          <Button
            key={tag}
            type={tag === activeTag ? 'alternative' : 'default'}
            onClick={() => setCategory(tag)}
          >
            {startCase(tag.replaceAll('-', ' '))}
          </Button>
        ))}
      {activeTag && !primaryTags.includes(activeTag) && (
        <Button type="alternative">{startCase(activeTag!.replaceAll('-', ' '))}</Button>
      )}
      <Popover
        open={isTagsMenuOpen}
        side="bottom"
        align="start"
        overlay={
          <div ref={ref} className="w-[80vw] max-w-lg p-4 lg:p-0">
            <div className="p-4 lg:p-6 flex flex-wrap gap-2 md:gap-2">
              {allTags
                .filter((tag: string) => tag !== 'all')
                .sort((a: string, b: string) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1))
                .map((tag: string) => (
                  <Button
                    key={tag}
                    type={tag === activeTag ? 'alternative' : 'default'}
                    onClick={() => {
                      setSearchTag('')
                      setCategory(tag)
                    }}
                  >
                    {startCase(tag.replaceAll('-', ' '))}
                  </Button>
                ))}
            </div>
          </div>
        }
      >
        <Button
          type={isTagsMenuOpen ? 'default' : 'text'}
          onClick={() => setIsTagsMenuOpen(true)}
          disabled={isTagsMenuOpen}
          className={[
            'text-scale-800 hover:text-scale-1200',
            isTagsMenuOpen && 'text-scale-1200',
          ].join(' ')}
        >
          Show more
        </Button>
      </Popover>
    </div>
  )
}

export default BlogFilters
