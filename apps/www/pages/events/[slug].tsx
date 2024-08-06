import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { GetStaticProps, InferGetStaticPropsType } from 'next'
import { MDXRemote } from 'next-mdx-remote'
import { NextSeo } from 'next-seo'
import dayjs from 'dayjs'
import matter from 'gray-matter'

import authors from 'lib/authors.json'
import { isNotNullOrUndefined } from '~/lib/helpers'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { mdxSerialize } from '~/lib/mdx/mdxSerialize'
import { getAllPostSlugs, getPostdata } from '~/lib/posts'

import { Button } from 'ui'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import ShareArticleActions from '../../components/Blog/ShareArticleActions'

type EventType = 'webinar' | 'launch_week' | 'conference'

type EventData = {
  title: string
  subtitle?: string
  registration_url?: string
  description: string
  type: EventType
  duration?: string
  timezone?: string
  tags?: string[]
  date: string
  toc_depth?: number
  speakers: string
  image?: string
  thumb?: string
  youtubeHero?: string
  author_url?: string
  launchweek?: number | string
  meta_title?: string
  meta_description?: string
  video?: string
}

type EventPageProps = {
  event: Event & EventData
}

type MatterReturn = {
  data: EventData
  content: string
}

type Event = {
  slug: string
  source: string
  content: any
}

type Params = {
  slug: string
}

export async function getStaticPaths() {
  const paths = getAllPostSlugs('_events')
  return {
    paths,
    fallback: false,
  }
}

export const getStaticProps: GetStaticProps<EventPageProps, Params> = async ({ params }) => {
  if (params?.slug === undefined) {
    throw new Error('Missing slug for pages/event/[slug].tsx')
  }

  const filePath = `${params.slug}`
  const postContent = await getPostdata(filePath, '_events')
  const { data, content } = matter(postContent) as unknown as MatterReturn

  const mdxSource: any = await mdxSerialize(content)

  return {
    props: {
      event: {
        slug: `${params.slug}`,
        source: content,
        ...data,
        content: mdxSource,
      },
    },
  }
}

const EventPage = ({ event }: InferGetStaticPropsType<typeof getStaticProps>) => {
  const content = event.content
  const speakersArray = event.speakers?.split(',')
  const speakers = speakersArray
    ?.map((speakerId: string) => {
      return authors.find((author) => author.author_id === speakerId)
    })
    .filter(isNotNullOrUndefined)

  const IS_REGISTRATION_OPEN = Date.parse(event.date) > Date.now()

  const meta = {
    title: event.meta_title ?? event.title,
    description: event.meta_description ?? event.description,
    url: `https://supabase.com/events/${event.slug}`,
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
      <DefaultLayout>
        <div className="flex flex-col w-full">
          <header className="bg-alternative w-full">
            <SectionContainer className="grid lg:min-h-[400px] h-full grid-cols-1 lg:grid-cols-2 gap-8 text-foreground-light">
              <div className="h-full flex flex-col justify-between">
                <div className="flex flex-col gap-2 md:gap-3 items-start mb-8">
                  <div className="flex flex-row text-sm">
                    <span className="uppercase text-brand font-mono">{event.type}</span>
                    <span className="mx-3 px-3 border-x">
                      {dayjs(event.date).format(`DD MMM YYYY [at] hA [${event.timezone}]`)}
                    </span>
                    <span className="">Duration: {event.duration}</span>
                  </div>

                  <h1 className="text-foreground text-3xl lg:text-4xl">{event.title}</h1>
                  <p>{event.subtitle}</p>
                  <Button
                    type="primary"
                    size="medium"
                    className="mt-2"
                    disabled={!IS_REGISTRATION_OPEN}
                    asChild
                  >
                    <Link href={event.registration_url ?? '#'}>
                      {IS_REGISTRATION_OPEN ? 'Register to this event' : 'Registrations are closed'}
                    </Link>
                  </Button>
                </div>
                <div className="flex flex-col">
                  <p>Share on</p>
                  <ShareArticleActions title={meta.title} slug={meta.url} />
                </div>
              </div>
              <div className="relative w-full aspect-[2/1] lg:aspect-[3/2] overflow-auto rounded-lg border">
                {/* <Image
                  src={`/images/events/` + (event.thumb ? event.thumb : event.image)}
                  fill
                  sizes="100%"
                  quality={100}
                  className="object-cover"
                  alt="event thumbnail"
                /> */}
              </div>
            </SectionContainer>
          </header>
          <SectionContainer className="grid lg:grid-cols-3 gap-12">
            <main className="lg:col-span-2">
              <div className="prose prose-docs">
                <h2 className="text-foreground-light text-sm font-mono uppercase">
                  About this event
                </h2>
                <MDXRemote {...content} components={mdxComponents()} />
              </div>
              <aside className="mt-8">
                <Button
                  type="primary"
                  size="medium"
                  className="mt-2"
                  disabled={!IS_REGISTRATION_OPEN}
                  asChild
                >
                  <Link href={event.registration_url ?? '#'}>
                    {IS_REGISTRATION_OPEN ? 'Register now' : 'Registrations are closed'}
                  </Link>
                </Button>
              </aside>
            </main>
            <aside className="order-first lg:order-last">
              {speakers && (
                <div className="flex flex-col gap-4">
                  <h2 className="text-foreground-light text-sm font-mono uppercase">Speakers</h2>
                  <ul className="list-none flex flex-col md:flex-row flex-wrap lg:flex-col gap-4 md:gap-8 lg:gap-4">
                    {speakers?.map((speaker) => (
                      <li key={speaker?.author_id} className="flex gap-4">
                        <div className="relative ring-background w-10 h-10 md:w-12 md:h-12 rounded-full ring-2">
                          {speaker?.author_image_url && (
                            <Image
                              src={speaker.author_image_url}
                              className="rounded-full object-cover border border-default w-full h-full"
                              alt={`${speaker.author} avatar`}
                              fill
                            />
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <p>{speaker?.author}</p>
                          <span className="text-xs text-foreground-light">{speaker?.position}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </SectionContainer>
        </div>
      </DefaultLayout>
    </>
  )
}

export default EventPage
