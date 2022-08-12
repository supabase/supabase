import {
  AnnotationIcon,
  NewspaperIcon,
  RssIcon,
  SparklesIcon,
  SpeakerphoneIcon,
} from '@heroicons/react/outline'
import { Badge } from '@supabase/ui'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import SectionHeader from '~/components/UI/SectionHeader'
import _days from './days.json'

const days = _days as WeekDayProps[]

type Article = {
  title: string
  url: string
  description?: string
}

type Announcement = {
  title: string
  url: string
  description?: string
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
}

export default function launchweek() {
  console.log(days)
  return (
    <DefaultLayout>
      <SectionContainer>
        <span>LaunchWeek 5 logo</span>
        <h1>header</h1>
        <SectionHeader title="hello" />
      </SectionContainer>
      <SectionContainer className="flex flex-col gap-16">
        {days.map((item: WeekDayProps) => {
          return <LaunchSection {...item} />
        })}
      </SectionContainer>
    </DefaultLayout>
  )
}

export const LaunchSection = (props: WeekDayProps) => {
  return (
    <div className="grid grid-cols-12 gap-3 lg:min-h-[256px] lg:gap-16">
      <div className="col-span-12 lg:col-span-4">
        {props.imgUrl ? (
          <img
            className="rounded border"
            src="/images/launchweek/launchweek-day-placeholder.jpg"
            alt="Supabase"
          />
        ) : (
          <div className="relative">
            <img
              className="top-0 left-0 rounded-md border drop-shadow-lg"
              src="/images/launchweek/launchweek-day-placeholder.jpg"
              alt="Supabase"
            />
            <div className="absolute top-0 left-0 flex flex-col gap-3 p-6">
              <span className="text-brand-900 text-6xl">Day {props.d}</span>
              <span className="text-scale-100 dark:text-scale-1200 ml-1 text-xl">{props.dd}</span>
            </div>
          </div>
        )}
      </div>
      <div className="col-span-12 flex flex-col gap-8 lg:col-span-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            {props.shipped ? <Badge>Shipped</Badge> : <Badge color="purple">Not shipped yet</Badge>}
            <span className="text-scale-1100 text-sm">{props.date}</span>
          </div>
          <h4 className="text-scale-1200 text-4xl">{props.title}</h4>
          {props.announcements && (
            <div>
              {props.announcements.map((announcement: Announcement) => (
                <Announcement {...announcement} />
              ))}
            </div>
          )}
          <p className="text-scale-1100 text-base">{props.description}</p>
        </div>
        <div>
          {props.articles &&
            props.articles.map((article: Article) => <ArticleButton {...article} />)}
        </div>
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
  )
}

export const ProductButton = (props: Article) => {
  return (
    <div className="mr-2 mb-2 inline-block">
      <button
        className=" 
            text-brand-1200
            hover:bg-scale-300 border-scale-500 flex items-start gap-3 rounded-md border bg-transparent p-3 
            px-6 drop-shadow-sm
            transition"
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

export const Announcement = (props: Article) => {
  return (
    <button className="text-blue-1200 flex items-start gap-6 rounded-full border border-blue-500 bg-blue-200 p-3 px-5">
      <div className="w-12 text-blue-900">
        {/* <SpeakerphoneIcon strokeWidth={1} /> */}
        <img src="/images/launchweek/soc-2-icon.png" alt="Supabase" />
      </div>
      <div className="flex flex-col items-start gap-0">
        <span className="text-xl">{props.title}</span>
        <span className="text-blue-1000">{props.description}</span>
      </div>
    </button>
  )
}
