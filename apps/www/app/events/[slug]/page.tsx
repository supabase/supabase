import type { Metadata } from 'next'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import dynamic from 'next/dynamic'
import matter from 'gray-matter'

import { mdxSerialize } from 'lib/mdx/mdxSerialize'
import { getAllPostSlugs, getPostdata } from 'lib/posts'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(advancedFormat)

const EventRenderer = dynamic(() => import('components/Events/EventRenderer'))

type Params = { slug: string }

export async function generateStaticParams() {
  const paths = getAllPostSlugs('_events')
  return paths.map((p) => ({ slug: p.params.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const slug = params.slug
  const postContent = await getPostdata(slug, '_events')
  const { data } = matter(postContent)
  const hadEndDate = data.end_date?.length
  const title = `${data.meta_title ?? data.title} | ${dayjs(data.date)
    .tz(data.timezone)
    .format(
      hadEndDate ? `DD` : `DD MMM YYYY`
    )}${hadEndDate ? dayjs(data.end_date).tz(data.timezone).format(` - DD MMM`) : ''} | ${data.type?.charAt(0).toUpperCase()}${data.type?.slice(1)}`
  const description = data.meta_description ?? data.description
  const image = data.og_image
    ? data.og_image
    : `https://obuldanrptloktxcffvn.supabase.co/functions/v1/og-images?site=events&eventType=${data.type}&title=${data.meta_title ?? data.title}&description=${data.meta_description ?? data.description}&date=${dayjs(data.date).tz(data.timezone).format(`DD MMM YYYY`)}&duration=${data.duration}`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: [{ url: image }],
    },
  }
}

export default async function EventSlugPage({ params }: { params: Params }) {
  const slug = params.slug
  const postContent = await getPostdata(slug, '_events')
  const parsed = matter(postContent) as any
  const mdxSource = await mdxSerialize(parsed.content)

  // const allEvents = getSortedPosts({ directory: '_events' })
  // const currentIndex = allEvents.findIndex((p) => p.slug === slug)
  // const nextPost = currentIndex === allEvents.length - 1 ? null : allEvents[currentIndex + 1]
  // const prevPost = currentIndex === 0 ? null : allEvents[currentIndex - 1]

  return (
    <EventRenderer
      event={{
        slug,
        source: parsed.content,
        ...parsed.data,
        content: mdxSource,
      }}
      // prevPost={prevPost as Event & EventData}
      // nextPost={nextPost as Event & EventData}
    />
  )
}
