import React from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { useRouter } from 'next/router'
import { MDXRemote } from 'next-mdx-remote'
import { NextSeo } from 'next-seo'
import dayjs from 'dayjs'
import matter from 'gray-matter'
import {
  DesktopComputerIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  HandIcon,
} from '@heroicons/react/solid'
import capitalize from 'lodash/capitalize'
import { ChevronLeft, X as XIcon } from 'lucide-react'

import authors from 'lib/authors.json'
import { isNotNullOrUndefined } from '~/lib/helpers'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { mdxSerialize } from '~/lib/mdx/mdxSerialize'
import { getAllPostSlugs, getPostdata } from '~/lib/posts'
import { isBrowser, useTelemetryProps } from 'common'
import Telemetry, { TelemetryEvent } from '~/lib/telemetry'
import gaEvents from '~/lib/gaEvents'

import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import advancedFormat from 'dayjs/plugin/advancedFormat'

import { Button, Image } from 'ui'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import ShareArticleActions from '~/components/Blog/ShareArticleActions'

import * as supabaseLogoWordmarkDark from 'common/assets/images/supabase-logo-wordmark--dark.png'
import * as supabaseLogoWordmarkLight from 'common/assets/images/supabase-logo-wordmark--light.png'

import type { GetStaticProps, InferGetStaticPropsType } from 'next'
import type Author from '~/types/author'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(advancedFormat)

type EventType = 'webinar' | 'meetup' | 'conference' | 'talk' | 'hackathon' | 'launch_week'

type CTA = {
  url: string
  label?: string
  disabled_label?: string
  disabled?: boolean
  target?: '_blank' | '_self'
}

type CompanyType = {
  name: string
  website_url: string
  logo: string
  logo_light: string
}

interface EventData {
  title: string
  subtitle?: string
  main_cta?: CTA
  description: string
  type: EventType
  company?: CompanyType
  onDemand?: boolean
  disable_page_build?: boolean
  duration?: string
  timezone?: string
  tags?: string[]
  date: string
  end_date?: string
  speakers: string
  speakers_label?: string
  og_image?: string
  thumb?: string
  thumb_light?: string
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

  if (data.disable_page_build) {
    return {
      notFound: true,
    }
  }

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
    .filter(isNotNullOrUndefined) as Author[]
  const hadEndDate = event.end_date?.length

  const IS_REGISTRATION_OPEN =
    event.onDemand ||
    (hadEndDate ? Date.parse(event.end_date!) > Date.now() : Date.parse(event.date) > Date.now())

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

  const eventIcons = {
    conference: (props: any) => <VideoCameraIcon {...props} />,
    hackathon: (props: any) => <DesktopComputerIcon {...props} />,
    launch_week: (props: any) => <VideoCameraIcon {...props} />,
    meetup: (props: any) => <HandIcon {...props} />,
    talk: (props: any) => <MicrophoneIcon {...props} />,
    webinar: (props: any) => <VideoCameraIcon {...props} />,
  }

  const Icon = eventIcons[event.type]

  const router = useRouter()
  const telemetryProps = useTelemetryProps()
  const sendTelemetryEvent = async (event: TelemetryEvent) => {
    await Telemetry.sendEvent(event, telemetryProps, router)
  }

  const origin = isBrowser
    ? location.origin
    : process.env.VERCEL_URL
      ? process.env.VERCEL_URL
      : 'https://supabase.com'

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
      <DefaultLayout>
        <div className="flex flex-col w-full bg-alternative border-b border-muted">
          <SectionContainer className="!py-2 flex items-start">
            <Link
              href="/events"
              className="text-foreground-lighter hover:text-foreground flex !m-0 !p-0 !leading-3 gap-1 cursor-pointer items-center text-sm transition"
            >
              <ChevronLeft className="w-4 h-4" />
              All Events
            </Link>
          </SectionContainer>
        </div>

        <div className="flex flex-col w-full">
          <header className="relative bg-alternative w-full overflow-hidden">
            <NextImage
              src="/images/events/events-bg-dark.svg"
              alt=""
              fill
              sizes="100%"
              className="not-sr-only hidden dark:block w-full h-full absolute inset-0 object-cover object-bottom"
            />
            <NextImage
              src="/images/events/events-bg-light.svg"
              alt=""
              fill
              sizes="100%"
              className="not-sr-only block dark:hidden w-full h-full absolute inset-0 object-cover object-bottom"
            />
            <SectionContainer
              className="
                relative z-10
                lg:min-h-[400px] h-full
                grid grid-cols-1 xl:grid-cols-2
                gap-8
                text-foreground-light
                !py-10 md:!py-16
              "
            >
              <div className="h-full flex flex-col justify-between">
                <div className="flex flex-col gap-2 md:gap-3 items-start mb-8">
                  <div className="flex flex-row text-sm items-center flex-wrap">
                    <Icon className="hidden sm:inline-block w-4 h-4 text-brand mr-2" />
                    <span className="uppercase text-brand font-mono">{event.type}</span>
                    <span className="mx-3 px-3 border-x">
                      {dayjs(event.date).tz(event.timezone).format(`DD MMM YYYY [at] hA z`)}
                    </span>
                    <span className="">Duration: {event.duration}</span>
                  </div>

