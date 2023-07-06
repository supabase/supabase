import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { startCase } from 'lodash'
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion'

import { Button, IconSearch, Input, useOnClickOutside } from 'ui'
import { useParams } from '~/hooks/useParams'

import PostTypes from '~/types/post'
import { INITIAL_BOTTOM, getAnimation } from '../../lib/animations'

interface Props {
  blogs: PostTypes[]
  setBlogs: (blogs: any) => void
  setCategory: (category: string) => void
  allTags: string[]
  handleBlogs: VoidFunction
}

const BlogFiltersExpand = ({ blogs, setBlogs, setCategory, allTags, handleBlogs }: Props) => {
  const activeTag = useParams()?.tag
  const [searchTag, setSearchTag] = useState<string>('')
  const [isTagsMenuOpen, setIsTagsMenuOpen] = useState<boolean>(false)
  const ref = useRef<any>(null)
  const router = useRouter()

  useEffect(() => {
    if (!!searchTag) {
      setBlogs(handleSearchByText)
    } else {
      handleBlogs()
    }
  }, [searchTag])

  useEffect(() => {
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
    if (searchTag && searchTag.length > event.target.value.length) {
      handleBlogs()
    }
    setSearchTag(event.target.value)
  }

  const initial = INITIAL_BOTTOM

  const primaryTags = ['launch-week', 'AI', 'auth', 'release-notes']
  const secondaryTags = allTags
    .filter((tag: string) => tag !== 'all' && !primaryTags.includes(tag))
    .sort((a: string, b: string) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1))
  const tagsAnimation = {
    staggerIn: 0.004,
    durationOut: 0.1,
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-2">
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
          <AnimatePresence exitBeforeEnter>
            {isTagsMenuOpen && (
              <>
                {secondaryTags.map((tag: string, idx: number) => {
                  const animate = getAnimation({ delay: idx * tagsAnimation.staggerIn })

                  return (
                    <m.div
                      initial={initial}
                      animate={animate}
                      exit={{ opacity: 0, transition: { duration: tagsAnimation.durationOut } }}
                    >
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
                    </m.div>
                  )
                })}
                <m.div
                  initial={initial}
                  animate={getAnimation({ delay: secondaryTags.length * tagsAnimation.staggerIn })}
                  exit={{ opacity: 0, transition: { duration: tagsAnimation.durationOut } }}
                >
                  <Button type="outline" onClick={() => setIsTagsMenuOpen(false)}>
                    Show less
                  </Button>
                </m.div>
              </>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!isTagsMenuOpen && (
              <m.div
                initial={{ opacity: 0 }}
                animate={getAnimation({ delay: tagsAnimation.durationOut })}
                exit={{ opacity: 0, transition: { duration: 0 } }}
              >
                <Button
                  type={isTagsMenuOpen ? 'default' : 'outline'}
                  onClick={() => setIsTagsMenuOpen(true)}
                  disabled={isTagsMenuOpen}
                >
                  Show more
                </Button>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </LazyMotion>
  )
}

export default BlogFiltersExpand
