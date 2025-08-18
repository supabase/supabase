import dayjs from 'dayjs'
import matter from 'gray-matter'
import capitalize from 'lodash/capitalize'
import dynamic from 'next/dynamic'
import { NextSeo } from 'next-seo'

import advancedFormat from 'dayjs/plugin/advancedFormat'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import { mdxSerialize } from 'lib/mdx/mdxSerialize'
import { getAllPostSlugs, getPostdata, getSortedPosts } from 'lib/posts'

import type { GetStaticProps, InferGetStaticPropsType } from 'next'
import type { Event, EventData, PostReturnType } from 'types/post'

const EventRenderer = dynamic(() => import('components/Events/EventRenderer'))

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(advancedFormat)

type EventPageProps = {
  prevPost: PostReturnType | null
  nextPost: PostReturnType | null
  relatedPosts: PostReturnType[]
  event: Event & EventData
}

type MatterReturn = {
  data: EventData
  content: string
}

const EventPage = ({ event }: InferGetStaticPropsType<typeof getStaticProps>) => {
  const hadEndDate = event.end_date?.length

  const ogImageUrl = event.og_image
    ? event.og_image
    : encodeURI(
        `${process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:54321' : 'https://obuldanrptloktxcffvn.supabase.co'}/functions/v1/og-images?site=events&eventType=${event.type}&title=${event.meta_title ?? event.title}&description=${event.meta_description ?? event.description}&date=${dayjs(event.date).tz(event.timezone).format(`DD MMM YYYY`)}&duration=${event.duration}`
      )

  const meta = {
    title: `${event.meta_title ?? event.title} | ${dayjs(event.date)
      .tz(event.timezone)
      .format(
        hadEndDate ? `DD` : `DD MMM YYYY`
      )}${hadEndDate ? dayjs(event.end_date).tz(event.timezone).format(` - DD MMM`) : ''} | ${capitalize(event.type)}`,
    description: event.meta_description ?? event.description,
    url: `https://supabase.com/events/${event.slug}`,
    image: ogImageUrl,
  }

  return (
    <>
      <NextSeo
        title={meta.title}
        description={meta.description}
        openGraph={{
          title: meta.title,
          description: meta.description,
          url: meta.url,
          type: 'article',
          images: [
            {
              url: meta.image,
              alt: `${event.title} thumbnail`,
              width: 1200,
              height: 627,
            },
          ],
          videos: event.video
            ? [
                {
                  // youtube based video meta
                  url: event.video,
                  type: 'application/x-shockwave-flash',
                  width: 640,
                  height: 385,
                },
              ]
            : undefined,
          article: {
            publishedTime: event.date,
            tags: event.tags?.map((cat: string) => {
              return cat
            }),
          },
        }}
      />
      <EventRenderer event={event} />
    </>
  )
}

export async function getStaticPaths() {
  const staticPaths = getAllPostSlugs('_events')
  // const cmsPaths = await getAllCMSEventSlugs()
  // const paths = [...staticPaths, ...cmsPaths]
  const paths = [...staticPaths]

  return {
    paths,
    fallback: false,
  }
}

type Params = {
  slug: string
}

export const getStaticProps: GetStaticProps<EventPageProps, Params> = async ({
  params,
  preview = false,
}) => {
  if (!params?.slug) {
    throw new Error('Missing slug for pages/events/[slug].tsx')
  }

  const slug = `${params.slug}`

  // Try static post first
  try {
    const postContent = await getPostdata(slug, '_events')
    const parsedContent = matter(postContent) as unknown as MatterReturn
    const content = parsedContent.content
    const mdxSource = await mdxSerialize(content)
    const blogPost = { ...parsedContent.data }

    // Get all posts for navigation and related posts
    const allStaticEvents = getSortedPosts({ directory: '_events' })
    // const allCmsEvents = await getAllCMSEvents()
    // const allPosts = [...allStaticEvents, ...allCmsEvents].sort(
    const allPosts = [...allStaticEvents].sort(
      (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    const currentIndex = allPosts.findIndex((post) => post.slug === slug)
    const nextPost = currentIndex === allPosts.length - 1 ? null : allPosts[currentIndex + 1]
    const prevPost = currentIndex === 0 ? null : allPosts[currentIndex - 1]
    // const tocResult = toc(content, { maxdepth: blogPost.toc_depth ? blogPost.toc_depth : 2 })
    // const processedContent = tocResult.content.replace(/%23/g, '')
    const relatedPosts = getSortedPosts({
      directory: '_blog',
      limit: 3,
      tags: mdxSource.scope.tags,
      currentPostSlug: slug,
    }) as unknown as (EventData & PostReturnType)[]

    const eventData: Event & EventData = {
      slug,
      source: content,
      ...blogPost,
      content: mdxSource,
    }

    return {
      props: {
        prevPost,
        nextPost,
        relatedPosts,
        event: eventData,
      },
      revalidate: 60 * 10, // Revalidate every 10 minutes
    }
  } catch (error) {
    console.log('[getStaticProps] Static post not found, trying CMS post...')
  }

  return

  // Try CMS post (handle preview/draft logic)
  // const cmsPost = await getCMSEventBySlug(slug, preview)

  // if (!cmsPost) {
  //   // Try to fetch published version if preview mode failed
  //   if (preview) {
  //     const publishedPost = await getCMSEventBySlug(slug, false)
  //     if (!publishedPost) {
  //       return { notFound: true }
  //     }
  //     const mdxSource = await mdxSerialize(publishedPost.content || '')

  //     const eventData: Event & EventData = {
  //       ...(publishedPost as any),
  //       tags: publishedPost.tags || [],
  //       authors: publishedPost.authors || [],
  //       isCMS: true,
  //       content: mdxSource,
  //       image: publishedPost.image ?? undefined,
  //     }

  //     return {
  //       props: {
  //         prevPost: null,
  //         nextPost: null,
  //         relatedPosts: [],
  //         event: eventData,
  //       },
  //       revalidate: 60 * 10,
  //     }
  //   }
  //   return { notFound: true }
  // }

  // const mdxSource = await mdxSerialize(cmsPost.content || '')

  // const eventData: Event & EventData = {
  //   ...(cmsPost as any),
  //   tags: cmsPost.tags || [],
  //   authors: cmsPost.authors || [],
  //   isCMS: true,
  //   content: mdxSource,
  // }

  // return {
  //   props: {
  //     prevPost: null,
  //     nextPost: null,
  //     relatedPosts: [],
  //     event: eventData,
  //   },
  //   revalidate: 60 * 10,
  // }
}

export default EventPage
