import fs from 'fs'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'
import { startCase } from 'lodash'

import { NextSeo } from 'next-seo'
import { generateRss } from '~/lib/rss'
import { getSortedPosts, getAllCategories } from '~/lib/posts'
import authors from 'lib/authors.json'

import DefaultLayout from '~/components/Layouts/Default'
import { Button, IconSearch, Input, Popover, useOnClickOutside } from 'ui'
import PostTypes from '~/types/post'
import BlogListItem from '~/components/Blog/BlogListItem'
import { useParams } from '~/hooks/useParams'

export async function getStaticProps() {
  const allPostsData = getSortedPosts('_blog', undefined, undefined, '** BLOG PAGE **')
  const categories = getAllCategories('_blog')
  const rss = generateRss(allPostsData)

  // create a rss feed in public directory
  // rss feed is added via <Head> component in render return
  fs.writeFileSync('./public/rss.xml', rss)

  // generate a series of rss feeds for each author (for PlanetPG)
  const planetPgPosts = allPostsData.filter((post: any) => post.tags?.includes('planetpg'))
  const planetPgAuthors = planetPgPosts.map((post: any) => post.author.split(','))
  const uniquePlanetPgAuthors = new Set([].concat(...planetPgAuthors))

  uniquePlanetPgAuthors.forEach((author) => {
    const authorPosts = planetPgPosts.filter((post: any) => post.author.includes(author))
    if (authorPosts.length > 0) {
      const authorRss = generateRss(authorPosts, author)
      fs.writeFileSync(`./public/planetpg-${author}-rss.xml`, authorRss)
    }
  })

  // Append 'all' category here
  categories.unshift('all')

  return {
    props: {
      blogs: allPostsData,
      categories,
    },
  }
}