                  <h1 className="text-foreground text-3xl md:text-4xl xl:pr-9">{event.title}</h1>
                  <p>{event.subtitle}</p>
                  <Button
                    type="primary"
                    size="medium"
                    className="mt-2"
                    disabled={
                      !IS_REGISTRATION_OPEN || event.main_cta?.disabled || event.main_cta?.disabled
                    }
                    asChild
                  >
                    <Link
                      href={event.main_cta?.url ?? '#'}
                      target={event.main_cta?.target ? event.main_cta?.target : undefined}
                      onClick={() => sendTelemetryEvent(gaEvents['www_event'])}
                    >
                      {IS_REGISTRATION_OPEN
                        ? event.main_cta?.label
                          ? event.main_cta?.label
                          : 'Register to this event'
                        : event.main_cta?.disabled_label
                          ? event.main_cta?.disabled_label
                          : 'Registrations are closed'}
                    </Link>
                  </Button>
                </div>
                <div className="flex flex-col text-sm">
                  <span>Share on</span>
                  <ShareArticleActions title={meta.title} slug={meta.url} basePath="" />
                </div>
              </div>
              {!!event.thumb && (
                <div className="relative w-full aspect-[5/3] lg:aspect-[3/2] overflow-hidden border shadow-lg rounded-lg z-10">
                  <Image
                    src={{
                      dark: `/images/events/` + event.thumb,
                      light:
                        `/images/events/` +
                        (!!event.thumb_light ? event.thumb_light! : event.thumb),
                    }}
                    fill
                    sizes="100%"
                    quality={100}
                    containerClassName="
                      h-full
                      [&.next-image--dynamic-fill_img]:!h-full
                      [&.next-image--dynamic-fill_img]:!object-cover
                      "
                    alt={`${event.title} thumbnail`}
                  />
                </div>
              )}
            </SectionContainer>
          </header>
          <SectionContainer className="grid lg:grid-cols-3 gap-12 !py-10 md:!py-16">
            {event.company && (
              <div className="order-first lg:col-span-full flex items-center gap-4 md:gap-6 lg:mb-4">
                <figure className="h-6 [&_.next-image--dynamic-fill_img]:!h-full">
                  <Image
                    src={{ dark: supabaseLogoWordmarkDark, light: supabaseLogoWordmarkLight }}
                    alt="Supabase Logo"
                    width={160}
                    height={30}
                    sizes="100%"
                    className="!relative object-contain object-left"
                    containerClassName="h-full object-contain object-left !rounded-none !border-none"
                    priority
                  />
                </figure>
                <XIcon className="w-4 h-4 text-foreground-lighter" />
                <Link
                  href={event.company?.website_url ?? '#'}
                  target="_blank"
                  className="h-5 aspect-[9/1] transition-opacity opacity-100 hover:opacity-90 [&_.next-image--dynamic-fill_img]:!h-full"
                >
                  <Image
                    src={{ dark: event.company?.logo, light: event.company?.logo_light }}
                    alt={`${event.company?.name} Logo`}
                    width={160}
                    height={30}
                    sizes="100%"
                    className="!relative object-contain object-left"
                    containerClassName="h-full object-contain object-left !rounded-none !border-none"
                    priority
                  />
                </Link>
              </div>
            )}
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
                  disabled={!IS_REGISTRATION_OPEN || event.main_cta?.disabled}
                  asChild
                >
                  <Link
                    href={event.main_cta?.url ?? '#'}
                    aria-disabled={!IS_REGISTRATION_OPEN}
                    target={event.main_cta?.target ? event.main_cta?.target : undefined}
                  >
                    {IS_REGISTRATION_OPEN
                      ? event.main_cta?.label
                        ? event.main_cta?.label
                        : 'Register now'
                      : event.main_cta?.disabled_label
                        ? event.main_cta?.disabled_label
                        : 'Registrations are closed'}
                  </Link>
                </Button>
              </aside>
            </main>
            <aside className="order-first lg:order-last">
              {speakers && (
                <div className="flex flex-col gap-4">
                  <h2 className="text-foreground-light text-sm font-mono uppercase">
                    {event.speakers_label ?? 'Speakers'}
                  </h2>
                  <ul className="list-none flex flex-col md:flex-row flex-wrap lg:flex-col gap-4 md:gap-8 lg:gap-4">
                    {speakers?.map((speaker) => (
                      <li key={speaker?.author_id}>
                        <Link href={speaker.author_url} target="_blank" className="flex gap-4">
                          <div className="relative ring-background w-10 h-10 md:w-12 md:h-12 rounded-full ring-2 cursor-pointer">
                            {speaker?.author_image_url && (
                              <NextImage
                                src={speaker.author_image_url}
                                className="rounded-full object-cover border border-default w-full h-full"
                                alt={`${speaker.author} avatar`}
                                width={100}
                                height={100}
                                draggable={false}
                              />
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <p>{speaker?.author}</p>
                            <span className="text-xs text-foreground-light">
                              {speaker?.position}
                              {speaker?.company ? `, ${speaker?.company}` : ', Supabase'}
                            </span>
                          </div>
                        </Link>
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
