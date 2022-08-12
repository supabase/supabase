import {
  ArrowSmDownIcon,
  ArrowSmLeftIcon,
  NewspaperIcon,
  SparklesIcon,
  TruckIcon,
} from '@heroicons/react/outline'
import { Badge, Button } from '@supabase/ui'
import authors from 'lib/authors.json'
import Image from 'next/image'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import _days from './days_new_format.json'
import HackathonSection from './HackathonSection'
import LaunchHero from './LaunchHero'

const days = _days as WeekDayProps[]

// to do

// update the copy on the 'fireside chat'
//
// add full stops
// check spelling on schedule.

type Article = {
  title: string
  url: string
  description?: string
}

type Announcement = {
  title: string
  url: string
  description?: string
  type: 'soc2' | 'producthunt'
}

type Product = {
  title: string
  url: string
  description?: string
}

interface WeekDayProps {
  shipped: boolean
  title: string
  description: string
  date: string
  imgUrl?: string
  d?: number
  dd?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'
  articles?: Article[]
  announcements?: Announcement[]
  products?: Announcement[]
  index: number
}

export default function launchweek() {
  const shippingHasStarted = days[0].shipped

  const authorArray = ['paul_copplestone', 'ant_wilson']
  const author = []
  for (let i = 0; i < authorArray.length; i++) {
    author.push(
      // @ts-ignore
      authors.find((authors: string) => {
        // @ts-ignore
        return authors.author_id === authorArray[i]
      })
    )
  }

  return (
    <>
      <div className="launch-week-gradientBg"></div>
      <DefaultLayout>
        <SectionContainer className="flex flex-col gap-8  md:gap-16 lg:gap-32">
          <img
            src="/images/launchweek/launchweek-logo--light.svg"
            className="md:40 w-28 dark:hidden lg:w-48"
          />
          <img
            src="/images/launchweek/launchweek-logo--dark.svg"
            className="md:40 hidden w-28 dark:block lg:w-48"
          />
          <LaunchHero />
          {!shippingHasStarted && (
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-12 gap-8 md:gap-16">
                <div className="relative col-span-12 drop-shadow-lg lg:col-span-8">
                  <img
                    className="z-10 w-full rounded-xl border"
                    src="/images/launchweek/launchweek-day-placeholder.jpg"
                    alt="Supabase"
                  />
                  <iframe
                    className="absolute top-0 w-full rounded-xl"
                    // width="640"
                    height="100%"
                    src="https://www.youtube-nocookie.com/embed/k03mZzoAhkg"
                    style={{ top: 0, left: 0 }}
                    frameBorder="0"
                    allow="autoplay; modestbranding; encrypted-media"
                  ></iframe>
                </div>
                <div
                  className="
                  col-span-12
                  grid
                  grid-cols-1
                  gap-8

                  md:grid
                  md:grid-cols-2
                  md:gap-16

                  lg:col-span-4 
                  lg:flex
                  lg:flex-col
                  lg:justify-between
                "
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-3">
                      {author.map((author: any) => {
                        return (
                          <Image
                            key={author.author_id + ' profile image'}
                            src={author.author_image_url}
                            className="dark:border-dark rounded-lg border"
                            width="54px"
                            height="54px"
                          />
                        )
                      })}
                    </div>
                    <div className="flex flex-col gap-3">
                      <h4 className="text-scale-1200 text-base">Founders Fireside Chat</h4>
                      <p className="text-scale-1100 text-sm">
                        Our two co-founders, Copple and Ant, discuss open source development and the
                        future of Supabase.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="text-scale-1100 w-8">
                      <NewspaperIcon strokeWidth={1} />
                    </div>
                    <div>
                      <h3 className="text-scale-1200 text-base">Supabase Series B</h3>
                      <p className="text-scale-1100 text-sm">
                        Supabase raised $80M in May, bringing our total funding to $116M.
                      </p>
                    </div>
                    <div>
                      <Button type="default">Read more</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SectionContainer>
        <SectionContainer
          className={['grid flex-col gap-16', !shippingHasStarted && 'lg:grid-cols-2'].join(' ')}
        >
          {!shippingHasStarted && (
            <div className="flex flex-col gap-16">
              <div className="text-scale-1200 flex flex-col gap-4 text-lg">
                <h3 className="text-scale-1200 text-4xl">Week Schedule</h3>
                <p className="md:max-w-lg">
                  Each day of the week we will announce a new item, every day, from Monday to
                  Friday.
                </p>
                <p className="text-scale-1100 text-base md:max-w-lg">
                  The first launch will be on Monday 08:00 PT | 11:00 ET.
                </p>
              </div>
              <div className="dark:bg-scale-300 flex flex-col gap-0 overflow-hidden rounded-md border border bg-white shadow-sm md:max-w-lg">
                <div className="flex flex-col gap-3 p-10">
                  <h3 className="text-scale-1200 text-lg">You can still win a lucky gold ticket</h3>
                  <p className="text-scale-1100 text-sm">
                    A few of the lucky attendees for Launch Week will get a limited edition Supabase
                    goodie bag.
                  </p>
                </div>
                <div className="px-10">
                  <Button type="default">Get a ticket</Button>
                </div>
                <img src="/images/launchweek/gold-ticket.svg" className="w-full" />
              </div>
            </div>
          )}
          <div>
            {days.map((item: WeekDayProps, i) => {
              return (
                <LaunchSection
                  key={'launchweek-item ' + item.title}
                  {...item}
                  index={i}
                  // shippingHasStarted={shippingHasStarted}
                />
              )
            })}
          </div>
        </SectionContainer>
        <SectionContainer>
          <HackathonSection />
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

export const LaunchSection = (props: WeekDayProps) => {
  const lastIndex = props.index === days.length - 1
  const nextDayNotShipped = props.shipped && !days[props.index + 1]?.shipped

  return (
    <div className="grid grid-cols-12">
      {props.shippingHasStarted && (
        <div className="col-span-12 pb-16 lg:col-span-6 lg:pr-8">
          {!props.shipped ? (
            <div className="relative overflow-hidden rounded-xl">
              <img
                className="opacity-30"
                src="/images/launchweek/launchweek-day-placeholder.jpg"
                alt="Supabase"
              />
            </div>
          ) : (
            <div className="relative">
              <img
                className="top-0 left-0 rounded-xl border drop-shadow-lg"
                src="/images/launchweek/security.jpg"
                alt="Supabase"
              />
            </div>
          )}
        </div>
      )}
      <div
        className={[
          `relative col-span-12 flex flex-col
            gap-8
            lg:pl-8
      `,
          props.shipped ? 'border-brand-900' : 'border-purple-700',
          props.shippingHasStarted && 'lg:col-span-6',
          !lastIndex && 'pb-16',
        ].join(' ')}
      >
        {/* START timeline line */}
        {props.index !== days.length - 1 && (
          <div
            className={[
              'launch-week-timeline-border absolute left-0 top-[4px] h-full border-l',
              nextDayNotShipped
                ? 'launch-week-timeline-border--approaching'
                : props.shipped
                ? 'border-brand-900'
                : 'border-purple-700',
            ].join(' ')}
          ></div>
        )}
        {/* END timeline line */}

        <div className="flex flex-col gap-4 pl-4 lg:pl-0">
          {/* START timeline dot */}
          <div
            className={[
              'absolute mt-[4px] -ml-[21px] h-3 w-3 rounded-full border lg:-ml-[37.5px]',
              props.shipped ? 'border-brand-900 bg-brand-400' : 'border-purple-900 bg-purple-300',
            ].join(' ')}
          ></div>
          {/* END timeline dot */}

          <div className="flex items-center gap-3">
            <span className="text-scale-1100 text-sm">{props.date}</span>
            {props.shipped ? (
              <Badge>
                <div className="flex items-center gap-2">
                  <div className="w-4">
                    <TruckIcon />
                  </div>{' '}
                  Shipped
                </div>
              </Badge>
            ) : (
              <Badge color="purple">Not shipped yet</Badge>
            )}
          </div>
          <h4 className="text-scale-1200 text-2xl md:text-3xl lg:text-4xl">
            {props.shipped ? props.title : props.dd + ' 08:00 PT | 11:00 ET'}
          </h4>

          {/* {props.shipped && props.announcements && (
            <div>
              {props.announcements.map((announcement: Announcement) => (
                <Announcement {...announcement} />
              ))}
            </div>
          )} */}
          {props.shipped && <p className="text-scale-1100 text-base">{props.description}</p>}
        </div>
        {props.shipped && (
          <div className="flex flex-col gap-12">
            {props.articles &&
              props.articles.map((article: Article) => (
                <div
                  className="
              dark:bg-scale-300 rounded border bg-white
              "
                >
                  <div className="p-6 px-10">
                    <ArticleButtonListItem {...article} />
                  </div>

                  {/* border */}
                  <div className="bg-scale-300 dark:bg-scale-400 h-px w-full"></div>

                  <div className="flex flex-col gap-6 p-6 px-10 pb-10">
                    <h3 className="text-scale-1100 mb-2">New releases</h3>
                    {article.products &&
                      article.products.map((product: Product) => (
                        <ProductButtonListItem {...product} />
                      ))}
                  </div>
                </div>
              ))}
          </div>
        )}
        <div className="">
          {props.products &&
            props.products.map((product: Product) => <ProductButton {...product} />)}
        </div>
      </div>
    </div>
  )
}

export const ArticleButton = (props: Article) => {
  return (
    <div className="mr-2 mb-2 inline-block">
      <button
        className="
        bg-scale-100
        dark:bg-scale-300 text-scale-1200 
        hover:bg-scale-200 
        dark:hover:bg-scale-400 border-scale-500 
        flex items-start gap-3 rounded-md 
        border p-3 
        px-6 drop-shadow-sm transition"
      >
        <div className="w-6">
          <NewspaperIcon strokeWidth={1} />
        </div>
        <div className="flex flex-col items-start gap-0">
          <span className="text-base">{props.title}</span>
          <span className="text-scale-1100 text-sm">{props.description}</span>
        </div>
      </button>
    </div>
  )
}

export const ProductButton = (props: Article) => {
  return (
    <div className="mr-2 mb-2 inline-block">
      <button
        className=" 
            text-brand-1200
            hover:bg-scale-300 border-scale-500 flex items-start gap-3 rounded-md border bg-transparent p-3 
            px-6 transition
            dark:drop-shadow-sm"
      >
        <div className="w-6">
          <SparklesIcon strokeWidth={1} />
        </div>
        <div className="flex flex-col items-start gap-0">
          <span className="text-base">{props.title}</span>
          <span className="text-scale-900 text-sm">{props.description}</span>
        </div>
      </button>
    </div>
  )
}

export const ArticleButtonListItem = (props: Article) => {
  return (
    <div className="mr-2 mb-2 inline-block">
      <button
        className="
        
        text-scale-1200 
        flex items-start gap-3 
        
        transition"
      >
        <div className="w-10">
          <NewspaperIcon strokeWidth={1} />
        </div>
        <div className="flex flex-col items-start gap-0">
          <span className="text-xl">{props.title}</span>
          <span className="text-scale-1100 text-sm">{props.description}</span>
        </div>
      </button>
    </div>
  )
}

export const ProductButtonListItem = (props: Article) => {
  return (
    <div className="inline-block">
      <button
        className=" 
            text-brand-1200
            flex items-start gap-3 bg-transparent
            transition
            dark:drop-shadow-sm"
      >
        <div className="w-6">
          <SparklesIcon strokeWidth={1} />
        </div>
        <div className="flex flex-col items-start gap-0">
          <span className="text-base">{props.title}</span>
          <span className="text-scale-900 text-sm">{props.description}</span>
        </div>
      </button>
    </div>
  )
}

export const Announcement = (props: Announcement) => {
  const containerClasses = []
  let imgSrc = ''
  let imgAlt = ''

  switch (props.type) {
    case 'soc2':
      containerClasses.push('text-blue-1200 border-blue-500 bg-blue-200')
      imgSrc = '/images/launchweek/soc-2-icon.png'
      imgAlt = 'soc2'
      break

    case 'producthunt':
      containerClasses.push(
        'text-amber-1200 border-amber-500 dark:border-amber-500 bg-amber-200 dark:bg-amber-300'
      )
      imgSrc =
        'https://www.pngkey.com/png/full/1-10768_product-hunt-original-logo-product-hunt-kitty.png'
      imgAlt = 'producthunt'
    default:
      break
  }
  return (
    <button
      className={[
        'flex items-start gap-6 rounded-full border p-3 px-6 pr-8',
        containerClasses,
      ].join(' ')}
    >
      <div className="w-12 text-blue-900">
        <img src={imgSrc} alt={imgAlt} />
      </div>
      <div className="flex flex-col items-start gap-0">
        <span className="text-xl">{props.title}</span>
        <span className="text-blue-1000">{props.description}</span>
      </div>
    </button>
  )
}