function Blog(props: any) {
  const activeTag = useParams()?.tag
  const [searchTag, setSearchTag] = useState<string>('')
  const [category, setCategory] = useState<string>('all')
  const [blogs, setBlogs] = useState(props.blogs)
  const [isTagsMenuOpen, setIsTagsMenuOpen] = useState<boolean>(false)
  const ref = useRef<any>(null)
  const router = useRouter()

  const meta_title = 'Supabase Blog: Open Source Firebase alternative Blog'
  const meta_description = 'Get all your Supabase News on the Supabase blog.'

  useEffect(() => {
    handleBlogs()
  }, [category])

  const handleBlogs = () => {
    // construct an array of blog posts
    // not inluding the first blog post
    const shiftedBlogs = [...props.blogs]
    shiftedBlogs.shift()

    if (category === 'all') {
      router.replace('/blog', undefined, { shallow: true, scroll: false })
    } else {
      router.query.tag = category
      router.replace(router, undefined, { shallow: true, scroll: false })
    }

    setBlogs(
      category === 'all'
        ? shiftedBlogs
        : props.blogs.filter((post: any) => {
            const found = post.tags?.includes(category)
            return found
          })
    )
  }

  useEffect(() => {
    if (!!searchTag) {
      setBlogs(handleSearchByText)
    } else {
      handleBlogs()
    }
  }, [searchTag])

  const handleSearchChange = (event: any) => {
    activeTag && setCategory('all')
    setSearchTag(event.target.value)
  }

  const handleSearchByText = useCallback(() => {
    if (!searchTag) return
    const matches = props.blogs.filter((post: any) => {
      const found =
        post.tags?.join(' ').replaceAll('-', ' ').includes(searchTag.toLowerCase()) ||
        post.title?.toLowerCase().includes(searchTag.toLowerCase()) ||
        post.author?.includes(searchTag.toLowerCase())
      return found
    })
    return matches
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

  const primaryTags = ['launch-week', 'AI', 'auth', 'database', 'release-notes']

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/${router.pathname}`,
          images: [
            {
              url: `https://supabase.com/images/og/og-image-v2.jpg`,
            },
          ],
        }}
        additionalLinkTags={[
          {
            rel: 'alternate',
            type: 'application/rss+xml',
            href: `https://supabase.com/rss.xml`,
          },
        ]}
      />
      <DefaultLayout>
        <h1 className="sr-only">Supabase blog</h1>
        <div className="overflow-hidden py-12">
          <div className="container mx-auto mt-16 px-8 sm:px-16 xl:px-20">
            <div className="mx-auto ">
              {props.blogs.slice(0, 1).map((blog: any, i: number) => (
                <FeaturedThumb key={i} {...blog} />
              ))}
            </div>
          </div>
        </div>

        <div className="border-scale-600 border-t">
          <div className="container mx-auto mt-16 px-8 sm:px-16 xl:px-20">
            <div className="mx-auto ">
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
                  type={!searchTag && !activeTag ? 'primary' : 'default'}
                  onClick={() => {
                    setSearchTag('')
                    setCategory('all')
                  }}
                >
                  View All
                </Button>
                {props.categories
                  .filter((tag: string) => primaryTags.includes(tag))
                  .sort((a: string, b: string) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1))
                  .map((tag: string) => (
                    <Button
                      key={tag}
                      type={tag === activeTag ? 'primary' : 'default'}
                      onClick={() => setCategory(tag)}
                    >
                      {startCase(tag.replaceAll('-', ' '))}
                    </Button>
                  ))}
                {activeTag && !primaryTags.includes(activeTag) && (
                  <Button type="primary">{startCase(activeTag!.replaceAll('-', ' '))}</Button>
                )}
                <Popover
                  open={isTagsMenuOpen}
                  side="bottom"
                  align="start"
                  overlay={
                    <div ref={ref} className="w-[80vw] max-w-lg p-4 lg:p-0">
                      <div className="p-4 lg:p-6 flex flex-wrap gap-2 md:gap-2">
                        {props.categories
                          .filter((tag: string) => tag !== 'all')
                          .sort((a: string, b: string) =>
                            a.toLowerCase() > b.toLowerCase() ? 1 : -1
                          )
                          .map((tag: string) => (
                            <Button
                              key={tag}
                              type={tag === activeTag ? 'primary' : 'default'}
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
            </div>

            <ol className="grid grid-cols-12 py-16 lg:gap-16">
              {blogs?.map((blog: PostTypes, idx: number) => (
                <div
                  className="col-span-12 mb-16 md:col-span-12 lg:col-span-6 xl:col-span-4"
                  key={idx}
                >
                  <BlogListItem post={blog} />
                </div>
              ))}
            </ol>
          </div>{' '}
        </div>
      </DefaultLayout>
    </>
  )
}

function FeaturedThumb(blog: PostTypes) {
  // @ts-ignore
  const authorArray = blog.author.split(',')

  const author = []
  for (let i = 0; i < authorArray.length; i++) {
    // @ts-ignore
    author.push(
      authors.find((authors: any) => {
        // @ts-ignore
        return authors.author_id === authorArray[i]
      })
    )
  }

  return (
    <div key={blog.slug} className="w-full cursor-pointer">
      <Link href={`${blog.path}`}>
        <a className="grid gap-8 lg:grid-cols-2 lg:gap-16">
          <div className="relative h-96 w-full overflow-auto rounded-lg border">
            <Image
              src={`/images/blog/` + (blog.thumb ? blog.thumb : blog.image)}
              layout="fill"
              objectFit="cover"
              alt="blog thumbnail"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <div className="text-scale-900 flex space-x-2 text-sm">
              <p>{blog.date}</p>
              <p>•</p>
              <p>{blog.readingTime}</p>
            </div>

            <div>
              <h2 className="h2">{blog.title}</h2>
              <p className="p text-xl">{blog.description}</p>
            </div>

            <div className="grid w-max grid-flow-col grid-rows-4 gap-4">
              {author.map((author: any, i: number) => {
                return (
                  <div className="flex items-center space-x-3" key={i}>
                    {author.author_image_url && (
                      <div className="relative h-10 w-10 overflow-auto">
                        <Image
                          src={author.author_image_url}
                          alt={`${author.author} avatar`}
                          className="rounded-full"
                          layout="fill"
                          objectFit="cover"
                        />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-scale-1200 m-0 text-sm">{author.author}</span>
                      <span className="text-scale-900 m-0 text-xs">{author.position}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </a>
      </Link>
    </div>
  )
}

export default Blog
